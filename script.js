// Get references to the elements
const taskInput = document.getElementById("taskInput");
const dueDateInput = document.getElementById("dueDateInput");
const prioritySelect = document.getElementById("prioritySelect");
const categorySelect = document.getElementById("categorySelect");
const estimatedTimeInput = document.getElementById("estimatedTimeInput");
const addTaskBtn = document.getElementById("addTaskBtn");
const taskList = document.getElementById("taskList");
const clearCompletedBtn = document.getElementById("clearCompletedBtn");
const taskCounter = document.getElementById("taskCounter");
const emptyMessage = document.getElementById("emptyMessage");
const localStorageWarning = document.getElementById("localStorageWarning");
const searchInput = document.getElementById("searchInput");
const sortBySelect = document.getElementById("sortBySelect");
const sortOrderSelect = document.getElementById("sortOrderSelect");
const filterCompletedCheckbox = document.getElementById("filterCompleted");
const viewArchiveBtn = document.getElementById("viewArchiveBtn");
const viewActiveBtn = document.getElementById("viewActiveBtn");
const viewTasksBtn = document.getElementById("viewTasksBtn");
const viewFilesBtn = document.getElementById("viewFilesBtn");

// Check if local storage is available
let isLocalStorageAvailable = checkLocalStorageAvailability();

// Load tasks from local storage
let tasks = loadTasks();
let archivedTasks = loadArchivedTasks(); // Load archived tasks
let showArchive = false;
let showFiles = false; // Flag to indicate if we are in "files" view
renderTasks();

// Event Listeners
addTaskBtn.addEventListener("click", addTask);
clearCompletedBtn.addEventListener("click", clearCompletedTasks);
searchInput.addEventListener("input", handleSearch);
sortBySelect.addEventListener("change", renderTasks);
sortOrderSelect.addEventListener("change", renderTasks);
filterCompletedCheckbox.addEventListener("change", renderTasks);
viewArchiveBtn.addEventListener("click", () => {
    showArchive = true;
    renderTasks();
    viewArchiveBtn.style.display = "none";
    viewActiveBtn.style.display = "inline-block";
});
viewActiveBtn.addEventListener("click", () => {
    showArchive = false;
    renderTasks();
    viewArchiveBtn.style.display = "inline-block";
    viewActiveBtn.style.display = "none";
});

// Event listeners for view toggle buttons
viewTasksBtn.addEventListener("click", () => {
    showFiles = false;
    viewTasksBtn.classList.add("active");
    viewFilesBtn.classList.remove("active");
    renderTasks();
});

viewFilesBtn.addEventListener("click", () => {
    showFiles = true;
    viewTasksBtn.classList.remove("active");
    viewFilesBtn.classList.add("active");
    renderTasks();
});

// Add task by pressing Enter
taskInput.addEventListener("keyup", (event) => {
    if (event.key === "Enter") {
        addTask();
    }
});

// Function to add a new task
function addTask() {
    const taskText = taskInput.value.trim();
    const dueDate = dueDateInput.value;
    const priority = prioritySelect.value;
    const category = categorySelect.value;
    const estimatedTime = estimatedTimeInput.value;
    const currentDateTime = getCurrentDateTime();

    if (taskText === "" || !taskText.replace(/\s/g, '').length) {
        alert("Please enter a valid task!");
        return;
    }

    const newTask = {
        text: taskText,
        completed: false,
        dueDate: dueDate,
        priority: priority,
        category: category,
        estimatedTime: estimatedTime,
        dateTime: currentDateTime,
        notes: "",
        subtasks: [] // Initialize subtasks array
    };

    tasks.push(newTask);

    if (isLocalStorageAvailable) {
        saveTasks();
    }

    renderTasks();
    taskInput.value = "";
    dueDateInput.value = "";
    prioritySelect.value = "None";
    categorySelect.value = "";
    estimatedTimeInput.value = "";
}

// Function to render (display) the tasks
function renderTasks() {
    taskList.innerHTML = "";

    let tasksToDisplay = showArchive ? archivedTasks : tasks;

    if (showFiles) {
        // Group by category and render
        renderTasksByCategory(tasksToDisplay);
    } else {
        // Regular task rendering
        renderTaskList(tasksToDisplay);
    }

    updateTaskCounter();
    toggleEmptyMessage();

    if (!isLocalStorageAvailable) {
        showLocalStorageWarning();
    }
}

function renderTaskList(tasksToDisplay) {
    let filteredTasks = filterTasks(tasksToDisplay, searchInput.value);

    // Apply filtering for completed/incomplete tasks
    if (filterCompletedCheckbox.checked && !showArchive) {
        filteredTasks = filteredTasks.filter(task => task.completed);
    }

    // Sort the tasks
    const sortedTasks = sortTasks(filteredTasks, sortBySelect.value, sortOrderSelect.value);

    sortedTasks.forEach((task, index) => {
        const taskItem = createTaskItem(task, index);
        taskList.appendChild(taskItem);
    });
}

function createTaskItem(task, taskIndex) {
    const taskItem = document.createElement("li");
    taskItem.classList.add("add-animation");
    taskItem.setAttribute('draggable', true);
    taskItem.setAttribute('id', 'task-' + taskIndex);

    // Add event listeners for drag and drop
    taskItem.addEventListener('dragstart', handleDragStart);
    taskItem.addEventListener('dragover', handleDragOver);
    taskItem.addEventListener('drop', handleDrop);
    taskItem.addEventListener('dragleave', handleDragLeave);

    // Task text
    const taskTextSpan = document.createElement("span");
    taskTextSpan.textContent = task.text;
    taskTextSpan.classList.add("task-text");

    // Add priority class to task text
    if (task.priority !== "None") {
        taskTextSpan.classList.add(`priority-${task.priority.toLowerCase()}`);
    }

    if (task.completed) {
        taskItem.classList.add("completed");
    }

    // Create a delete button
    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "×";
    deleteBtn.classList.add("delete-btn");
    deleteBtn.addEventListener("click", (event) => {
        event.stopPropagation();
        const taskIndex = showArchive ? archivedTasks.indexOf(task) : tasks.indexOf(task);
        confirmDeleteTask(taskIndex);
    });

    // Create an edit input field (hidden by default)
    const editInput = document.createElement("input");
    editInput.type = "text";
    editInput.value = task.text;
    editInput.classList.add("edit-input");

    editInput.addEventListener("blur", () => {
        const taskIndex = showArchive ? archivedTasks.indexOf(task) : tasks.indexOf(task);
        saveEditedTask(taskIndex, editInput.value);
    });

    editInput.addEventListener("keyup", (event) => {
        if (event.key === "Enter") {
            const taskIndex = showArchive ? archivedTasks.indexOf(task) : tasks.indexOf(task);
            saveEditedTask(taskIndex, editInput.value);
        }
    });

    // Double-click to edit
    taskTextSpan.addEventListener("dblclick", (event) => {
        event.stopPropagation();
        taskItem.classList.add("editing");
        editInput.style.display = "block";
        taskTextSpan.style.display = "none";
        editInput.focus();
    });

    // Create task details (due date, priority, category)
    const taskDetailsSpan = document.createElement("span");
    taskDetailsSpan.classList.add("task-details");

    if (task.dueDate) {
        const dueDateSpan = document.createElement("span");
        dueDateSpan.textContent = `Due: ${task.dueDate}`;
        taskDetailsSpan.appendChild(dueDateSpan);
    }

    if (task.priority !== "None") {
        const prioritySpan = document.createElement("span");
        prioritySpan.textContent = `Priority: ${task.priority}`;
        taskDetailsSpan.appendChild(prioritySpan);
    }

    if (task.category) {
        const categorySpan = document.createElement("span");
        categorySpan.textContent = `Category: ${task.category}`;
        taskDetailsSpan.appendChild(categorySpan);
    }

    if (task.estimatedTime) {
        const estimatedTimeSpan = document.createElement("span");
        estimatedTimeSpan.textContent = `Estimated Time: ${task.estimatedTime} hours`;
        taskDetailsSpan.appendChild(estimatedTimeSpan);
    }

    // Create the notes area (textarea)
    const taskNotes = document.createElement("textarea");
    taskNotes.classList.add("task-notes");
    taskNotes.value = task.notes || "";
    taskNotes.placeholder = "Add notes here...";

    // Save notes on change (using 'blur' event for efficiency)
    taskNotes.addEventListener("blur", () => {
        const taskIndex = showArchive ? archivedTasks.indexOf(task) : tasks.indexOf(task);
        saveTaskNotes(taskIndex, taskNotes.value);
    });

    // Create Notes Button
    const notesBtn = document.createElement("button");
    notesBtn.textContent = "Notes";
    notesBtn.classList.add("notes-btn");
    notesBtn.addEventListener("click", (event) => {
        event.stopPropagation();
        taskNotes.style.display = taskNotes.style.display === "block" ? "none" : "block";
    });

    // Create Finished Button
    const completedBtn = document.createElement("button");
    completedBtn.textContent = "Finished";
    completedBtn.classList.add("completed-btn");
    completedBtn.addEventListener("click", (event) => {
        event.stopPropagation();
        const taskIndex = showArchive ? archivedTasks.indexOf(task) : tasks.indexOf(task);
        toggleTaskCompletion(taskIndex);
    });

    // Append elements to task item
    const taskButtons = document.createElement("div");
    taskButtons.classList.add("task-buttons");
    taskButtons.appendChild(notesBtn);
    taskButtons.appendChild(completedBtn);
    taskButtons.appendChild(deleteBtn);

    taskItem.appendChild(taskTextSpan);
    taskItem.appendChild(editInput);
    taskItem.appendChild(taskDetailsSpan);
    taskItem.appendChild(taskButtons);
    taskItem.appendChild(taskNotes);

    // Create a container for subtasks
    const subtasksContainer = document.createElement("div");
    subtasksContainer.classList.add("subtasks-container");
    taskItem.appendChild(subtasksContainer);

    // Render existing subtasks
    if (task.subtasks && task.subtasks.length > 0) {
        renderSubtasks(task.subtasks, subtasksContainer, taskIndex);
    }

    // Add a button to add new subtasks
    const addSubtaskBtn = document.createElement("button");
    addSubtaskBtn.textContent = "+ Add Subtask";
    addSubtaskBtn.classList.add("add-subtask-btn", "button");
    addSubtaskBtn.addEventListener("click", () => {
        const taskIndex = showArchive ? archivedTasks.indexOf(task) : tasks.indexOf(task);
        addSubtask(taskIndex, subtasksContainer);
    });
    taskItem.appendChild(addSubtaskBtn);

    return taskItem;
}

function renderSubtasks(subtasks, container, taskIndex) {
    const subtasksList = document.createElement("ul");
    subtasksList.classList.add("subtasks");

    subtasks.forEach((subtask, subIndex) => {
        const subtaskItem = document.createElement("li");
        subtaskItem.classList.add("subtask-item");

        const subtaskTextSpan = document.createElement("span");
        subtaskTextSpan.textContent = subtask.text;
        subtaskTextSpan.classList.add("subtask-text");

        if (subtask.completed) {
            subtaskTextSpan.style.textDecoration = "line-through";
            subtaskTextSpan.style.color = "#777";
        }

        // Checkbox for marking subtask as complete
        const subtaskCheckbox = document.createElement("input");
        subtaskCheckbox.type = "checkbox";
        subtaskCheckbox.checked = subtask.completed;
        subtaskCheckbox.addEventListener("change", () => {
            handleSubtaskCompletion(taskIndex, subIndex, subtaskCheckbox.checked);
        });

        // Append elements to subtask item
        subtaskItem.appendChild(subtaskCheckbox);
        subtaskItem.appendChild(subtaskTextSpan);

        // Handle subtask text editing (similar to task editing)
        subtaskTextSpan.addEventListener("dblclick", (event) => {
            event.stopPropagation();
            const editInput = document.createElement("input");
            editInput.type = "text";
            editInput.value = subtask.text;
            editInput.classList.add("edit-input");

            editInput.addEventListener("blur", () => {
                saveEditedSubtask(taskIndex, subIndex, editInput.value);
                subtaskTextSpan.textContent = editInput.value;
                subtaskItem.replaceChild(subtaskTextSpan, editInput);
            });

            editInput.addEventListener("keyup", (event) => {
                if (event.key === "Enter") {
                    saveEditedSubtask(taskIndex, subIndex, editInput.value);
                    subtaskTextSpan.textContent = editInput.value;
                    subtaskItem.replaceChild(subtaskTextSpan, editInput);
                }
            });

            subtaskItem.replaceChild(editInput, subtaskTextSpan);
            editInput.focus();
        });

        // Add a delete button for the subtask
        const deleteSubtaskBtn = document.createElement("button");
        deleteSubtaskBtn.textContent = "×";
        deleteSubtaskBtn.classList.add("delete-btn", "delete-subtask-btn");
        deleteSubtaskBtn.addEventListener("click", (event) => {
            event.stopPropagation();
            confirmDeleteSubtask(taskIndex, subIndex);
        });

        subtaskItem.appendChild(deleteSubtaskBtn);
        subtasksList.appendChild(subtaskItem);
    });

    container.appendChild(subtasksList);
}

// Function to add a subtask
function addSubtask(taskIndex, container) {
    const subtaskText = prompt("Enter subtask text:");
    if (subtaskText && subtaskText.trim() !== "") {
        const newSubtask = {
            text: subtaskText,
            completed: false
        };

        if (showArchive) {
            archivedTasks[taskIndex].subtasks.push(newSubtask);
        } else {
            tasks[taskIndex].subtasks.push(newSubtask);
        }

        if (isLocalStorageAvailable) {
            saveTasks();
            saveArchivedTasks();
        }

        // Clear the existing subtasks and re-render
        container.innerHTML = '';
        renderSubtasks(showArchive ? archivedTasks[taskIndex].subtasks : tasks[taskIndex].subtasks, container, taskIndex);
    }
}

// Function to save an edited subtask
function saveEditedSubtask(taskIndex, subtaskIndex, newText) {
    if (showArchive) {
        archivedTasks[taskIndex].subtasks[subtaskIndex].text = newText;
    } else {
        tasks[taskIndex].subtasks[subtaskIndex].text = newText;
    }

    if (isLocalStorageAvailable) {
        saveTasks();
        saveArchivedTasks();
    }

    renderTasks();
}

// Function to confirm the deletion of a subtask
function confirmDeleteSubtask(taskIndex, subtaskIndex) {
    if (confirm("Are you sure you want to delete this subtask?")) {
        if (showArchive) {
            archivedTasks[taskIndex].subtasks.splice(subtaskIndex, 1);
        } else {
            tasks[taskIndex].subtasks.splice(subtaskIndex, 1);
        }

        if (isLocalStorageAvailable) {
            saveTasks();
            saveArchivedTasks();
        }

        renderTasks();
    }
}

// Function to handle subtask completion
function handleSubtaskCompletion(taskIndex, subtaskIndex, isChecked) {
    let task;
    if (showArchive) {
        task = archivedTasks[taskIndex];
    } else {
        task = tasks[taskIndex];
    }
    if (task && task.subtasks && task.subtasks.length > subtaskIndex) {
        task.subtasks[subtaskIndex].completed = isChecked;

        // Update task completion status based on subtasks
        task.completed = task.subtasks.every(subtask => subtask.completed);

        if (isLocalStorageAvailable) {
            saveTasks();
            saveArchivedTasks();
        }

        renderTasks();
    }
}

// Function to render tasks grouped by category
function renderTasksByCategory(tasksToDisplay) {
    taskList.innerHTML = ""; // Clear the list

    // Filter tasks based on search query (if any)
    const filteredTasks = filterTasks(tasksToDisplay, searchInput.value);

    const groupedTasks = {};
    filteredTasks.forEach((task, index) => {
        const category = task.category || "Uncategorized";
        if (!groupedTasks[category]) {
            groupedTasks[category] = [];
        }
        groupedTasks[category].push({ task, index });
    });

    for (const category in groupedTasks) {
        // Create category heading
        const categoryHeading = document.createElement("h2");
        categoryHeading.textContent = category;
        categoryHeading.classList.add("category-heading");
        taskList.appendChild(categoryHeading);

        // Create a list for tasks in this category
        const categoryTaskList = document.createElement("ul");
        categoryTaskList.classList.add("category-task-list");
        
        groupedTasks[category].forEach(({ task, index }) => {
            const taskItem = createTaskItem(task, index);
            categoryTaskList.appendChild(taskItem);
        });
        taskList.appendChild(categoryTaskList);
    }
}

// Function to delete a task (with confirmation)
function confirmDeleteTask(index) {
    const taskToDelete = showArchive ? archivedTasks[index] : tasks[index];

    if (confirm("Are you sure you want to delete this task?")) {
        if (showArchive) {
            archivedTasks.splice(index, 1);
        } else {
            tasks.splice(index, 1);
        }

        if (isLocalStorageAvailable) {
            saveTasks();
            saveArchivedTasks();
        }

        renderTasks();
    }
}

// Function to toggle task completion status
function toggleTaskCompletion(index) {
    if (showArchive) {
        // Move from archived to active
        const taskToRestore = archivedTasks.splice(index, 1)[0];
        taskToRestore.completed = false; // Reset completed status
        tasks.push(taskToRestore);
    } else {
        // Move from active to archived
        const taskToArchive = tasks.splice(index, 1)[0];
        taskToArchive.completed = true; // Mark as completed
        archivedTasks.push(taskToArchive);
    }

    if (isLocalStorageAvailable) {
        saveTasks();
        saveArchivedTasks();
    }

    renderTasks();
}

// Function to clear all completed tasks
function clearCompletedTasks() {
    if (showArchive) {
        // Clear completed tasks from archivedTasks
        archivedTasks = archivedTasks.filter(task => !task.completed);
    } else {
        // Clear completed tasks from tasks
        tasks = tasks.filter(task => !task.completed);
    }

    if (isLocalStorageAvailable) {
        saveTasks();
        saveArchivedTasks();
    }

    renderTasks();
}

// Function to save an edited task
function saveEditedTask(index, newText) {
    if (showArchive) {
        archivedTasks[index].text = newText;
    } else {
        tasks[index].text = newText;
    }

    if (isLocalStorageAvailable) {
        saveTasks();
        saveArchivedTasks();
    }

    renderTasks();
}

// Function to update the task counter
function updateTaskCounter() {
    const remainingTasks = tasks.filter(task => !task.completed).length;
    const archivedTaskCount = archivedTasks.length;
    taskCounter.textContent = showArchive
        ? `${archivedTaskCount} archived task(s)`
        : `${remainingTasks} task${remainingTasks === 1 ? '' : 's'} remaining`;
}

// Function to toggle the empty message
function toggleEmptyMessage() {
    emptyMessage.classList.toggle("show", tasks.length === 0);
}

// Function to show local storage warning
function showLocalStorageWarning() {
    localStorageWarning.classList.add("show");
}

// Function to save tasks to local storage
function saveTasks() {
    localStorage.setItem("tasks", JSON.stringify(tasks));
}

// Function to load tasks from local storage
function loadTasks() {
    const tasksJSON = localStorage.getItem("tasks");
    return tasksJSON ? JSON.parse(tasksJSON) : [];
}

// Function to save archived tasks to local storage
function saveArchivedTasks() {
    localStorage.setItem("archivedTasks", JSON.stringify(archivedTasks));
}

// Function to load archived tasks from local storage
function loadArchivedTasks() {
    const archivedTasksJSON = localStorage.getItem("archivedTasks");
    return archivedTasksJSON ? JSON.parse(archivedTasksJSON) : [];
}

// Function to check local storage availability
function checkLocalStorageAvailability() {
    try {
        const testKey = "__test__";
        localStorage.setItem(testKey, testKey);
        localStorage.removeItem(testKey);
        return true;
    } catch (e) {
        return false;
    }
}

// Function to get current date and time
function getCurrentDateTime() {
    const now = new Date();
    const date = now.toLocaleDateString();
    const time = now.toLocaleTimeString();
    return `${date}, ${time}`;
}

// Function to handle search
function handleSearch() {
    renderTasks();
}

// Function to filter tasks
function filterTasks(tasksToFilter, searchQuery) {
    if (!searchQuery) {
        return tasksToFilter;
    }

    const query = searchQuery.toLowerCase();
    return tasksToFilter.filter(task => {
        return task.text.toLowerCase().includes(query) ||
               (task.dueDate && task.dueDate.includes(query)) ||
               (task.priority && task.priority.toLowerCase().includes(query)) ||
               (task.category && task.category.toLowerCase().includes(query));
    });
}

// Function to sort tasks
function sortTasks(tasksToSort, sortBy, sortOrder) {
    const sortedTasks = [...tasksToSort];

    sortedTasks.sort((a, b) => {
        let aValue, bValue;

        switch (sortBy) {
            case "dueDate":
                aValue = a.dueDate ? new Date(a.dueDate) : null;
                bValue = b.dueDate ? new Date(b.dueDate) : null;
                break;
            case "priority":
                const priorityOrder = { High: 3, Medium: 2, Low: 1, None: 0 };
                aValue = priorityOrder[a.priority];
                bValue = priorityOrder[b.priority];
                break;
            case "category":
                aValue = a.category ? a.category.toLowerCase() : "";
                bValue = b.category ? b.category.toLowerCase() : "";
                break;
            case "dateTime":
            default:
                aValue = new Date(a.dateTime);
                bValue = new Date(b.dateTime);
                break;
        }

        if (aValue === null && bValue === null) {
            return 0;
        }
        if (aValue === null) {
            return sortOrder === "asc" ? 1 : -1;
        }
        if (bValue === null) {
            return sortOrder === "asc" ? -1 : 1;
        }
        if (aValue < bValue) {
            return sortOrder === "asc" ? -1 : 1;
        }
        if (aValue > bValue) {
            return sortOrder === "asc" ? 1 : -1;
        }
        return 0;
    });

    return sortedTasks;
}

// Function to save task notes
function saveTaskNotes(index, notes) {
    if (showArchive) {
        archivedTasks[index].notes = notes;
    } else {
        tasks[index].notes = notes;
    }

    if (isLocalStorageAvailable) {
        saveTasks();
        saveArchivedTasks();
    }
}

// *** Drag and Drop Functions ***
function handleDragStart(event) {
    const taskItem = event.target;
    event.dataTransfer.setData('text', taskItem.id); // Set data for dragging
    taskItem.classList.add('dragging');
}

function handleDragOver(event) {
    event.preventDefault(); // Necessary to allow drop

    const afterElement = getDragAfterElement(event.clientY);
    const draggable = document.querySelector('.dragging');

    if (afterElement == null) {
        taskList.appendChild(draggable);
    } else {
        taskList.insertBefore(draggable, afterElement);
    }
}

function handleDrop(event) {
    event.preventDefault();
    const id = event.dataTransfer.getData('text');
    const draggableElement = document.getElementById(id);
    draggableElement.classList.remove('dragging');
    // Find the new position of the task and update the tasks array
    const taskIndex = Array.from(taskList.children).indexOf(draggableElement);
    const task = tasks.splice(parseInt(draggableElement.id.split('-')[1]), 1)[0];
    tasks.splice(taskIndex, 0, task);
    saveTasks();
    renderTasks();
}

function handleDragLeave(event) {
    const taskItem = event.target;
    taskItem.classList.remove('over'); // Remove the 'over' class when dragging out
}

function getDragAfterElement(y) {
    const draggableElements = [...taskList.querySelectorAll('li:not(.dragging)')];

    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;

        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

// Function to handle subtask completion
function handleSubtaskCompletion(taskIndex, subtaskIndex, isChecked) {
    let task;
    if (showArchive) {
        task = archivedTasks[taskIndex];
    } else {
        task = tasks[taskIndex];
    }
    if (task && task.subtasks && task.subtasks.length > subtaskIndex) {
        task.subtasks[subtaskIndex].completed = isChecked;

        // Update task completion status based on subtasks
        task.completed = task.subtasks.every(subtask => subtask.completed);

        if (isLocalStorageAvailable) {
            saveTasks();
            saveArchivedTasks();
        }

        renderTasks();
    }
}