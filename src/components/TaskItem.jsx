function TaskItem({ task, selectedDate, onToggle, onDelete }) {
  const isComplete = task.completedDates.includes(selectedDate);

  return (
    <li>
      <label className="task-item">
        <input
          type="checkbox"
          checked={isComplete}
          onChange={() => onToggle(task.id, selectedDate)}
        />

        <span className={isComplete ? "completed-task" : ""}>
          {task.text}
        </span>
      </label>

      {task.dueDate && <small>Started: {task.dueDate}</small>}

      <button type="button" onClick={() => onDelete(task.id)}>
        Delete
      </button>
    </li>
  );
}

export default TaskItem;
