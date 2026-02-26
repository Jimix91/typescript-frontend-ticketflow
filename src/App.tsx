import { useCallback, useEffect, useMemo, useState } from "react";
import { api, setApiToken } from "./api";
import { ConfirmModal } from "./components/ConfirmModal";
import {
  CreateTicketPage,
  DashboardPage,
  EditTicketPage,
  TicketDetailPage,
  TicketResolutionPage,
} from "./pages";
import { Ticket, TicketFormValues, TicketStatus, User } from "./types";

type Page = "dashboard" | "create" | "detail" | "edit" | "resolution";

function App() {
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [authToken, setAuthTokenState] = useState<string | null>(() => localStorage.getItem("ticketflow-token"));
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");

  const [users, setUsers] = useState<User[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [page, setPage] = useState<Page>("dashboard");
  const [activeTicketId, setActiveTicketId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [liveNotice, setLiveNotice] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem("ticketflow-theme") === "dark";
  });

  const activeTicket = useMemo(
    () => tickets.find((ticket) => ticket.id === activeTicketId) ?? null,
    [tickets, activeTicketId],
  );

  const loadData = useCallback(async (showLoader: boolean) => {
    try {
      if (!authToken) {
        return;
      }
      if (showLoader) {
        setLoading(true);
      }
      const [usersResponse, tasksResponse] = await Promise.all([api.getUsers(), api.getTasks()]);
      setUsers(usersResponse);
      setTickets((prev) => {
        const changed =
          prev.length !== tasksResponse.length ||
          prev.some((ticket) => {
            const next = tasksResponse.find((item) => item.id === ticket.id);
            return !next || next.updatedAt !== ticket.updatedAt || next.status !== ticket.status;
          });

        if (!showLoader && changed) {
          setLiveNotice("Live update: tickets changed");
        }

        return tasksResponse;
      });
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to load data");
    } finally {
      if (showLoader) {
        setLoading(false);
      }
    }
  }, [authToken]);

  useEffect(() => {
    setApiToken(authToken);

    if (!authToken) {
      setLoading(false);
      setAuthUser(null);
      setUsers([]);
      setTickets([]);
      return;
    }

    const bootstrap = async () => {
      try {
        const me = await api.me();
        setAuthUser(me);
        await loadData(true);
      } catch (_error) {
        setAuthTokenState(null);
        localStorage.removeItem("ticketflow-token");
        setApiToken(null);
        setAuthUser(null);
        setLoading(false);
      }
    };

    void bootstrap();
  }, [authToken, loadData]);

  useEffect(() => {
    if (!authToken) {
      return;
    }

    const intervalId = setInterval(() => {
      void loadData(false);
    }, 7000);

    return () => clearInterval(intervalId);
  }, [loadData]);

  useEffect(() => {
    document.body.classList.toggle("theme-dark", isDarkMode);
    localStorage.setItem("ticketflow-theme", isDarkMode ? "dark" : "light");
  }, [isDarkMode]);

  useEffect(() => {
    if (!liveNotice) {
      return;
    }

    const timeoutId = setTimeout(() => setLiveNotice(null), 2500);
    return () => clearTimeout(timeoutId);
  }, [liveNotice]);

  const handleCreateTicket = async (values: TicketFormValues) => {
    try {
      const createdTask = await api.createTask({
        title: values.title,
        description: values.description,
        imageUrl: values.imageUrl,
        status: values.status,
        priority: values.priority,
        assignedToId: values.assignedToId,
      });
      setTickets((prev) => [createdTask, ...prev]);
      setPage("dashboard");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Could not create task");
    }
  };

  const handleUpdateTicket = async (ticketId: number, values: TicketFormValues) => {
    try {
      const updatedTask = await api.updateTask(ticketId, {
        title: values.title,
        description: values.description,
        imageUrl: values.imageUrl,
        status: values.status,
        priority: values.priority,
        assignedToId: values.assignedToId,
      });
      setTickets((prev) => prev.map((item) => (item.id === ticketId ? updatedTask : item)));
      setActiveTicketId(ticketId);
      setPage("detail");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Could not update task");
    }
  };

  const handleMoveStatus = async (ticketId: number, status: TicketStatus) => {
    try {
      const target = tickets.find((ticket) => ticket.id === ticketId);
      if (!target || target.status === status) {
        return;
      }

      const updated = await api.updateTask(ticketId, { status });
      setTickets((prev) => prev.map((ticket) => (ticket.id === ticketId ? updated : ticket)));
      setLiveNotice(`Ticket #${ticketId} moved to ${status}`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Could not update ticket status");
    }
  };

  const handleDeleteTicket = async (ticketId: number) => {
    try {
      await api.deleteTask(ticketId);
      setTickets((prev) => prev.filter((task) => task.id !== ticketId));
      setConfirmDeleteId(null);
      setPage("dashboard");
      setActiveTicketId(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Could not delete task");
    }
  };

  const refreshTicket = async (ticketId: number) => {
    const freshTicket = await api.getTaskById(ticketId);
    setTickets((prev) => {
      const exists = prev.some((ticket) => ticket.id === ticketId);
      if (!exists) {
        return [freshTicket, ...prev];
      }

      return prev.map((ticket) => (ticket.id === ticketId ? freshTicket : ticket));
    });
    return freshTicket;
  };

  const openTicketDetail = async (ticketId: number) => {
    let targetTicket = tickets.find((ticket) => ticket.id === ticketId);
    try {
      targetTicket = await refreshTicket(ticketId);
    } catch (_error) {
    }

    setActiveTicketId(ticketId);

    const shouldOpenResolution =
      authUser?.role === "AGENT" &&
      targetTicket?.assignedToId === authUser.id;

    setPage(shouldOpenResolution ? "resolution" : "detail");
  };

  const openTicketEdit = async (ticketId: number) => {
    try {
      await refreshTicket(ticketId);
    } catch (_error) {
    }

    setActiveTicketId(ticketId);
    setPage("edit");
  };

  const persistToken = (token: string) => {
    setAuthTokenState(token);
    localStorage.setItem("ticketflow-token", token);
    setApiToken(token);
  };

  const handleLogin = async () => {
    try {
      const response = await api.login({
        email: authEmail.trim(),
        password: authPassword,
      });

      persistToken(response.token);
      setAuthUser(response.user);
      setAuthPassword("");
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Login failed");
    }
  };

  const handleRegister = async () => {
    try {
      const response = await api.register({
        name: authName.trim(),
        email: authEmail.trim(),
        password: authPassword,
        role: "EMPLOYEE",
      });

      persistToken(response.token);
      setAuthUser(response.user);
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Register failed");
    }
  };

  const handleLogout = () => {
    setAuthTokenState(null);
    setApiToken(null);
    localStorage.removeItem("ticketflow-token");
    setAuthUser(null);
    setUsers([]);
    setTickets([]);
    setPage("dashboard");
  };

  if (loading) {
    return <main className="container">Loading...</main>;
  }

  if (!authToken || !authUser) {
    return (
      <main className="container">
        <header className="page-header">
          <h1>TicketFlow – Internal IT Support Management System</h1>
        </header>

        {errorMessage && <p className="error">{errorMessage}</p>}

        <section className="card grid-form">
          <h2>{authMode === "login" ? "Log in" : "Create account"}</h2>

          {authMode === "register" && (
            <input
              placeholder="Your name"
              value={authName}
              onChange={(event) => setAuthName(event.target.value)}
            />
          )}

          <input
            type="email"
            placeholder="Email"
            value={authEmail}
            onChange={(event) => setAuthEmail(event.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            value={authPassword}
            onChange={(event) => setAuthPassword(event.target.value)}
          />

          <div className="actions">
            {authMode === "login" ? (
              <button onClick={() => void handleLogin()}>Log in</button>
            ) : (
              <button onClick={() => void handleRegister()}>Register</button>
            )}
            <button onClick={() => setAuthMode(authMode === "login" ? "register" : "login")}>
              {authMode === "login" ? "Need an account?" : "Already have an account?"}
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="container">
      <header className="page-header">
        <h1>TicketFlow – Internal IT Support Management System</h1>
        <div className="actions">
          <span>{authUser.name}</span>
          <button onClick={() => setPage("dashboard")}>Dashboard</button>
          <button onClick={() => setPage("create")} disabled={users.length === 0}>
            Create Ticket
          </button>
          <button onClick={() => setIsDarkMode((prev) => !prev)}>
            {isDarkMode ? "Light Mode" : "Dark Mode"}
          </button>
          <button onClick={handleLogout}>Log out</button>
        </div>
      </header>

      {liveNotice && <p className="live-notice">{liveNotice}</p>}

      {errorMessage && <p className="error">{errorMessage}</p>}
      {users.length === 0 && (
        <p className="card">Create at least one user from the API first (`POST /users`) to create tickets.</p>
      )}

      {page === "dashboard" && (
        <DashboardPage
          authUser={authUser}
          tickets={tickets}
          users={users}
          onView={(ticketId) => void openTicketDetail(ticketId)}
          onEdit={(ticketId) => void openTicketEdit(ticketId)}
          onDelete={(ticketId) => setConfirmDeleteId(ticketId)}
          onMoveStatus={handleMoveStatus}
        />
      )}

      {page === "create" && (
        <CreateTicketPage
          users={users}
          canEditStatus={authUser.role !== "EMPLOYEE"}
          onSubmit={handleCreateTicket}
          onCancel={() => setPage("dashboard")}
        />
      )}

      {page === "detail" && activeTicket && (
        <TicketDetailPage
          ticket={activeTicket}
          authUser={authUser}
          users={users}
          onBack={() => setPage("dashboard")}
          onEdit={() => void openTicketEdit(activeTicket.id)}
          onDelete={() => setConfirmDeleteId(activeTicket.id)}
        />
      )}

      {page === "resolution" && activeTicket && authUser && (
        <TicketResolutionPage
          ticket={activeTicket}
          authUser={authUser}
          onBack={() => setPage("dashboard")}
          onTicketUpdate={(updated) => {
            setTickets((prev) => prev.map((ticket) => (ticket.id === updated.id ? updated : ticket)));
          }}
        />
      )}

      {page === "edit" && activeTicket && (
        <EditTicketPage
          ticket={activeTicket}
          users={users}
          canEditStatus={authUser.role !== "EMPLOYEE"}
          onSubmit={(values) => handleUpdateTicket(activeTicket.id, values)}
          onCancel={() => setPage("detail")}
        />
      )}

      {((page === "detail" || page === "edit" || page === "resolution") && !activeTicket) && (
        <section className="card">
          <p>Ticket not found.</p>
          <button onClick={() => setPage("dashboard")}>Back to dashboard</button>
        </section>
      )}

      <ConfirmModal
        open={confirmDeleteId !== null}
        title="Delete Ticket"
        message="Are you sure you want to delete this ticket?"
        onCancel={() => setConfirmDeleteId(null)}
        onConfirm={() => {
          if (confirmDeleteId !== null) {
            void handleDeleteTicket(confirmDeleteId);
          }
        }}
      />
    </main>
  );
}

export default App;
