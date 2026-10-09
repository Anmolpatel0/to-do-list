/**
 * TaskMaster Pro - Advanced To-Do Application
 * Designed with a modular, state-driven architecture, event delegation, 
 * and persistent local storage synchronization.
 */

class TaskManager {
    constructor() {
        // Initialize state from local storage or fallback to defaults
        this.tasks = JSON.parse(localStorage.getItem('taskmaster_tasks')) || [
            { id: '1', text: 'Review quarterly architecture roadmap', completed: true, createdAt: new Date(Date.now() - 86400000).toISOString() },
            { id: '2', text: 'Optimize database indexes for query performance', completed: false, createdAt: new Date().toISOString() }
        ];
        
        this.currentFilter = 'all';
        this.editingId = null;

        this.initDOMReferences();
        this.bindEvents();
        this.render();
    }

    initDOMReferences() {
        this.form = document.getElementById('task-form');
        this.input = document.getElementById('task-input');
        this.taskList = document.getElementById('task-list');
        this.filterBtns = document.querySelectorAll('.filter-btn');
        this.taskCount = document.getElementById('task-count');
        this.clearCompletedBtn = document.getElementById('clear-completed');
    }

    bindEvents() {
        // Handle form submission (Create / Update)
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleFormSubmit();
        });

        // Event delegation for list actions (Toggle, Edit, Delete)
        this.taskList.addEventListener('click', (e) => {
            const target = e.target;
            const li = target.closest('.task-item');
            if (!li) return;

            const id = li.dataset.id;

            if (target.classList.contains('task-checkbox') || target.closest('.task-checkbox')) {
                this.toggleTask(id);
            } else if (target.classList.contains('delete-btn') || target.closest('.delete-btn')) {
                this.deleteTask(id);
            } else if (target.classList.contains('edit-btn') || target.closest('.edit-btn')) {
                this.startEdit(id);
            }
        });

        // Filter tab switching
        this.filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentFilter = btn.dataset.filter;
                this.render();
            });
        });

        // Clear completed batch action
        this.clearCompletedBtn.addEventListener('click', () => {
            this.tasks = this.tasks.filter(task => !task.completed);
            this.saveAndRender();
        });
    }

    handleFormSubmit() {
        const text = this.input.value.trim();
        if (!text) return;

        if (this.editingId) {
            // Update existing task
            this.tasks = this.tasks.map(task => 
                task.id === this.editingId ? { ...task, text } : task
            );
            this.editingId = null;
            this.form.querySelector('button[type="submit"]').textContent = 'Add Task';
        } else {
            // Create new task object
            const newTask = {
                id: '_' + Math.random().toString(36).substr(2, 9),
                text,
                completed: false,
                createdAt: new Date().toISOString()
            };
            this.tasks.unshift(newTask);
        }

        this.input.value = '';
        this.saveAndRender();
    }

    toggleTask(id) {
        this.tasks = this.tasks.map(task =>
            task.id === id ? { ...task, completed: !task.completed } : task
        );
        this.saveAndRender();
    }

    deleteTask(id) {
        // Add subtle fade-out transition hook if desired
        const element = document.querySelector(`[data-id="${id}"]`);
        if (element) {
            element.style.transform = 'translateX(20px)';
            element.style.opacity = '0';
            setTimeout(() => {
                this.tasks = this.tasks.filter(task => task.id !== id);
                this.saveAndRender();
            }, 200);
        } else {
            this.tasks = this.tasks.filter(task => task.id !== id);
            this.saveAndRender();
        }
    }

    startEdit(id) {
        const task = this.tasks.find(t => t.id === id);
        if (!task) return;

        this.input.value = task.text;
        this.input.focus();
        this.editingId = id;
        this.form.querySelector('button[type="submit"]').textContent = 'Update Task';
    }

    getFilteredTasks() {
        switch (this.currentFilter) {
            case 'active':
                return this.tasks.filter(t => !t.completed);
            case 'completed':
                return this.tasks.filter(t => t.completed);
            default:
                return this.tasks;
        }
    }

    saveState() {
        localStorage.setItem('taskmaster_tasks', JSON.stringify(this.tasks));
    }

    saveAndRender() {
        this.saveState();
        this.render();
    }

    render() {
        const filteredTasks = this.getFilteredTasks();
        
        // Render dynamic DOM items
        this.taskList.innerHTML = filteredTasks.length === 0 
            ? `<li class="empty-state">No tasks found in this view.</li>`
            : filteredTasks.map(task => `
                <li class="task-item ${task.completed ? 'completed' : ''}" data-id="${task.id}">
                    <div class="task-content">
                        <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
                        <span class="task-text">${this.escapeHTML(task.text)}</span>
                    </div>
                    <div class="task-actions">
                        <button class="edit-btn" title="Edit Task">✏️</button>
                        <button class="delete-btn" title="Delete Task">🗑️</button>
                    </div>
                </li>
            `).join('');

        // Update active items counter
        const activeCount = this.tasks.filter(t => !t.completed).length;
        this.taskCount.textContent = `${activeCount} item${activeCount === 1 ? '' : 's'} left`;
    }

    escapeHTML(str) {
        return str.replace(/[&<>'"]/g, 
            tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
        );
    }
}

// Bootstrap application instance on DOM load
document.addEventListener('DOMContentLoaded', () => {
    window.taskManager = new TaskManager();
});
