import React, { useState, useEffect } from 'react';
import './App.css';

// --- Color scheme (used in inline style and class logic)
const COLORS = {
  accent: "#FF4081",
  primary: "#1976D2",
  secondary: "#424242",
};

// API BASE URL (Config for live/preview)
const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:3001";

// PUBLIC_INTERFACE
function App() {
  // --- State
  const [theme, setTheme] = useState('light');
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [filter, setFilter] = useState('all'); // 'all' | 'active' | 'completed'
  const [editId, setEditId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [error, setError] = useState(null);

  // --- Theme effect
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // --- Load tasks from backend
  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE}/tasks?status=${filter}`)
      .then(r => r.ok ? r.json() : Promise.reject(r))
      .then(setTasks)
      .catch(() => setError("Failed to load tasks from backend"))
      .finally(() => setLoading(false));
  }, [filter]);

  // --- Theme toggle
  // PUBLIC_INTERFACE
  const toggleTheme = () => {
    setTheme(t => t === "light" ? "dark" : "light");
  };

  // --- Add task
  // PUBLIC_INTERFACE
  async function handleAddTask(e) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/tasks`, {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle.trim(), description: newDesc.trim() || undefined }),
      });
      if (!res.ok) throw new Error("Add task failed");
      const task = await res.json();
      setTasks(t => [task, ...t]);
      setNewTitle('');
      setNewDesc('');
    } catch {
      setError("Couldn't add task");
    } finally {
      setLoading(false);
    }
  }

  // --- Start edit UI for task
  function beginEdit(task) {
    setEditId(task.id);
    setEditTitle(task.title);
    setEditDesc(task.description || "");
  }

  // --- Save edit
  async function handleEditSave(taskId) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle.trim(),
          description: editDesc.trim(),
        }),
      });
      if (!res.ok) throw new Error("Update failed");
      const updated = await res.json();
      setTasks(ts => ts.map(t => t.id === taskId ? updated : t));
      setEditId(null);
      setEditTitle('');
      setEditDesc('');
    } catch {
      setError("Couldn't update task.");
    } finally {
      setLoading(false);
    }
  }

  // --- Cancel edit
  function cancelEdit() {
    setEditId(null);
    setEditTitle('');
    setEditDesc('');
  }

  // --- Toggle completion
  async function handleToggleComplete(task) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/tasks/${task.id}/complete?is_completed=${!task.is_completed}`, { method: "PATCH" });
      if (!res.ok) throw new Error("Failed completion");
      const updated = await res.json();
      setTasks(ts => ts.map(t => t.id === task.id ? updated : t));
    } catch {
      setError("Couldn't update completion status.");
    } finally {
      setLoading(false);
    }
  }

  // --- Delete task
  async function handleDelete(id) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/tasks/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setTasks(ts => ts.filter(t => t.id !== id));
    } catch {
      setError("Couldn't delete task.");
    } finally {
      setLoading(false);
    }
  }

  // --- Filter control
  // PUBLIC_INTERFACE
  function renderFilters() {
    const filters = [
      { value: "all", label: "All" },
      { value: "active", label: "Active" },
      { value: "completed", label: "Completed" },
    ];
    return (
      <div style={{ display: "flex", gap: 8, marginBottom: 20, justifyContent: "center" }}>
        {filters.map(f => (
          <button
            key={f.value}
            className="todo-filter-btn"
            style={{
              borderBottom: filter === f.value ? `2px solid ${COLORS.accent}` : "2px solid transparent",
              color: filter === f.value ? COLORS.accent : COLORS.secondary,
              background: "none",
              fontWeight: filter === f.value ? 700 : 400,
              cursor: "pointer",
              outline: "none",
              padding: "4px 12px",
              borderRadius: 4,
              fontSize: 16
            }}
            onClick={() => setFilter(f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>
    );
  }

  // --- Task list rendering
  // PUBLIC_INTERFACE
  function renderTasks() {
    if (loading) return <div className="todo-tasks-empty" style={{ margin: 40, color: COLORS.primary }}>Loading...</div>;
    if (error) return <div className="todo-tasks-empty" style={{ margin: 20, color: COLORS.accent }}>{error}</div>;
    if (!tasks.length) return <div className="todo-tasks-empty" style={{ margin: 30 }}>No tasks found. Get started!</div>;

    return (
      <ul className="todo-task-list">
        {tasks.map(task => (
          <li
            key={task.id}
            className="todo-task"
            style={{
              background: theme === "light" ? "#fff" : "#23272e",
              border: `1px solid ${COLORS.primary}20`
            }}
          >
            <div className="todo-task-left">
              <input
                type="checkbox"
                checked={!!task.is_completed}
                onChange={() => handleToggleComplete(task)}
                style={{ accentColor: COLORS.primary, marginRight: 12 }}
                aria-label={task.is_completed ? "Mark as active" : "Mark as complete"}
                disabled={loading}
              />
              {editId === task.id ? (
                <div className="todo-task-edit-form" style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={e => setEditTitle(e.target.value)}
                    className="todo-task-input"
                    placeholder="Edit title"
                  />
                  <input
                    type="text"
                    value={editDesc}
                    onChange={e => setEditDesc(e.target.value)}
                    className="todo-task-input"
                    placeholder="Edit description"
                  />
                </div>
              ) : (
                <div className="todo-task-info" style={{ flex: 1 }}>
                  <div className="todo-task-title" style={{
                    textDecoration: task.is_completed ? "line-through" : "none",
                    color: task.is_completed ? COLORS.secondary : COLORS.primary,
                    fontWeight: 600,
                    fontSize: 18
                  }}>{task.title}</div>
                  {!!task.description && (
                    <div className="todo-task-desc"
                      style={{
                        color: COLORS.secondary,
                        fontSize: 14,
                        opacity: 0.85,
                        marginTop: 2
                      }}>{task.description}</div>
                  )}
                </div>
              )}
            </div>
            <div className="todo-task-actions" style={{ display: "flex", gap: 6 }}>
              {editId === task.id ? (
                <>
                  <button className="todo-btn todo-save-btn"
                    style={{ background: COLORS.primary, color: "#fff" }}
                    disabled={loading || !editTitle.trim()}
                    onClick={() => handleEditSave(task.id)}
                  >Save</button>
                  <button className="todo-btn"
                    style={{ background: "#e0e0e0", color: COLORS.secondary }}
                    onClick={cancelEdit}
                  >Cancel</button>
                </>
              ) : (
                <>
                  <button className="todo-btn"
                    style={{ background: COLORS.accent, color: "#fff" }}
                    onClick={() => beginEdit(task)}
                    aria-label="Edit"
                    disabled={loading}
                  >Edit</button>
                  <button className="todo-btn"
                    style={{ background: COLORS.secondary, color: "#fff" }}
                    onClick={() => handleDelete(task.id)}
                    aria-label="Delete"
                    disabled={loading}
                  >Delete</button>
                </>
              )}
            </div>
          </li>
        ))}
      </ul>
    );
  }

  // --- Layout
  return (
    <div className="App" style={{ background: theme === "light" ? "#f6f8fc" : "#181B20", minHeight: "100vh" }}>
      <header className="todo-header" style={{
        background: COLORS.primary,
        color: "#fff",
        padding: "28px 0 18px 0",
        boxShadow: "0 4px 12px 0 #0001"
      }}>
        <h1 style={{ margin: 0, fontWeight: 700, fontSize: 30 }}>Todo App</h1>
        <span style={{
          fontWeight: 400, fontSize: 16,
          color: "#e3f2fd"
        }}>A minimal, modern todo list</span>
        <button
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          style={{
            position: "absolute",
            top: 20,
            right: 24,
            zIndex: 2
          }}
        >
          {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
        </button>
      </header>
      <main className="todo-main" style={{
        maxWidth: 520, margin: "0 auto",
        padding: "24px 10px",
        minHeight: 420
      }}>
        <form className="todo-add-form" style={{
          display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap", alignItems: "center"
        }} onSubmit={handleAddTask}>
          <input
            type="text"
            placeholder="New task title…"
            className="todo-add-input"
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            style={{
              flex: "2 1 120px",
              padding: "10px 12px",
              borderRadius: 6,
              border: `1px solid ${COLORS.primary}55`,
              fontSize: 17
            }}
            aria-label="Task title"
            autoFocus
          />
          <input
            type="text"
            placeholder="(Optional) Add description…"
            className="todo-add-desc"
            value={newDesc}
            onChange={e => setNewDesc(e.target.value)}
            style={{
              flex: "3 1 160px",
              padding: "10px 12px",
              borderRadius: 6,
              border: `1px solid ${COLORS.primary}22`,
              fontSize: 16
            }}
            aria-label="Description"
          />
          <button
            type="submit"
            className="todo-btn todo-add-btn"
            style={{
              background: COLORS.accent,
              color: "#fff",
              padding: "10px 18px",
              fontWeight: 700,
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              fontSize: 17,
              minWidth: 80
            }}
            disabled={loading || !newTitle.trim()}
          >Add</button>
        </form>
        {renderFilters()}
        {renderTasks()}
      </main>
      <footer style={{
        textAlign: "center",
        color: COLORS.secondary,
        fontSize: 14,
        margin: "35px 0 14px 0",
        opacity: 0.7
      }}>
        &copy; {new Date().getFullYear()} Minimal Todo. Powered by React & REST API.
      </footer>
    </div>
  );
}

export default App;
