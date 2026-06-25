document.addEventListener('DOMContentLoaded', () => {
  const notesArea = document.getElementById('notes-area');
  const taskTitleInput = document.getElementById('task-title');
  const taskDescInput = document.getElementById('task-desc');
  const addTaskBtn = document.getElementById('add-task-btn');
  const taskList = document.getElementById('task-list');

  let tasks = [];

  // Load Data on Startup
  chrome.storage.local.get(['notes', 'tasks'], (data) => {
    if (data.notes) notesArea.value = data.notes;
    if (data.tasks) {
      tasks = data.tasks;
      renderTasks();
    }
  });

  // Auto-save Notes
  notesArea.addEventListener('input', () => {
    chrome.storage.local.set({ notes: notesArea.value });
  });

  // Add Task
  addTaskBtn.addEventListener('click', () => {
    const title = taskTitleInput.value.trim();
    const desc = taskDescInput.value.trim();

    if (title === '') return; // Prevent empty tasks

    const newTask = {
      id: Date.now().toString(), // Unique ID based on timestamp
      title: title,
      desc: desc,
      completed: false,
      createdAt: Date.now()
    };

    tasks.unshift(newTask); // Add new task to the top
    saveTasks();
    renderTasks();

    // Clear inputs
    taskTitleInput.value = '';
    taskDescInput.value = '';
  });

  // Render Tasks to DOM
  function renderTasks() {
    taskList.innerHTML = '';
    
    tasks.forEach(task => {
      const taskDiv = document.createElement('div');
      taskDiv.className = `task-item ${task.completed ? 'completed' : ''}`;
      
      taskDiv.innerHTML = `
        <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} data-id="${task.id}">
        <div class="task-text">
          <h3>${escapeHTML(task.title)}</h3>
          ${task.desc ? `<p>${escapeHTML(task.desc)}</p>` : ''}
        </div>
        <button class="delete-btn" data-id="${task.id}">✕</button>
      `;
      
      taskList.appendChild(taskDiv);
    });

    // Attach event listeners to checkboxes and delete buttons
    document.querySelectorAll('.task-checkbox').forEach(box => {
      box.addEventListener('change', toggleComplete);
    });
    
    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', deleteTask);
    });
  }

  // Toggle Checkbox
  function toggleComplete(e) {
    const id = e.target.getAttribute('data-id');
    const taskIndex = tasks.findIndex(t => t.id === id);
    if (taskIndex > -1) {
      tasks[taskIndex].completed = e.target.checked;
      saveTasks();
      renderTasks();
    }
  }

  // Delete Task
  function deleteTask(e) {
    const id = e.target.getAttribute('data-id');
    tasks = tasks.filter(t => t.id !== id);
    saveTasks();
    renderTasks();
  }

  // Save Tasks to Chrome Storage
  function saveTasks() {
    chrome.storage.local.set({ tasks: tasks });
  }

  // Basic HTML Escaping to prevent XSS issues when inserting variables into DOM
  function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
      tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag]));
  }
});