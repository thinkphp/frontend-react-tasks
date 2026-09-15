import { useState, useEffect } from 'react';
import TaskItem from './TaskItem.jsx';
import './index.css';

export default function App() {
  // Local (npm run dev): VITE_API_URL lipseste din .env => API_URL = ''
  //   => fetch('/api/tasks') merge prin proxy-ul din vite.config.js catre localhost:8000
  // Productie (Vercel build): VITE_API_URL vine din Environment Variables (Vercel)
  //   => fetch('https://backend-fastapi-postgres-render.onrender.com/api/tasks')
 const API_URL = import.meta.env.VITE_API_URL || '';
//    const API_URL = '';

  // In vanilla JS, lista traia direct in DOM (elementele <li> erau "sursa de adevar").
  // In React, lista traieste in state - JSX-ul e doar o "oglinda" a acestui state.
  const [tasks, setTasks] = useState([]);
  const [newTaskText, setNewTaskText] = useState('');

  // Echivalentul loadTasks() - se ruleaza o singura data, la montarea componentei
  // (in vanilla JS era apelat manual, la finalul scriptului)
  useEffect(() => {
    fetch(`${API_URL}/api/tasks`)
      .then(res => res.json())
      .then(data => setTasks(data));
  }, []);

  // Echivalentul addTask() - trimite catre server, apoi actualizeaza state-ul local
  async function handleAddTask() {
    const text = newTaskText.trim();
    if (text === '') return;

    const res = await fetch(`${API_URL}/api/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });

    if (res.ok) {
      const task = await res.json();
      setTasks(prev => [...prev, task]); // adauga task-ul nou in state, nu in DOM direct
      setNewTaskText('');
    }
  }

  // Echivalentul PUT din edit - actualizeaza task-ul pe server, apoi in state
  async function handleUpdateTask(id, newText) {
    const res = await fetch(`${API_URL}/api/tasks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: newText })
    });

    if (res.ok) {
      setTasks(prev =>
        prev.map(t => (t.id === id ? { ...t, text: newText } : t))
      );
    }
  }

  // Echivalentul DELETE - sterge de pe server, apoi filtreaza din state
  async function handleDeleteTask(id) {
    const res = await fetch(`${API_URL}/api/tasks/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setTasks(prev => prev.filter(t => t.id !== id));
    }
  }

  return (
    <div className="container">
      <h1>Lista mea de task-uri</h1>

      <div className="add-task">
        <input
          type="text"
          value={newTaskText}
          onChange={e => setNewTaskText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAddTask()}
          placeholder="Adaugă un task nou..."
        />
        <button onClick={handleAddTask}>Adaugă</button>
      </div>

      <ul className="task-list">
        {tasks.map(task => (
          <TaskItem
            key={task.id}
            task={task}
            onUpdate={handleUpdateTask}
            onDelete={handleDeleteTask}
          />
        ))}
      </ul>
    </div>
  );
}
