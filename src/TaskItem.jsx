import { useState } from 'react';

// In vanilla JS, toggle-ul edit/save se facea manual cu input.style.display.
// Aici, "isEditing" e o variabila de stare, iar JSX-ul decide singur
// ce sa afiseze (span sau input) in functie de valoarea ei.
export default function TaskItem({ task, onUpdate, onDelete }) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftText, setDraftText] = useState(task.text);

  function startEditing() {
    setDraftText(task.text);
    setIsEditing(true);
  }

  function saveEdit() {
    const text = draftText.trim();
    if (text === '') return; // nu salvam un task gol
    onUpdate(task.id, text);
    setIsEditing(false);
  }

  return (
    <li className="task">
      {isEditing ? (
        <input
          type="text"
          className="edit-input"
          value={draftText}
          onChange={e => setDraftText(e.target.value)}
          autoFocus
        />
      ) : (
        <span>{task.text}</span>
      )}

      <button className="edit" onClick={isEditing ? saveEdit : startEditing}>
        {isEditing ? 'Save' : 'Edit'}
      </button>
      <button className="remove" onClick={() => onDelete(task.id)}>
        Remove
      </button>
    </li>
  );
}
