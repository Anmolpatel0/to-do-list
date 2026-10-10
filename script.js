
// ==========================================
// TaskFlow Studio - Application Logic
// ==========================================

// State Management
let tasks;

try {
    const savedTasks = localStorage.getItem('taskflow_studio_tasks');

    tasks = savedTasks ? JSON.parse(savedTasks) : [
        {
            id: 't_1',
            title: 'Prepare presentation slides for Monday team sync',
            category: 'Work',
            priority: 'High',
            dueDate: '2026-06-15',
            completed: false,
            createdAt: new Date().toISOString()
        },
        {
            id: 't_2',
            title: 'Buy groceries & fresh organic vegetables',
            category: 'Shopping',
            priority: 'Medium',
            dueDate: '2026-06-12',
            completed: true,
            createdAt: new Date().toISOString()
        },
        {
            id: 't_3',
            title: 'Read 2 chapters of the new design book',
            category: 'Personal',
            priority: 'Low',
            dueDate: '',
            completed: false,
            createdAt: new Date().toISOString()
        }
    ];

    if (!Array.isArray(tasks)) {
        tasks = [];
    }
} catch (error) {
    tasks = [];
}

let currentFilter = 'all';
let searchQuery = '';

// DOM Elements
const taskForm = document.getElementById('task-form');
const taskTitleInput = document.getElementById('task-title');
const taskCategoryInput = document.getElementById('task-category');
const taskPriorityInput = document.getElementById('task-priority');
const taskDueInput = document.getElementById('task-due');
const taskIdInput = document.getElementById('task-id');

const submitBtn = document.getElementById('submit-btn');
const cancelBtn = document.getElementById('cancel-btn');
const formTitle = document.getElementById('form-title');

const taskListContainer = document.getElementById('task-list');
const emptyState = document.getElementById('empty-state');
const searchInput = document.getElementById('search-input');
const clearCompletedBtn = document.getElementById('clear-completed');
const filterBtns = document.querySelectorAll('.filter-btn');

const statTotal = document.getElementById('stat-total');
const statActive = document.getElementById('stat-active');
const statCompleted = document.getElementById('stat-completed');

// ==========================================
// Theme Toggle
// ==========================================

const themeToggleBtn = document.getElementById('theme-toggle');
const themeIcon = document.getElementById('theme-icon');
const htmlElement = document.documentElement;

let savedTheme = 'light';

try {
    savedTheme = localStorage.getItem('taskflow_studio_theme') || 'light';
} catch (error) {
    // Use light theme if storage is unavailable.
}

if (savedTheme === 'dark') {
    htmlElement.classList.add('dark');
    themeIcon.className = 'fa-solid fa-sun text-sm';
}

themeToggleBtn.addEventListener('click', () => {
    const isDark = htmlElement.classList.toggle('dark');
    const theme = isDark ? 'dark' : 'light';

    themeIcon.className = isDark
        ? 'fa-solid fa-sun text-sm'
        : 'fa-solid fa-moon text-sm';

    try {
        localStorage.setItem('taskflow_studio_theme', theme);
    } catch (error) {
        // Theme still works for this page session.
    }
});

// ==========================================
// Toast Notifications
// ==========================================

let toastTimeout;

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');
    const toastIcon = document.getElementById('toast-icon');

    toastMessage.textContent = message;

    toastIcon.className = type === 'success'
        ? 'fa-solid fa-check-circle text-indigo-400 text-sm'
        : 'fa-solid fa-exclamation-circle text-rose-500 text-sm';

    toast.classList.remove(
        'translate-y-20',
        'opacity-0',
        'pointer-events-none'
    );

    clearTimeout(toastTimeout);

    toastTimeout = setTimeout(() => {
        toast.classList.add(
            'translate-y-20',
            'opacity-0',
            'pointer-events-none'
        );
    }, 3000);
}

// ==========================================
// Save Data and Refresh UI
// ==========================================

function persistAndRender() {
    try {
        localStorage.setItem(
            'taskflow_studio_tasks',
            JSON.stringify(tasks)
        );
    } catch (error) {
        showToast('Could not save tasks in browser storage', 'error');
    }

    renderTasks();
    updateStats();
}

// ==========================================
// Statistics
// ==========================================

function updateStats() {
    const total = tasks.length;
    const completed = tasks.filter(task => task.completed).length;
    const active = total - completed;

    statTotal.textContent = total;
    statActive.textContent = active;
    statCompleted.textContent = completed;
}

// ==========================================
// HTML Escaping (XSS Prevention)
// ==========================================

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };

    return String(text).replace(/[&<>"']/g, char => map[char]);
}

// ==========================================
// Render Tasks
// ==========================================

function renderTasks() {
    const query = searchQuery.toLowerCase();

    const filtered = tasks.filter(task => {
        const matchesSearch =
            task.title.toLowerCase().includes(query) ||
            task.category.toLowerCase().includes(query);

        if (currentFilter === 'active') {
            return !task.completed && matchesSearch;
        }

        if (currentFilter === 'completed') {
            return task.completed && matchesSearch;
        }

        return matchesSearch;
    });

    // Incomplete tasks first; newest first within each group.
    filtered.sort((a, b) => {
        if (a.completed !== b.completed) {
            return a.completed ? 1 : -1;
        }

        return new Date(b.createdAt) - new Date(a.createdAt);
    });

    taskListContainer.innerHTML = '';

    if (filtered.length === 0) {
        emptyState.classList.remove('hidden');
        return;
    }

    emptyState.classList.add('hidden');

    filtered.forEach(task => {
        const card = document.createElement('div');

        card.className =
            `task-card glass-card rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all animate-fade hover:shadow-md ${task.completed ? 'opacity-70' : ''}`;

        card.dataset.id = task.id;

        // Priority badge
        let priorityClass =
            'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300';

        if (task.priority === 'High') {
            priorityClass =
                'bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400 border border-rose-200 dark:border-rose-900';
        } else if (task.priority === 'Medium') {
            priorityClass =
                'bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400 border border-amber-200 dark:border-amber-900';
        } else if (task.priority === 'Low') {
            priorityClass =
                'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900';
        }

        // Category icon
        const categoryIcons = {
            Personal: 'fa-house',
            Work: 'fa-briefcase',
            Ideas: 'fa-lightbulb',
            Shopping: 'fa-cart-shopping'
        };

        const catIcon = categoryIcons[task.category] || 'fa-folder';

        // Due date
        let formattedDate = '';

        if (task.dueDate) {
            const dateObj = new Date(task.dueDate + 'T00:00:00');

            formattedDate = dateObj.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });
        }

        card.innerHTML = `
            <div class="flex items-start space-x-3 w-full sm:w-auto flex-grow">
                <label class="relative flex items-center justify-center mt-0.5 cursor-pointer">
                    <input
                        type="checkbox"
                        class="toggle-checkbox sr-only peer"
                        aria-label="Mark ${escapeHtml(task.title)} as ${task.completed ? 'incomplete' : 'complete'}"
                        ${task.completed ? 'checked' : ''}
                    >

                    <div class="w-5 h-5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 peer-checked:bg-indigo-600 peer-checked:border-indigo-600 flex items-center justify-center transition-all shadow-sm">
                        <svg class="w-3.5 h-3.5 text-white ${task.completed ? '' : 'hidden'}"
                             fill="none"
                             stroke="currentColor"
                             stroke-width="3"
                             viewBox="0 0 24 24">
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                    </div>
                </label>

                <div class="flex-grow">
                    <h4 class="text-sm font-medium ${
                        task.completed
                            ? 'line-through text-slate-400 dark:text-slate-500'
                            : 'text-slate-800 dark:text-slate-100'
                    }">
                        ${escapeHtml(task.title)}
                    </h4>

                    <div class="flex flex-wrap items-center gap-2 mt-2">
                        <span class="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 flex items-center gap-1">
                            <i class="fa-solid ${catIcon} text-[9px]"></i>
                            ${escapeHtml(task.category)}
                        </span>

                        <span class="px-2 py-0.5 rounded-md text-[10px] font-semibold ${priorityClass}">
                            ${escapeHtml(task.priority)}
                        </span>

                        ${task.dueDate ? `
                            <span class="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                <i class="fa-regular fa-calendar text-[10px]"></i>
                                ${formattedDate}
                            </span>
                        ` : ''}
                    </div>
                </div>
            </div>

            <div class="flex items-center space-x-1 self-end sm:self-center">
                <button
                    type="button"
                    class="edit-btn p-2 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-all"
                    title="Edit Task"
                    aria-label="Edit task">
                    <i class="fa-solid fa-pen text-xs"></i>
                </button>

                <button
                    type="button"
                    class="delete-btn p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all"
                    title="Delete Task"
                    aria-label="Delete task">
                    <i class="fa-solid fa-trash text-xs"></i>
                </button>
            </div>
        `;

        taskListContainer.appendChild(card);
    });
}

// ==========================================
// Create and Update Tasks
// ==========================================

taskForm.addEventListener('submit', event => {
    event.preventDefault();

    const title = taskTitleInput.value.trim();
    const category = taskCategoryInput.value;
    const priority = taskPriorityInput.value;
    const dueDate = taskDueInput.value;
    const id = taskIdInput.value;

    if (!title) {
        taskTitleInput.focus();
        return;
    }

    if (id) {
        tasks = tasks.map(task =>
            task.id === id
                ? { ...task, title, category, priority, dueDate }
                : task
        );

        showToast('Task updated successfully!');
        resetForm();
    } else {
        const newTask = {
            id: 'task_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
            title,
            category,
            priority,
            dueDate,
            completed: false,
            createdAt: new Date().toISOString()
        };

        tasks.unshift(newTask);

        showToast('Task added successfully!');
        taskForm.reset();
    }

    persistAndRender();
});

// ==========================================
// Task Actions: Complete, Edit, Delete
// ==========================================

taskListContainer.addEventListener('click', event => {
    const card = event.target.closest('.task-card');

    if (!card) return;

    const id = card.dataset.id;

    // Toggle task completion
    if (event.target.closest('.toggle-checkbox')) {
        tasks = tasks.map(task =>
            task.id === id
                ? { ...task, completed: !task.completed }
                : task
        );

        persistAndRender();
        return;
    }

    // Edit task
    if (event.target.closest('.edit-btn')) {
        const taskToEdit = tasks.find(task => task.id === id);

        if (!taskToEdit) return;

        taskTitleInput.value = taskToEdit.title;
        taskCategoryInput.value = taskToEdit.category;
        taskPriorityInput.value = taskToEdit.priority;
        taskDueInput.value = taskToEdit.dueDate || '';
        taskIdInput.value = taskToEdit.id;

        formTitle.innerHTML =
            '<i class="fa-solid fa-pen-to-square text-indigo-500"></i> Edit Task';

        submitBtn.innerHTML =
            '<i class="fa-solid fa-save"></i> Save Changes';

        cancelBtn.classList.remove('hidden');

        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });

        taskTitleInput.focus();
        return;
    }

    // Delete task
    if (event.target.closest('.delete-btn')) {
        tasks = tasks.filter(task => task.id !== id);

        if (taskIdInput.value === id) {
            resetForm();
        }

        showToast('Task removed', 'error');
        persistAndRender();
    }
});

// ==========================================
// Reset Form / Cancel Editing
// ==========================================

cancelBtn.addEventListener('click', resetForm);

function resetForm() {
    taskForm.reset();
    taskIdInput.value = '';

    formTitle.innerHTML =
        '<i class="fa-solid fa-circle-plus text-indigo-500"></i> Add New Task';

    submitBtn.innerHTML =
        '<i class="fa-solid fa-plus"></i> Add Task';

    cancelBtn.classList.add('hidden');
}

// ==========================================
// Filter Tabs
// ==========================================

filterBtns.forEach(button => {
    button.addEventListener('click', () => {
        filterBtns.forEach(btn => {
            btn.classList.remove(
                'bg-white',
                'dark:bg-slate-800',
                'text-slate-800',
                'dark:text-white',
                'shadow-sm'
            );

            btn.classList.add(
                'text-slate-600',
                'dark:text-slate-400'
            );
        });

        button.classList.add(
            'bg-white',
            'dark:bg-slate-800',
            'text-slate-800',
            'dark:text-white',
            'shadow-sm'
        );

        button.classList.remove(
            'text-slate-600',
            'dark:text-slate-400'
        );

        currentFilter = button.dataset.filter;

        renderTasks();
    });
});


// Search Tasks


searchInput.addEventListener('input', event => {
    searchQuery = event.target.value;
    renderTasks();
});


// Clear Completed Tasks

clearCompletedBtn.addEventListener('click', () => {
    const completedCount = tasks.filter(task => task.completed).length;

    if (completedCount === 0) {
        showToast('No completed tasks found', 'error');
        return;
    }

    tasks = tasks.filter(task => !task.completed);

    if (taskIdInput.value && !tasks.some(task => task.id === taskIdInput.value)) {
        resetForm();
    }

    showToast('Completed tasks cleared');
    persistAndRender();
});


// Initial Application Load


renderTasks();
updateStats();

