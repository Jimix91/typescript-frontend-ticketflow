import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api, setApiToken } from "./api";
import { ConfirmModal } from "./components/ConfirmModal";
import ticketflowLogo from "./media/logo4.png";
import {
  ArchivedTicketsPage,
  CreateTicketPage,
  DashboardPage,
  EditTicketPage,
  ProfilePage,
  TicketDetailPage,
  TicketResolutionPage,
} from "./pages";
import { Ticket, TicketFormValues, TicketStatus, User } from "./types";

type Page = "dashboard" | "archived" | "create" | "detail" | "edit" | "resolution" | "profile";

const ARCHIVE_DAYS = 5;

const isArchivedClosedTicket = (ticket: Ticket) => {
  if (ticket.status !== "CLOSED") {
    return false;
  }

  const ageInMs = Date.now() - new Date(ticket.updatedAt).getTime();
  const ageInDays = Math.floor(ageInMs / (1000 * 60 * 60 * 24));
  return ageInDays >= ARCHIVE_DAYS;
};

function App() {
  const navButtonClass = "ui-nav-item";
  const summaryChipClass =
    "inline-flex min-w-[9.5rem] items-center justify-center rounded-full bg-indigo-500/75 px-3 py-1.5 text-center text-[0.72rem] font-medium text-indigo-50";
  const primaryButtonClass = "ui-btn-primary";
  const secondaryButtonClass = "ui-btn-secondary";
  const navActiveClass = "ui-nav-item ui-nav-item-active";

  const [authUser, setAuthUser] = useState<User | null>(null);
  const [authToken, setAuthTokenState] = useState<string | null>(() => sessionStorage.getItem("ticketflow-token"));
  const skipProfileBootstrapRef = useRef(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [isAuthSubmitting, setIsAuthSubmitting] = useState(false);

  const [users, setUsers] = useState<User[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [archivedTickets, setArchivedTickets] = useState<Ticket[]>([]);
  const [archivedLoading, setArchivedLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [movingTicketId, setMovingTicketId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [page, setPage] = useState<Page>("dashboard");
  const [activeTicketId, setActiveTicketId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [liveNotice, setLiveNotice] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem("ticketflow-theme") === "dark";
  });

  const activeTicket = useMemo(
    () =>
      tickets.find((ticket) => ticket.id === activeTicketId) ??
      archivedTickets.find((ticket) => ticket.id === activeTicketId) ??
      null,
    [tickets, archivedTickets, activeTicketId],
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
      } else {
        setIsSyncing(true);
      }
      const [usersResponse, tasksResponse] = await Promise.all([api.getUsers(), api.getTasks("active")]);
      setUsers(usersResponse);
      setTickets((prev) => {
        const changed =
          prev.length !== tasksResponse.length ||
          prev.some((ticket) => {
            const next = tasksResponse.find((item) => item.id === ticket.id);
            return (
              !next ||
              next.updatedAt !== ticket.updatedAt ||
              next.status !== ticket.status ||
              next.inProgressSubStatus !== ticket.inProgressSubStatus
            );
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
      } else {
        setIsSyncing(false);
      }
    }
  }, [authToken]);

  const loadArchivedTickets = useCallback(async () => {
    try {
      setArchivedLoading(true);
      const archived = await api.getTasks("archived");
      const normalizedArchived = archived.filter((ticket) => isArchivedClosedTicket(ticket));
      setArchivedTickets(normalizedArchived);
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to load archived tickets");
    } finally {
      setArchivedLoading(false);
    }
  }, []);

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
        if (skipProfileBootstrapRef.current) {
          skipProfileBootstrapRef.current = false;
          await loadData(true);
          return;
        }

        const [me] = await Promise.all([api.me(), loadData(true)]);
        setAuthUser(me);
      } catch (_error) {
        setAuthTokenState(null);
        sessionStorage.removeItem("ticketflow-token");
        setApiToken(null);
        setAuthUser(null);
        setLoading(false);
      }
    };

    void bootstrap();
  }, [authToken, loadData]);

  useEffect(() => {
    if (authToken) {
      return;
    }

    void api.health().catch(() => {
    });
  }, [authToken]);

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
    if (page !== "archived") {
      return;
    }

    void loadArchivedTickets();
  }, [page, loadArchivedTickets]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDarkMode);
    localStorage.setItem("ticketflow-theme", isDarkMode ? "dark" : "light");
  }, [isDarkMode]);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [page]);

  useEffect(() => {
    if (!isMobileMenuOpen) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMobileMenuOpen(false);
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isMobileMenuOpen]);

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
        inProgressSubStatus: values.inProgressSubStatus,
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
        inProgressSubStatus: values.inProgressSubStatus,
        priority: values.priority,
        assignedToId: values.assignedToId,
      });
      setTickets((prev) => prev.map((item) => (item.id === ticketId ? updatedTask : item)));
      setArchivedTickets((prev) => prev.map((item) => (item.id === ticketId ? updatedTask : item)));
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

      setMovingTicketId(ticketId);
      const updated = await api.updateTask(ticketId, {
        status,
        inProgressSubStatus: status === "IN_PROGRESS" ? "PENDING_AGENT" : null,
      });
      setTickets((prev) => prev.map((ticket) => (ticket.id === ticketId ? updated : ticket)));
      setArchivedTickets((prev) => prev.map((ticket) => (ticket.id === ticketId ? updated : ticket)));
      setLiveNotice(`Ticket #${ticketId} moved to ${status}`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Could not update ticket status");
    } finally {
      setMovingTicketId(null);
    }
  };

  const handleDeleteTicket = async (ticketId: number) => {
    try {
      await api.deleteTask(ticketId);
      setTickets((prev) => prev.filter((task) => task.id !== ticketId));
      setArchivedTickets((prev) => prev.filter((task) => task.id !== ticketId));
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
      return prev.map((ticket) => (ticket.id === ticketId ? freshTicket : ticket));
    });
    setArchivedTickets((prev) => prev.map((ticket) => (ticket.id === ticketId ? freshTicket : ticket)));
    return freshTicket;
  };

  const openTicketDetail = async (ticketId: number) => {
    let targetTicket = tickets.find((ticket) => ticket.id === ticketId);
    try {
      targetTicket = await refreshTicket(ticketId);
    } catch (_error) {
    }

    setActiveTicketId(ticketId);

    const archivedClosedTicket = targetTicket ? isArchivedClosedTicket(targetTicket) : false;

    const shouldOpenResolution =
      !archivedClosedTicket &&
      (authUser?.role === "ADMIN" ||
        (authUser?.role === "AGENT" && targetTicket?.assignedToId === authUser.id));

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
    sessionStorage.setItem("ticketflow-token", token);
    setApiToken(token);
  };

  const handleLogin = async () => {
    try {
      setIsAuthSubmitting(true);
      const response = await api.login({
        email: authEmail.trim(),
        password: authPassword,
      });

      skipProfileBootstrapRef.current = true;
      persistToken(response.token);
      setAuthUser(response.user);
      setAuthPassword("");
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Login failed");
    } finally {
      setIsAuthSubmitting(false);
    }
  };

  const handleRegister = async () => {
    try {
      setIsAuthSubmitting(true);
      const response = await api.register({
        name: authName.trim(),
        email: authEmail.trim(),
        password: authPassword,
        role: "EMPLOYEE",
      });

      skipProfileBootstrapRef.current = true;
      persistToken(response.token);
      setAuthUser(response.user);
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Register failed");
    } finally {
      setIsAuthSubmitting(false);
    }
  };

  const handleLogout = () => {
    setAuthTokenState(null);
    setApiToken(null);
    sessionStorage.removeItem("ticketflow-token");
    setAuthUser(null);
    setUsers([]);
    setTickets([]);
    setArchivedTickets([]);
    setPage("dashboard");
  };

  const isDashboardActive = page === "dashboard" || page === "archived" || page === "detail" || page === "edit" || page === "resolution";

  if (loading) {
    return (
      <main className="ui-shell flex items-center justify-center">
        <section className="grid w-full max-w-6xl grid-cols-1 gap-5 lg:grid-cols-[20rem,1fr]">
          <div className="ui-skeleton h-[70vh]" />
          <div className="grid gap-5">
            <div className="ui-skeleton h-24" />
            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              <div className="ui-skeleton h-[60vh]" />
              <div className="ui-skeleton h-[60vh]" />
              <div className="ui-skeleton h-[60vh]" />
            </div>
          </div>
        </section>
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
                  <button className={primaryButtonClass} onClick={() => void handleLogin()} disabled={isAuthSubmitting}>
                    {isAuthSubmitting ? "Logging in..." : "Log in"}
                  </button>
                ) : (
                  <button className={primaryButtonClass} onClick={() => void handleRegister()} disabled={isAuthSubmitting}>
                    {isAuthSubmitting ? "Registering..." : "Register"}
                  </button>
                )}
                <button
                  className={secondaryButtonClass + " bg-transparent"}
                  disabled={isAuthSubmitting}
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
    <main className="ui-shell ui-fade-in lg:grid lg:grid-cols-[20rem,1fr] lg:items-start lg:gap-6">
      <div className="ui-topbar mb-4 flex items-center justify-between lg:hidden">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400">TicketFlow</p>
          <p className="truncate text-base font-bold text-slate-900 dark:text-slate-100">{authUser.name}</p>
        </div>

        <button
          type="button"
          onClick={() => setIsMobileMenuOpen((prev) => !prev)}
          className="ui-btn-secondary min-w-[7.5rem]"
          aria-label="Toggle navigation menu"
          aria-expanded={isMobileMenuOpen}
        >
          {isMobileMenuOpen ? "Close ✕" : "Menu ☰"}
        </button>
      </div>

      {isMobileMenuOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-slate-950/45 backdrop-blur-[1px] lg:hidden"
          aria-label="Close navigation menu"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <header
        className={`ui-sidebar fixed inset-y-0 left-0 z-50 m-0 w-[min(88vw,22rem)] max-w-full transform rounded-r-3xl border-r border-slate-500/70 shadow-2xl transition-transform duration-300 ease-out lg:mb-5 lg:mr-0 lg:max-h-[calc(100vh-3rem)] lg:w-full lg:translate-x-0 lg:self-start lg:rounded-3xl lg:border lg:shadow-sm ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-[105%]"
        } lg:sticky lg:top-6 lg:flex lg:flex-col lg:overflow-hidden`}
      >
        <div className="ui-sidebar-content">
          <div className="flex items-center justify-between lg:hidden">
            <p className="text-sm font-semibold uppercase tracking-[0.1em] text-slate-300">Navigation</p>
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(false)}
              className="rounded-lg px-2 py-1 text-sm font-semibold text-slate-200 hover:bg-slate-500/60"
              aria-label="Close sidebar"
            >
              ✕
            </button>
          </div>

          <div className="flex flex-col gap-4">
            <div className="ui-logo-wrap">
              <img src={ticketflowLogo} alt="TicketFlow logo" className="ui-logo" />
            </div>

            <div className="ui-nav-list">
              <button onClick={() => setPage("dashboard")} className={isDashboardActive ? navActiveClass : navButtonClass}><span>◫</span> Dashboard</button>
              <button onClick={() => setPage("create")} disabled={users.length === 0} className="ui-nav-item w-full justify-start bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50">
                <span>＋</span> Create Ticket
              </button>
              <button onClick={() => setIsDarkMode((prev) => !prev)} className={navButtonClass}>
                <span>{isDarkMode ? "☼" : "◐"}</span>
                {isDarkMode ? "Light Mode" : "Dark Mode"}
              </button>
              <button onClick={handleLogout} className={navButtonClass}><span>↩</span> Log out</button>
            </div>
          </div>

          <div className="ui-sidebar-divider" />

          <div className="ui-profile-panel flex flex-col gap-4 lg:mt-auto">
            <div className="flex items-center gap-4 rounded-xl border border-slate-700 bg-slate-900/70 p-3">
              <button
                onClick={() => setPage("profile")}
                className="inline-flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-700 bg-slate-800 text-lg font-bold text-slate-100 shadow-sm hover:border-indigo-400"
                aria-label="Open profile"
              >
                {authUser.profileImageUrl ? (
                  <img src={authUser.profileImageUrl} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  <span>{authUser.name.charAt(0).toUpperCase()}</span>
                )}
              </button>

              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-slate-100">{authUser.name}</p>
                <p className="truncate text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">{authUser.role ?? "User"}</p>
              </div>
            </div>

            <button
              onClick={() => setPage("profile")}
              className={page === "profile" ? navActiveClass : navButtonClass}
            >
              <span>☺</span> My Profile
            </button>

            <div className="flex w-full flex-wrap items-center justify-center gap-2 lg:flex-col">
              <span className={summaryChipClass}>My Open: {ticketSummary.open}</span>
              <span className={summaryChipClass}>My In Progress: {ticketSummary.inProgress}</span>
              <span className={summaryChipClass}>My Closed: {ticketSummary.closed}</span>
            </div>
          </div>
        </div>
      </header>

      <section className="min-w-0">

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
          isSyncing={isSyncing}
          movingTicketId={movingTicketId}
          onView={(ticketId) => void openTicketDetail(ticketId)}
          onEdit={(ticketId) => void openTicketEdit(ticketId)}
          onDelete={(ticketId) => setConfirmDeleteId(ticketId)}
          onMoveStatus={handleMoveStatus}
          onViewArchived={() => setPage("archived")}
        />
      )}

      {page === "archived" && (
        <ArchivedTicketsPage
          tickets={archivedTickets}
          users={users}
          loading={archivedLoading}
          onBack={() => setPage("dashboard")}
          onRefresh={() => void loadArchivedTickets()}
          onView={(ticketId) => void openTicketDetail(ticketId)}
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
            setArchivedTickets((prev) => prev.map((ticket) => (ticket.id === updated.id ? updated : ticket)));
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

      </section>

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
