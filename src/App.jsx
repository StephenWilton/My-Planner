import { useState } from "react";
import TaskForm from "./components/TaskForm";
import TaskItem from "./components/TaskItem";
import "./App.css";

function App() {
  const [screen, setScreen] = useState("login");
  const [taskText, setTaskText] = useState("");
  const [tasks, setTasks] = useState([
    {
      id: 1,
      text: "Create a List",
      dueDate: "2026-05-01",
      completed: false,
    }
  ]);
  const [dueDate, setDueDate] = useState("");

  function handleAddTask(event) {
    event.preventDefault();

    if (taskText.trim() === "") {
      return;
    }

    const newTask = {
      id: Date.now(),
      text: taskText.trim(),
      dueDate,
      completed: false,
    };

    setTasks([...tasks, newTask]);
    setTaskText("");
    setDueDate("");
  }

  function handleToggleTask(taskId) {
    const updatedTasks = tasks.map((task) => {
      if (task.id === taskId) {
        return { ...task, completed: !task.completed };
      }

      return task;
    });

    setTasks(updatedTasks);
  }

  function handleDeleteTask(taskId) {
    const updatedTasks = tasks.filter((task) => task.id !== taskId);
    setTasks(updatedTasks);
  }

  const completedTasks = tasks.filter((task) => task.completed).length;

  if (screen === "dashboard") {
    return (
      <main className="dashboard-page">
        <header className="dashboard-header">
          <h1>My Planner</h1>

          <button type="button" onClick={() => setScreen("login")}>
            Sign out
          </button>
        </header>

        <section className="dashboard-grid">
          <TaskForm
            taskText={taskText}
            setTaskText={setTaskText}
            dueDate={dueDate}
            setDueDate={setDueDate}
            onAddTask={handleAddTask}
          />

          <section className="dashboard-card">
            <h2>Tasks</h2>

            <ul className="task-list">
              {tasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onToggle={handleToggleTask}
                  onDelete={handleDeleteTask}
                />
              ))}
            </ul>
          </section>

          <aside className="dashboard-card">
            <h2>Summary</h2>
            <p>{tasks.length} tasks</p>
            <p>{completedTasks} completed</p>
          </aside>
        </section>
      </main>
    );
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <p className="eyebrow">My Planner</p>
        <h1>Welcome back</h1>
        <p className="intro">Sign in or continue as a guest to start planning.</p>

        <form className="login-form">
          <label>
            Email
            <input type="email" placeholder="name@example.com" />
          </label>

          <label>
            Password
            <input type="password" placeholder="Your password" />
          </label>

          <button
            className="primary-button"
            type="button"
            onClick={() => setScreen("dashboard")}
          >
            Sign in
          </button>
        </form>

        <div className="divider">
          <span>or</span>
        </div>

        <button
          className="secondary-button"
          type="button"
          onClick={() => setScreen("dashboard")}
        >
          Enter as guest
        </button>
      </section>
    </main>
  );
}

export default App;
