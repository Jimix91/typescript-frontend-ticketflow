import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "./api";
import { ConfirmModal } from "./components/ConfirmModal";
import {
  CreateTicketPage,
  DashboardPage,
  EditTicketPage,
  TicketDetailPage,
} from "./pages";
import { Ticket, TicketFormValues, TicketStatus, User } from "./types";

type Page = "dashboard" | "create" | "detail" | "edit";

function App() {
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
  }, []);

  useEffect(() => {
    void loadData(true);
  }, [loadData]);

  useEffect(() => {
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
        status: values.status,
        priority: values.priority,
        createdById: values.createdById,
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

  const openTicketDetail = (ticketId: number) => {
    setActiveTicketId(ticketId);
    setPage("detail");
  };

  const openTicketEdit = (ticketId: number) => {
    setActiveTicketId(ticketId);
    setPage("edit");
  };

  if (loading) {
    return <main className="container">Loading...</main>;
  }

  return (
    <main className="container">
      <header className="page-header">
        <h1>TicketFlow – Internal IT Support Management System</h1>
        <div className="actions">
          <button onClick={() => setPage("dashboard")}>Dashboard</button>
          <button onClick={() => setPage("create")} disabled={users.length === 0}>
            Create Ticket
          </button>
          <button onClick={() => setIsDarkMode((prev) => !prev)}>
            {isDarkMode ? "Light Mode" : "Dark Mode"}
          </button>
        </div>
      </header>

      {liveNotice && <p className="live-notice">{liveNotice}</p>}

      {errorMessage && <p className="error">{errorMessage}</p>}
      {users.length === 0 && (
        <p className="card">Create at least one user from the API first (`POST /users`) to create tickets.</p>
      )}

      {page === "dashboard" && (
        <DashboardPage
          tickets={tickets}
          users={users}
          onView={openTicketDetail}
          onEdit={openTicketEdit}
          onDelete={(ticketId) => setConfirmDeleteId(ticketId)}
          onMoveStatus={handleMoveStatus}
        />
      )}

      {page === "create" && (
        <CreateTicketPage
          users={users}
          onSubmit={handleCreateTicket}
          onCancel={() => setPage("dashboard")}
        />
      )}

      {page === "detail" && activeTicket && (
        <TicketDetailPage
          ticket={activeTicket}
          users={users}
          onBack={() => setPage("dashboard")}
          onEdit={() => openTicketEdit(activeTicket.id)}
          onDelete={() => setConfirmDeleteId(activeTicket.id)}
        />
      )}

      {page === "edit" && activeTicket && (
        <EditTicketPage
          ticket={activeTicket}
          users={users}
          onSubmit={(values) => handleUpdateTicket(activeTicket.id, values)}
          onCancel={() => setPage("detail")}
        />
      )}

      {((page === "detail" || page === "edit") && !activeTicket) && (
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
