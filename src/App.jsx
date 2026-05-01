import { useState } from "react";
import TaskForm from "./components/TaskForm";
import TaskItem from "./components/TaskItem";
import "./App.css";

function getCalendarDays(date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  const days = [];

  for (let blankDay = firstDayOfMonth.getDay(); blankDay > 0; blankDay--) {
    const previousMonthDate = new Date(year, month, 1 - blankDay);

    days.push({
      date: formatDate(previousMonthDate),
      isCurrentMonth: false,
    });
  }

  for (let day = 1; day <= lastDayOfMonth.getDate(); day++) {
    days.push({
      date: formatDate(new Date(year, month, day)),
      isCurrentMonth: true,
    });
  }
  return days;

}

function getMonthLabel(date) {
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getTodayDate() {
  return formatDate(new Date());
}

function getCalendarLabel(dateString) {
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  return {
    weekday: date.toLocaleDateString("en-US", { weekday: "short" }),
    day,
  };
}

function getDaysBetween(startDate, targetDate) {
  const [startYear, startMonth, startDay] = startDate.split("-").map(Number);
  const [targetYear, targetMonth, targetDay] = targetDate.split("-").map(Number);
  const start = new Date(startYear, startMonth - 1, startDay);
  const target = new Date(targetYear, targetMonth - 1, targetDay);

  return Math.floor((target - start) / (1000 * 60 * 60 * 24));
}

function taskOccursOnDate(task, date) {
  if (task.repeatOption === "none") {
    return task.dueDate === date;
  }

  const daysBetween = getDaysBetween(task.dueDate, date);

  if (daysBetween < 0) {
    return false;
  }

  if (task.repeatOption === "daily") {
    return true;
  }

  if (task.repeatOption === "everyOtherDay") {
    return daysBetween % 2 === 0;
  }

  if (task.repeatOption === "weekly") {
    return daysBetween % 7 === 0;
  }

  if (task.repeatOption === "monthly") {
    const startDay = task.dueDate.split("-")[2];
    const targetDay = date.split("-")[2];

    return startDay === targetDay;
  }

  return false;
}

function taskIsCompleteOnDate(task, date) {
  return task.completedDates.includes(date);
}

function App() {
  const [repeatOption, setRepeatOption] = useState("none");
  const todayDate = getTodayDate();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(todayDate);
  const [screen, setScreen] = useState("login");
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const [taskText, setTaskText] = useState("");
  const [tasks, setTasks] = useState([
    {
      id: 1,
      text: "Create a List",
      dueDate: todayDate,
      repeatOption: "none",
      completedDates: [],
    },
  ]);

  const calendarDates = getCalendarDays(currentMonth);
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  function handlePreviousMonth() {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
    );
  }

  function handleNextMonth() {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
    );
  }

  async function sendAuthRequest(path) {
    setAuthMessage("");

    try {
      const response = await fetch(`http://localhost:4000${path}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();

      if (!response.ok) {
        setAuthMessage(data.message);
        return;
      }

      setUser(data.user);
      setAuthMessage(data.message);
      setScreen("dashboard");
    } catch {
      setAuthMessage("Could not connect to the server.");
    }
  }

  function handleLogin(event) {
    event.preventDefault();
    sendAuthRequest("/api/login");
  }

  function handleRegister() {
    sendAuthRequest("/api/register");
  }

  function handleGuestLogin() {
    setUser({ id: "guest", email: "Guest" });
    setAuthMessage("");
    setScreen("dashboard");
  }

  function handleSignOut() {
    setUser(null);
    setPassword("");
    setScreen("login");
  }

  function handleAddTask(event) {
    event.preventDefault();

    if (taskText.trim() === "") {
      return;
    }

    const newTask = {
      id: Date.now(),
      text: taskText.trim(),
      dueDate: selectedDate,
      repeatOption,
      completedDates: [],
    };

    setTasks([...tasks, newTask]);
    setTaskText("");
    setRepeatOption("none");
  }

  function handleToggleTask(taskId, date) {
    const updatedTasks = tasks.map((task) => {
      if (task.id !== taskId) {
        return task;
      }

      const isComplete = taskIsCompleteOnDate(task, date);

      return {
        ...task,
        completedDates: isComplete
          ? task.completedDates.filter((completedDate) => completedDate !== date)
          : [...task.completedDates, date],
      };
    });

    setTasks(updatedTasks);
  }

  function handleDeleteTask(taskId) {
    const updatedTasks = tasks.filter((task) => task.id !== taskId);
    setTasks(updatedTasks);
  }

  const selectedDateTasks = tasks.filter((task) => {
    return taskOccursOnDate(task, selectedDate);
  });
  const completedSelectedDateTasks = selectedDateTasks.filter((task) => {
    return taskIsCompleteOnDate(task, selectedDate);
  }).length;

  if (screen === "dashboard") {
    return (
      <main className="dashboard-page">
        <header className="dashboard-header">
          <div>
            <h1>My Planner</h1>
            {user && <p>Signed in as {user.email}</p>}
          </div>

          <button type="button" onClick={handleSignOut}>
            Sign out
          </button>
        </header>

        <section className="dashboard-grid">
          <TaskForm
            taskText={taskText}
            setTaskText={setTaskText}
            repeatOption={repeatOption}
            setRepeatOption={setRepeatOption}
            onAddTask={handleAddTask}
            selectedDate={selectedDate}
          />

          <section className="dashboard-card">
            <h2>Tasks for {selectedDate}</h2>
            {selectedDateTasks.length === 0 ? (
              <p>No tasks for this day yet.</p>
            ) : (
              <ul className="task-list">
                {selectedDateTasks.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    selectedDate={selectedDate}
                    onToggle={handleToggleTask}
                    onDelete={handleDeleteTask}
                  />
                ))}
              </ul>
            )}
          </section>

          <aside className="dashboard-card">
            <h2>Summary</h2>
            <p>{tasks.length} tasks</p>
            <p>{selectedDateTasks.length} on selected day</p>
            <p>{completedSelectedDateTasks} completed on selected day</p>
          </aside>

          <section className="dashboard-card calendar-card">
            <div className="card-heading">
              <div>
                <h2>{getMonthLabel(currentMonth)}</h2>
                <p>Selected: {selectedDate}</p>
              </div>

              <div className="month-buttons">
                <button type="button" onClick={handlePreviousMonth}>
                  Previous
                </button>

                <button type="button" onClick={handleNextMonth}>
                  Next
                </button>
              </div>
            </div>

            <div className="weekday-grid">
              {weekDays.map((day) => (
                <span key={day}>{day}</span>
              ))}
            </div>

            <div className="calendar-grid">
              {calendarDates.map((calendarDay) => {
                const label = getCalendarLabel(calendarDay.date);
                const dayTasks = tasks.filter((task) =>
                  taskOccursOnDate(task, calendarDay.date)
                );
                const taskCount = dayTasks.length;
                const completedCount = dayTasks.filter((task) =>
                  taskIsCompleteOnDate(task, calendarDay.date)
                ).length;
                const firstTask = dayTasks[0];
                const dayStatus =
                  taskCount === 0
                    ? ""
                    : completedCount === 0
                      ? "day-incomplete"
                      : completedCount === taskCount
                        ? "day-complete"
                        : "day-partial";
                const calendarDayClasses = [
                  "calendar-day",
                  calendarDay.date === selectedDate ? "selected-day" : "",
                  !calendarDay.isCurrentMonth ? "outside-month" : "",
                  dayStatus,
                ]
                  .filter(Boolean)
                  .join(" ");

                return (
                  <button
                    className={calendarDayClasses}
                    key={calendarDay.date}
                    type="button"
                    onClick={() => setSelectedDate(calendarDay.date)}
                  >
                    <strong>{label.day}</strong>
                    {firstTask && (
                      <span className="calendar-task-preview">
                        {firstTask.text}
                      </span>
                    )}
                    {taskCount > 1 && (
                      <span className="calendar-more-count">
                        +{taskCount - 1} more
                      </span>
                    )}
                    <small>
                      {taskCount} {taskCount === 1 ? "task" : "tasks"}
                    </small>
                  </button>
                );
              })}
            </div>
          </section>
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

        <form className="login-form" onSubmit={handleLogin}>
          <label>
            Email
            <input
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>

          <label>
            Password
            <input
              type="password"
              placeholder="Your password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>

          <button
            className="primary-button"
            type="submit"
          >
            Sign in
          </button>

          <button
            className="secondary-button"
            type="button"
            onClick={handleRegister}
          >
            Create account
          </button>

          {authMessage && <p className="auth-message">{authMessage}</p>}
        </form>

        <div className="divider">
          <span>or</span>
        </div>

        <button
          className="secondary-button"
          type="button"
          onClick={handleGuestLogin}
        >
          Enter as guest
        </button>
      </section>
    </main>
  );
}

export default App;
