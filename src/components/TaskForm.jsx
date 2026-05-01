function TaskForm({
  taskText,
  setTaskText,
  onAddTask,
  selectedDate,
}) {
  return (
    <section className="dashboard-card">
      <h2>Add Task</h2>
      <p className="form-note">New tasks will be added to {selectedDate}.</p>

      <form className="task-form" onSubmit={onAddTask}>
        <label>
          Task
          <input
            type="text"
            placeholder="Example: Your task here..."
            value={taskText}
            onChange={(event) => setTaskText(event.target.value)}
          />
        </label>

        <button type="submit">Add task</button>
      </form>
    </section>
  );
}

export default TaskForm;
