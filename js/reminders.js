// Reminders functionality

// Display reminders in the table
function displayReminders() {
    const remindersTable = document.getElementById('reminders-entries');
    if (!remindersTable) return;
    
    remindersTable.innerHTML = '';
    
    // Sort reminders by status (due first) then by date
    const sortedReminders = [...appData.reminders].sort((a, b) => {
        // First sort by status (due comes first)
        if (getStatus(a) === 'Due' && getStatus(b) !== 'Due') return -1;
        if (getStatus(a) !== 'Due' && getStatus(b) === 'Due') return 1;
        
        // Then by date
        if (a.dueDate && b.dueDate) {
            return new Date(a.dueDate) - new Date(b.dueDate);
        } else if (a.dueDate) {
            return -1;
        } else if (b.dueDate) {
            return 1;
        }
        
        // Then by mileage
        return (a.dueMileage || 0) - (b.dueMileage || 0);
    });
    
    if (sortedReminders.length === 0) {
        // Show empty state with icon
        remindersTable.innerHTML = `
            <tr>
                <td colspan="4" class="empty-state">
                    <i class="fas fa-bell-slash"></i>
                    <p>No reminders set yet. Add a reminder to track upcoming maintenance tasks.</p>
                </td>
            </tr>
        `;
        return;
    }
    
    sortedReminders.forEach(reminder => {
        const row = document.createElement('tr');
        const status = getStatus(reminder);
        
        // Format due info with icons
        let dueInfo = '';
        if (reminder.dueDate && reminder.dueMileage) {
            dueInfo = `<i class="far fa-calendar-alt"></i> ${formatDate(reminder.dueDate)} <br>
                       <i class="fas fa-tachometer-alt"></i> ${formatDistance(reminder.dueMileage, 0)}`;
        } else if (reminder.dueDate) {
            dueInfo = `<i class="far fa-calendar-alt"></i> ${formatDate(reminder.dueDate)}`;
        } else if (reminder.dueMileage) {
            dueInfo = `<i class="fas fa-tachometer-alt"></i> ${formatDistance(reminder.dueMileage, 0)}`;
        }
        
        row.innerHTML = `
            <td>${reminder.service}</td>
            <td>${dueInfo}</td>
            <td><span class="status ${status.toLowerCase()}">${status}</span></td>
            <td>
                <button class="action-btn complete-btn" data-id="${reminder.id}" title="Mark as ${reminder.completed ? 'Incomplete' : 'Completed'}">
                    <i class="fas ${reminder.completed ? 'fa-undo' : 'fa-check'}"></i>
                </button>
                <button class="action-btn edit-btn" data-id="${reminder.id}" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn delete-btn" data-id="${reminder.id}" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        
        remindersTable.appendChild(row);
    });
    
    // Add event listeners for buttons
    document.querySelectorAll('#reminders-entries .edit-btn').forEach(btn => {
        btn.addEventListener('click', editReminder);
    });
    
    document.querySelectorAll('#reminders-entries .delete-btn').forEach(btn => {
        btn.addEventListener('click', deleteReminder);
    });
    
    document.querySelectorAll('#reminders-entries .complete-btn').forEach(btn => {
        btn.addEventListener('click', completeReminder);
    });
}

// Get the last odometer reading
function getLastOdometerReading() {
    if (appData.fuelEntries.length === 0 && appData.maintenanceEntries.length === 0) {
        return 0;
    }
    
    // Get the latest odometer reading from both fuel and maintenance entries
    const fuelOdometer = appData.fuelEntries.length > 0 ? 
        Math.max(...appData.fuelEntries.map(entry => entry.odometer)) : 0;
    
    const maintenanceOdometer = appData.maintenanceEntries.length > 0 ? 
        Math.max(...appData.maintenanceEntries.map(entry => entry.odometer)) : 0;
    
    return Math.max(fuelOdometer, maintenanceOdometer);
}

// Determine the status of a reminder
function getStatus(reminder) {
    const now = new Date();
    const lastOdometer = getLastOdometerReading();
    
    if (reminder.completed) {
        return 'Completed';
    }
    
    if (reminder.dueDate && new Date(reminder.dueDate) < now) {
        return 'Due';
    }
    
    if (reminder.dueMileage && lastOdometer >= reminder.dueMileage) {
        return 'Due';
    }
    
    if (reminder.dueDate && new Date(reminder.dueDate) < new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)) {
        return 'Upcoming';
    }
    
    if (reminder.dueMileage && lastOdometer >= reminder.dueMileage - 300) {
        return 'Upcoming';
    }
    
    return 'OK';
}

// Add a new reminder
function addReminder(e) {
    e.preventDefault();
    
    const service = document.getElementById('service-type').value;
    const reminderType = document.getElementById('reminder-type').value;
    const dueDate = reminderType !== 'mileage' ? document.getElementById('due-date').value : null;
    const dueMileage = reminderType !== 'date' ? parseInt(document.getElementById('due-mileage').value) : null;
    const notes = document.getElementById('reminder-notes').value;
    
    const newReminder = {
        id: Date.now(), // Use timestamp as ID
        service,
        dueDate,
        dueMileage,
        notes,
        completed: false
    };
    
    // Add to array
    appData.reminders.push(newReminder);
    
    // Save to localStorage
    saveData();
    
    // Update UI
    document.getElementById('reminder-form').reset();
    document.getElementById('reminder-modal').style.display = 'none';
    displayReminders();
    
    showNotification('Reminder added successfully');
}

// Edit a reminder
function editReminder(e) {
    const reminderId = parseInt(e.currentTarget.getAttribute('data-id'));
    const reminder = appData.reminders.find(reminder => reminder.id === reminderId);
    
    if (!reminder) return;
    
    // Store the original completion status
    const originalCompletionStatus = reminder.completed;
    
    // Pre-fill the form
    document.getElementById('service-type').value = reminder.service;
    
    // Set reminder type
    let reminderType = 'both';
    if (reminder.dueDate && !reminder.dueMileage) reminderType = 'date';
    if (!reminder.dueDate && reminder.dueMileage) reminderType = 'mileage';
    document.getElementById('reminder-type').value = reminderType;
    
    // Update form visibility based on reminder type
    updateReminderTypeForm();
    
    // Set values
    if (reminder.dueDate) document.getElementById('due-date').value = reminder.dueDate;
    if (reminder.dueMileage) document.getElementById('due-mileage').value = reminder.dueMileage;
    document.getElementById('reminder-notes').value = reminder.notes || '';
    
    // Show the modal
    document.getElementById('reminder-modal').style.display = 'block';
    
    // Update form submission handler to update entry instead of adding
    const form = document.getElementById('reminder-form');
    
    // Remove existing event listeners
    const newForm = form.cloneNode(true);
    form.parentNode.replaceChild(newForm, form);
    
    // Add event listener to reminder type dropdown
    newForm.querySelector('#reminder-type').addEventListener('change', updateReminderTypeForm);
    
    // Add new event listener for updating
    newForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Update reminder values
        const reminderType = document.getElementById('reminder-type').value;
        
        reminder.service = document.getElementById('service-type').value;
        reminder.dueDate = reminderType !== 'mileage' ? document.getElementById('due-date').value : null;
        reminder.dueMileage = reminderType !== 'date' ? parseInt(document.getElementById('due-mileage').value) : null;
        reminder.notes = document.getElementById('reminder-notes').value;
        
        // Preserve the original completion status instead of resetting it
        reminder.completed = originalCompletionStatus;
        
        // Save and update UI
        saveData();
        newForm.reset();
        document.getElementById('reminder-modal').style.display = 'none';
        displayReminders();
        
        showNotification('Reminder updated successfully');
        
        // Reset form handler to add new entries
        setupReminderFormHandler();
    });
}

// Mark a reminder as completed
function completeReminder(e) {
    const reminderId = parseInt(e.currentTarget.getAttribute('data-id'));
    const reminder = appData.reminders.find(reminder => reminder.id === reminderId);
    
    if (!reminder) return;
    
    // Toggle completed status
    reminder.completed = !reminder.completed;
    
    // Save and update UI
    saveData();
    displayReminders();
    
    // Updated notification with emoji
    if (reminder.completed) {
        showNotification('✅ Reminder marked as completed', 'success');
    } else {
        showNotification('🔄 Reminder marked as active again', 'info');
    }
}

// Delete a reminder
function deleteReminder(e) {
    const reminderId = parseInt(e.currentTarget.getAttribute('data-id'));
    
    if (confirm('Are you sure you want to delete this reminder?')) {
        // Find the index of the reminder
        const index = appData.reminders.findIndex(reminder => reminder.id === reminderId);
        
        if (index !== -1) {
            // Remove the reminder
            appData.reminders.splice(index, 1);
            
            // Save and update UI
            saveData();
            displayReminders();
            
            showNotification('Reminder deleted successfully');
        }
    }
}

// Update form visibility based on reminder type selection
function updateReminderTypeForm() {
    const reminderType = document.getElementById('reminder-type');
    if (!reminderType) return;
    
    const dateGroup = document.querySelector('.date-group');
    const mileageGroup = document.querySelector('.mileage-group');
    
    if (!dateGroup || !mileageGroup) return;
    
    if (reminderType.value === 'date') {
        dateGroup.style.display = 'block';
        mileageGroup.style.display = 'none';
        document.getElementById('due-date').required = true;
        document.getElementById('due-mileage').required = false;
    } else if (reminderType.value === 'mileage') {
        dateGroup.style.display = 'none';
        mileageGroup.style.display = 'block';
        document.getElementById('due-date').required = false;
        document.getElementById('due-mileage').required = true;
    } else {
        dateGroup.style.display = 'block';
        mileageGroup.style.display = 'block';
        document.getElementById('due-date').required = true;
        document.getElementById('due-mileage').required = true;
    }
}

// Set up event handlers for reminders page
function setupReminderFormHandler() {
    const addButton = document.getElementById('add-reminder-btn');
    if (!addButton) return;
    
    const form = document.getElementById('reminder-form');
    if (!form) return;
    
    // Remove previous event listeners to prevent duplicates
    const newAddButton = addButton.cloneNode(true);
    addButton.parentNode.replaceChild(newAddButton, addButton);
    
    const newForm = form.cloneNode(true);
    form.parentNode.replaceChild(newForm, form);
    
    // Add reminder button
    newAddButton.addEventListener('click', () => {
        newForm.reset();
        document.getElementById('reminder-modal').style.display = 'block';
        updateReminderTypeForm();
        
        // Set today's date as the default
        document.getElementById('due-date').valueAsDate = new Date();
        
        // Set default mileage to current + 3000 miles (common oil change interval)
        const lastOdometer = getLastOdometerReading();
        document.getElementById('due-mileage').value = lastOdometer + 3000;
    });
    
    // Reminder form submission
    newForm.addEventListener('submit', addReminder);
    
    // Reminder type change
    newForm.querySelector('#reminder-type').addEventListener('change', updateReminderTypeForm);
}

// Check for due reminders and display notifications
function checkReminders() {
    const now = new Date();
    const dueReminders = appData.reminders.filter(reminder => {
        // Skip completed reminders
        if (reminder.completed) return false;
        
        const lastOdometer = getLastOdometerReading();
        
        // Check for due date
        if (reminder.dueDate && new Date(reminder.dueDate) <= now) {
            return true;
        }
        
        // Check for due mileage
        if (reminder.dueMileage && lastOdometer >= reminder.dueMileage) {
            return true;
        }
        
        return false;
    });
    
    // Show notification for due reminders
    if (dueReminders.length > 0) {
        const reminderItems = dueReminders.map(r => r.service).join(', ');
        const message = `${dueReminders.length} maintenance ${dueReminders.length === 1 ? 'item is' : 'items are'} due: ${reminderItems}`;
        showNotification(message, 'warning');
    }
}

// Initialize reminders page
document.addEventListener('DOMContentLoaded', () => {
    setupReminderFormHandler();
    
    // Set today's date as the default
    document.getElementById('due-date').valueAsDate = new Date();
    
    // Set default mileage to current + 3000 miles (common oil change interval)
    const lastOdometer = getLastOdometerReading();
    document.getElementById('due-mileage').value = lastOdometer + 3000;
});
