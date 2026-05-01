import { useState } from "react";

function TaskItem({ task, selectedDate, onToggle, onEdit, onDelete }) {
  const isComplete = task.completedDates.includes(selectedDate);
  const [isEditing, setIsEditing] = useState(false);
  const [draftText, setDraftText] = useState(task.text);

  async function handleSaveEdit() {
    const wasSaved = await onEdit(task.id, draftText);

    if (wasSaved) {
      setIsEditing(false);
    }
  }

  function handleCancelEdit() {
    setDraftText(task.text);
    setIsEditing(false);
  }

  return (
    <li>
      {isEditing ? (
        <div className="task-edit-form">
          <input
            value={draftText}
            onChange={(event) => setDraftText(event.target.value)}
          />

          <button type="button" onClick={handleSaveEdit}>
            Save
          </button>

          <button type="button" onClick={handleCancelEdit}>
            Cancel
          </button>
        </div>
      ) : (
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
      )}

      {task.dueDate && <small>Started: {task.dueDate}</small>}

      {!isEditing && (
        <button type="button" onClick={() => setIsEditing(true)}>
          Edit
        </button>
      )}

      <button type="button" onClick={() => onDelete(task.id)}>
        Delete
      </button>
    </li>
  );
}

export default TaskItem;
