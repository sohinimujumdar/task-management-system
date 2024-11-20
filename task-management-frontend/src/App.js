import React, { useState, useEffect } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import './style.css'; 


// Connect to WebSocket server
const socket = io('http://localhost:3001');

function App() {
  const [tasks, setTasks] = useState([]);
  const [newTaskText, setNewTaskText] = useState('');
  const [priority, setPriority] = useState('Low');
  const [editingTaskId, setEditingTaskId] = useState(null); // For editing task
  const [updatedText, setUpdatedText] = useState(''); // For updated task text

  // Fetch tasks when the app loads
  useEffect(() => {
    axios.get('http://localhost:3001/tasks')
      .then(response => setTasks(response.data))
      .catch(error => console.log(error));

    // Listen for task updates via WebSocket
    socket.on('new-task', (task) => {
      setTasks((prevTasks) => [...prevTasks, task]);
    });

    socket.on('delete-task', (taskId) => {
      setTasks((prevTasks) => prevTasks.filter(task => task._id !== taskId));
    });

    socket.on('update-task', (updatedTask) => {
      setTasks((prevTasks) =>
        prevTasks.map(task => (task._id === updatedTask._id ? updatedTask : task))
      );
    });

    // Cleanup WebSocket listeners when component unmounts
    return () => {
      socket.off('new-task');
      socket.off('delete-task');
      socket.off('update-task');
    };
  }, []);

  // Add a new task
  const handleAddTask = async () => {
    try {
      await axios.post('http://localhost:3001/task/new', {
        text: newTaskText,
        priority: priority,
      });
      setNewTaskText(''); // Clear input field after adding
      setPriority('Low'); // Reset priority
    } catch (error) {
      console.log(error);
    }
  };

  // Delete a task
  const handleDeleteTask = async (id) => {
    try {
      await axios.delete(`http://localhost:3001/task/delete/${id}`);
    } catch (error) {
      console.log(error);
    }
  };

  // Update a task
  const handleUpdateTask = async (id, newText) => {
    try {
      await axios.put(`http://localhost:3001/task/update/${id}`, { text: newText });
      setEditingTaskId(null); // Reset editing state after update
      setUpdatedText(''); // Clear the updated text input
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="App">
      <h1>Task Management</h1>

      {/* Add task section */}
      <div>
        <input
          type="text"
          value={newTaskText}
          onChange={(e) => setNewTaskText(e.target.value)}
          placeholder="Enter a new task"
        />
        <select value={priority} onChange={(e) => setPriority(e.target.value)}>
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
        </select>
        <button onClick={handleAddTask}>Add Task</button>
      </div>

      {/* Task list */}
      <ul>
        {tasks.map((task) => (
          <li key={task._id}>
            <span>{task.text} ({task.priority})</span>

            {/* Edit Task button */}
            {editingTaskId === task._id ? (
              <div>
                <input
                  type="text"
                  value={updatedText}
                  onChange={(e) => setUpdatedText(e.target.value)}
                  placeholder="Update task text"
                />
                <button onClick={() => handleUpdateTask(task._id, updatedText)}>Save</button>
                <button onClick={() => setEditingTaskId(null)}>Cancel</button>
              </div>
            ) : (
              <button onClick={() => setEditingTaskId(task._id)}>Edit</button>
            )}

            {/* Delete Task button */}
            <button onClick={() => handleDeleteTask(task._id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
