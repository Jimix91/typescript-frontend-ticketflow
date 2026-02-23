import { FormEvent, useEffect, useMemo, useState } from "react";
import { api } from "./api";
import { Task, User } from "./types";

function App() {
  const [users, setUsers] = useState<User[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");

  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [editingDescription, setEditingDescription] = useState("");

  const selectedUser = useMemo(
    () => users.find((user) => user.id === selectedUserId),
    [users, selectedUserId],
  );

  const loadData = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const [usersResponse, tasksResponse] = await Promise.all([api.getUsers(), api.getTasks()]);
      setUsers(usersResponse);
      setTasks(tasksResponse);
      if (!selectedUserId && usersResponse.length > 0) {
        setSelectedUserId(usersResponse[0].id);
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const handleCreateUser = async (event: FormEvent) => {
    event.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim()) return;

    try {
      const createdUser = await api.createUser({ name: newUserName.trim(), email: newUserEmail.trim() });
      setUsers((prev) => [createdUser, ...prev]);
      setSelectedUserId(createdUser.id);
      setNewUserName("");
      setNewUserEmail("");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Could not create user");
    }
  };

  const handleCreateTask = async (event: FormEvent) => {
    event.preventDefault();
    if (!title.trim() || !selectedUserId) return;

    try {
      const createdTask = await api.createTask({
        title: title.trim(),
        description: description.trim() || undefined,
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        userId: selectedUserId,
      });

      setTasks((prev) => [createdTask, ...prev]);
      setTitle("");
      setDescription("");
      setDueDate("");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Could not create task");
    }
  };

  const handleToggleComplete = async (task: Task) => {
    try {
      const updatedTask = await api.updateTask(task.id, { completed: !task.completed });
      setTasks((prev) => prev.map((item) => (item.id === task.id ? updatedTask : item)));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Could not update task");
    }
  };

  const startEditTask = (task: Task) => {
    setEditingTaskId(task.id);
    setEditingTitle(task.title);
    setEditingDescription(task.description ?? "");
  };

  const cancelEdit = () => {
    setEditingTaskId(null);
    setEditingTitle("");
    setEditingDescription("");
  };

  const saveEditTask = async (taskId: string) => {
    if (!editingTitle.trim()) return;

    try {
      const updatedTask = await api.updateTask(taskId, {
        title: editingTitle.trim(),
        description: editingDescription.trim() || null,
      });
      setTasks((prev) => prev.map((item) => (item.id === taskId ? updatedTask : item)));
      cancelEdit();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Could not save task");
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await api.deleteTask(taskId);
      setTasks((prev) => prev.filter((task) => task.id !== taskId));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Could not delete task");
    }
  };

  if (loading) {
    return <main className="container">Loading...</main>;
  }

  return (
    <main className="container">
      <h1>Task Manager</h1>

      {errorMessage && <p className="error">{errorMessage}</p>}

      <section className="card">
        <h2>Create user</h2>
        <form onSubmit={handleCreateUser} className="grid-form">
          <input
            value={newUserName}
            onChange={(event) => setNewUserName(event.target.value)}
            placeholder="User name"
          />
          <input
            type="email"
            value={newUserEmail}
            onChange={(event) => setNewUserEmail(event.target.value)}
            placeholder="user@email.com"
          />
          <button type="submit">Add user</button>
        </form>
      </section>

      <section className="card">
        <h2>Create task</h2>
        <form onSubmit={handleCreateTask} className="grid-form">
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Task title"
          />
          <input
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Description"
          />
          <input
            type="date"
            value={dueDate}
            onChange={(event) => setDueDate(event.target.value)}
          />
          <select
            value={selectedUserId}
            onChange={(event) => setSelectedUserId(event.target.value)}
          >
            <option value="">Select task owner</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name} ({user.email})
              </option>
            ))}
          </select>
          <button type="submit" disabled={!selectedUser}>
            Add task
          </button>
        </form>
      </section>

      <section className="card">
        <h2>Tasks</h2>
        {tasks.length === 0 ? (
          <p>No tasks yet.</p>
        ) : (
          <ul className="task-list">
            {tasks.map((task) => {
              const isEditing = editingTaskId === task.id;
              return (
                <li key={task.id} className="task-item">
                  <label>
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => handleToggleComplete(task)}
                    />
                    Done
                  </label>

                  {isEditing ? (
                    <>
                      <input
                        value={editingTitle}
                        onChange={(event) => setEditingTitle(event.target.value)}
                      />
                      <input
                        value={editingDescription}
                        onChange={(event) => setEditingDescription(event.target.value)}
                      />
                    </>
                  ) : (
                    <>
                      <strong>{task.title}</strong>
                      <span>{task.description || "No description"}</span>
                      <span>Owner: {users.find((u) => u.id === task.userId)?.name || "Unknown"}</span>
                    </>
                  )}

                  <div className="actions">
                    {isEditing ? (
                      <>
                        <button onClick={() => saveEditTask(task.id)}>Save</button>
                        <button onClick={cancelEdit}>Cancel</button>
                      </>
                    ) : (
                      <button onClick={() => startEditTask(task)}>Edit</button>
                    )}
                    <button onClick={() => handleDeleteTask(task.id)}>Delete</button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}

export default App;
