function TaskItem({ task, onToggle, onDelete }) {
  return (
    <li>
      <label className="task-item">
        <input
          type="checkbox"
          checked={task.completed}
          onChange={() => onToggle(task.id)}
        />

        <span className={task.completed ? "completed-task" : ""}>
          {task.text}
        </span>
      </label>

          {task.dueDate && <small>Due: {task.dueDate}</small>}
          
          <button type = "button" onClick={() => onDelete(task.id)}>Delete</button>
      
    </li>
  );
}

export default TaskItem;
