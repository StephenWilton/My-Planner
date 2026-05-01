function TaskForm({
  taskText,
  setTaskText,
  repeatOption,
  setRepeatOption,
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

        <label>
          Repeat
          <select
            value={repeatOption}
            onChange={(event) => setRepeatOption(event.target.value)}
          >
            <option value="none">Does not repeat</option>
            <option value="daily">Every day</option>
            <option value="everyOtherDay">Every other day</option>
            <option value="weekly">Every week</option>
            <option value="monthly">Every month</option>
          </select>
        </label>

        <button type="submit">Add task</button>
      </form>
    </section>
  );
}

export default TaskForm;
