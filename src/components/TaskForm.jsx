function TaskForm({
  taskText,
  setTaskText,
  dueDate,
  setDueDate,
  onAddTask,
}) {
  return (
    <section className="dashboard-card">
      <h2>Add Task</h2>

      <form className="task-form" onSubmit={onAddTask}>
        <label>
          Task
          <input
            type="text"
            placeholder="Example: Study SQL joins"
            value={taskText}
            onChange={(event) => setTaskText(event.target.value)}
          />
        </label>

        <label>
          Due Date
          <input
            type="date"
            value={dueDate}
            onChange={(event) => setDueDate(event.target.value)}
          />
        </label>

        <button type="submit">Add task</button>
      </form>
    </section>
  );
}

export default TaskForm;
