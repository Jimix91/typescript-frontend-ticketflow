import { useCallback, useEffect, useMemo, useState } from "react";
import { api, setApiToken } from "./api";
import { ConfirmModal } from "./components/ConfirmModal";
import ticketflowLogo from "./media/logo4.png";
import {
  CreateTicketPage,
  DashboardPage,
  EditTicketPage,
  ProfilePage,
  TicketDetailPage,
  TicketResolutionPage,
} from "./pages";
import { Ticket, TicketFormValues, TicketStatus, User } from "./types";

type Page = "dashboard" | "create" | "detail" | "edit" | "resolution" | "profile";

function App() {
  const navButtonClass = "ui-nav-item";
  const summaryChipClass =
    "ui-chip inline-flex min-w-[9.5rem] items-center justify-center text-center";
  const primaryButtonClass = "ui-btn-primary";
  const secondaryButtonClass = "ui-btn-secondary";
  const navActiveClass = "ui-nav-item ui-nav-item-active";

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

  const scopedTickets = useMemo(() => {
    if (!authUser) {
      return [] as Ticket[];
    }

    if (authUser.role === "ADMIN") {
      return tickets;
    }

    if (authUser.role === "AGENT") {
      return tickets.filter((ticket) => ticket.assignedToId === authUser.id);
    }

    return tickets.filter((ticket) => ticket.createdById === authUser.id);
  }, [tickets, authUser]);

  const ticketSummary = useMemo(() => {
    const open = scopedTickets.filter((ticket) => ticket.status === "OPEN").length;
    const inProgress = scopedTickets.filter((ticket) => ticket.status === "IN_PROGRESS").length;
    const closed = scopedTickets.filter((ticket) => ticket.status === "CLOSED").length;

    return { open, inProgress, closed };
  }, [scopedTickets]);

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
    document.documentElement.classList.toggle("dark", isDarkMode);
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

  const isDashboardActive = page === "dashboard" || page === "detail" || page === "edit" || page === "resolution";

  if (loading) {
    return (
      <main className="ui-shell flex items-center justify-center">
        <p className="ui-card text-sm font-medium text-slate-700 dark:text-slate-200">
          Loading TicketFlow...
        </p>
      </main>
    );
  }

  if (!authToken || !authUser) {
    return (
      <main className="ui-shell flex items-center justify-center">
        <section className="w-full max-w-3xl rounded-3xl border border-slate-200 bg-surface-0 p-6 shadow-elevated dark:border-slate-800 dark:bg-surface-dark-1 sm:p-8">
          <header className="ui-logo-wrap mb-8">
            <div className="flex items-center justify-center">
              <img src={ticketflowLogo} alt="TicketFlow logo" className="ui-logo" />
            </div>
          </header>

          {errorMessage && (
            <p className="ui-alert-error mb-4">
              {errorMessage}
            </p>
          )}

          <section className="ui-card">
            <h2 className="ui-title mb-4">
              {authMode === "login" ? "Welcome back" : "Create your account"}
            </h2>

            <div className="grid gap-3">
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

              <div className="mt-2 flex flex-wrap gap-3">
                {authMode === "login" ? (
                  <button className={primaryButtonClass} onClick={() => void handleLogin()}>
                    Log in
                  </button>
                ) : (
                  <button className={primaryButtonClass} onClick={() => void handleRegister()}>
                    Register
                  </button>
                )}
                <button
                  className={secondaryButtonClass + " bg-transparent"}
                  onClick={() => setAuthMode(authMode === "login" ? "register" : "login")}
                >
                  {authMode === "login" ? "Need an account?" : "Already have an account?"}
                </button>
            </div>
            </div>
          </section>
        </section>
      </main>
    );
  }

  return (
    <main className="ui-shell lg:pl-[22rem]">
      <header className="ui-sidebar mb-5 lg:fixed lg:left-6 lg:top-6 lg:z-40 lg:flex lg:h-[calc(100vh-3rem)] lg:w-[20rem] lg:flex-col lg:overflow-y-auto lg:p-5">
        <div className="ui-sidebar-content">
          <div className="flex flex-col gap-4">
            <div className="ui-logo-wrap">
              <img src={ticketflowLogo} alt="TicketFlow logo" className="ui-logo" />
            </div>

            <div className="ui-nav-list">
              <button onClick={() => setPage("dashboard")} className={isDashboardActive ? navActiveClass : navButtonClass}>Dashboard</button>
              <button onClick={() => setPage("create")} disabled={users.length === 0} className={page === "create" ? navActiveClass : navButtonClass}>
                Create Ticket
              </button>
              <button onClick={() => setIsDarkMode((prev) => !prev)} className={navButtonClass}>
                {isDarkMode ? "Light Mode" : "Dark Mode"}
              </button>
              <button onClick={handleLogout} className={navButtonClass}>Log out</button>
            </div>
          </div>

          <div className="ui-sidebar-divider" />

          <div className="ui-profile-panel flex flex-col gap-4 lg:mt-auto">
            <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white/80 p-3 dark:border-slate-700 dark:bg-slate-900/70">
              <button
                onClick={() => setPage("profile")}
                className="inline-flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-300 bg-white text-lg font-bold text-slate-700 shadow-sm hover:border-brand-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-brand-600"
                aria-label="Open profile"
              >
                {authUser.profileImageUrl ? (
                  <img src={authUser.profileImageUrl} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  <span>{authUser.name.charAt(0).toUpperCase()}</span>
                )}
              </button>

              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-slate-800 dark:text-slate-100">{authUser.name}</p>
                <p className="truncate text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">{authUser.role ?? "User"}</p>
              </div>
            </div>

            <button
              onClick={() => setPage("profile")}
              className={page === "profile" ? navActiveClass : navButtonClass}
            >
              My Profile
            </button>

            <div className="flex w-full flex-col items-center gap-2">
              <span className={summaryChipClass}>My Open: {ticketSummary.open}</span>
              <span className={summaryChipClass}>My In Progress: {ticketSummary.inProgress}</span>
              <span className={summaryChipClass}>My Closed: {ticketSummary.closed}</span>
            </div>
          </div>
        </div>
      </header>

      {liveNotice && (
        <p className="ui-alert-success mb-4">
          {liveNotice}
        </p>
      )}

      {errorMessage && (
        <p className="ui-alert-error mb-4">
          {errorMessage}
        </p>
      )}
      {users.length === 0 && (
        <p className="ui-alert-info mb-4">
          Create at least one user from the API first (POST /users) to create tickets.
        </p>
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

      {page === "profile" && (
        <ProfilePage
          authUser={authUser}
          tickets={tickets}
          onBack={() => setPage("dashboard")}
          onProfileUpdated={(updatedUser) => {
            setAuthUser(updatedUser);
            setUsers((prev) => prev.map((item) => (item.id === updatedUser.id ? { ...item, ...updatedUser } : item)));
            setTickets((prev) =>
              prev.map((ticket) => ({
                ...ticket,
                createdBy: ticket.createdById === updatedUser.id ? { ...ticket.createdBy, ...updatedUser } : ticket.createdBy,
                assignedTo: ticket.assignedToId === updatedUser.id ? { ...ticket.assignedTo, ...updatedUser } : ticket.assignedTo,
              })),
            );
          }}
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

      {(page === "detail" || page === "edit" || page === "resolution") && !activeTicket && (
        <section className="ui-card">
          <p className="mb-4 text-sm text-slate-600 dark:text-slate-300">Ticket not found.</p>
          <button className={secondaryButtonClass} onClick={() => setPage("dashboard")}>Back to dashboard</button>
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
