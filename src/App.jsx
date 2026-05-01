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

function App() {
  const todayDate = getTodayDate();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(todayDate);
  const [screen, setScreen] = useState("login");
  const [taskText, setTaskText] = useState("");
  const [tasks, setTasks] = useState([
    {
      id: 1,
      text: "Create a List",
      dueDate: todayDate,
      completed: false,
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

  function handleAddTask(event) {
    event.preventDefault();

    if (taskText.trim() === "") {
      return;
    }

    const newTask = {
      id: Date.now(),
      text: taskText.trim(),
      dueDate: selectedDate,
      completed: false,
    };

    setTasks([...tasks, newTask]);
    setTaskText("");
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
  const selectedDateTasks = tasks.filter((task) => {
    return task.dueDate === selectedDate;
  });

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
            <p>{completedTasks} completed</p>
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
                const dayTasks = tasks.filter((task) => task.dueDate === calendarDay.date);
                const taskCount = dayTasks.length;
                const firstTask = dayTasks[0];
                const calendarDayClasses = [
                  "calendar-day",
                  calendarDay.date === selectedDate ? "selected-day" : "",
                  !calendarDay.isCurrentMonth ? "outside-month" : "",
                ].join(" ");

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
