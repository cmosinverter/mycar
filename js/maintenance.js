// Maintenance logging functionality

// Display maintenance entries in the table
function displayMaintenanceEntries() {
    const maintenanceEntriesTable = document.getElementById('maintenance-entries');
    if (!maintenanceEntriesTable) return;  // Safety check
    
    maintenanceEntriesTable.innerHTML = '';
    
    // Update table header unit
    updateMaintenanceUnitLabels();
    
    // Sort entries by date (newest first)
    const sortedEntries = [...appData.maintenanceEntries].sort((a, b) => 
        new Date(b.date) - new Date(a.date)
    );
    
    sortedEntries.forEach(entry => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${formatDate(entry.date)}</td>
            <td>${formatDistance(entry.odometer)}</td>
            <td>${entry.service}</td>
            <td>${formatCurrency(entry.cost)}</td>
            <td>${entry.notes || '-'}</td>
            <td>
                <button class="action-btn edit-btn" data-id="${entry.id}"><i class="fas fa-edit"></i></button>
                <button class="action-btn delete-btn" data-id="${entry.id}"><i class="fas fa-trash"></i></button>
            </td>
        `;
        
        maintenanceEntriesTable.appendChild(row);
    });
    
    // Show a message if no entries
    if (sortedEntries.length === 0) {
        const row = document.createElement('tr');
        const cell = document.createElement('td');
        cell.colSpan = 6;
        cell.textContent = 'No maintenance entries recorded yet.';
        cell.style.textAlign = 'center';
        row.appendChild(cell);
        maintenanceEntriesTable.appendChild(row);
    }
    
    // Add event listeners for buttons
    setupMaintenanceEntryListeners();
}

// Update unit labels for maintenance
function updateMaintenanceUnitLabels() {
    // Update form label
    const odometerLabel = document.querySelector('label[for="maintenance-odometer"]');
    if (odometerLabel) {
        odometerLabel.textContent = `Odometer (${appData.settings.distanceUnit})`;
    }
    
    // Update table header
    const headerRow = document.querySelector('#maintenance th:nth-child(2)');
    if (headerRow) {
        headerRow.textContent = `Odometer (${appData.settings.distanceUnit})`;
    }
}

// Add a new maintenance entry
function addMaintenanceEntry(e) {
    e.preventDefault();
    
    const date = document.getElementById('maintenance-date').value;
    let odometer = parseFloat(document.getElementById('maintenance-odometer').value);
    const service = document.getElementById('service').value;
    const cost = parseFloat(document.getElementById('cost').value);
    const notes = document.getElementById('notes').value;
    
    // Convert odometer reading if needed
    if (appData.settings.distanceUnit === 'kilometers') {
        odometer = kmToMiles(odometer); // Store everything in miles internally
    }
    
    const newEntry = {
        id: Date.now(), // Use timestamp as ID
        date,
        odometer,
        service,
        cost,
        notes
    };
    
    // Add to array
    appData.maintenanceEntries.push(newEntry);
    
    // Save to localStorage
    saveData();
    
    // Update UI
    document.getElementById('maintenance-form').reset();
    document.getElementById('maintenance-modal').style.display = 'none';
    displayMaintenanceEntries();
    
    // Update dashboard if it's visible
    if (appData.currentPage === 'dashboard') {
        updateDashboard();
    }
    
    showNotification('Maintenance entry added successfully');
}

// Setup maintenance entry event listeners
function setupMaintenanceEntryListeners() {
    document.querySelectorAll('#maintenance-entries .edit-btn').forEach(btn => {
        btn.addEventListener('click', editMaintenanceEntry);
    });
    
    document.querySelectorAll('#maintenance-entries .delete-btn').forEach(btn => {
        btn.addEventListener('click', deleteMaintenanceEntry);
    });
}

// Edit a maintenance entry
function editMaintenanceEntry(e) {
    const entryId = parseInt(e.currentTarget.getAttribute('data-id'));
    const entry = appData.maintenanceEntries.find(entry => entry.id === entryId);
    
    if (!entry) return;
    
    // Pre-fill the form
    document.getElementById('maintenance-date').value = entry.date;
    
    // Convert odometer reading for display if needed
    let displayOdometer = entry.odometer;
    if (appData.settings.distanceUnit === 'kilometers') {
        displayOdometer = milesToKm(entry.odometer);
    }
    
    document.getElementById('maintenance-odometer').value = displayOdometer;
    document.getElementById('service').value = entry.service;
    document.getElementById('cost').value = entry.cost;
    document.getElementById('notes').value = entry.notes || '';
    
    // Show the modal
    document.getElementById('maintenance-modal').style.display = 'block';
    
    // Update form submission handler
    const form = document.getElementById('maintenance-form');
    const newForm = form.cloneNode(true);
    form.parentNode.replaceChild(newForm, form);
    
    newForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Update entry values
        entry.date = document.getElementById('maintenance-date').value;
        let newOdometer = parseFloat(document.getElementById('maintenance-odometer').value);
        
        // Convert odometer reading if needed
        if (appData.settings.distanceUnit === 'kilometers') {
            newOdometer = kmToMiles(newOdometer);
        }
        
        entry.odometer = newOdometer;
        entry.service = document.getElementById('service').value;
        entry.cost = parseFloat(document.getElementById('cost').value);
        entry.notes = document.getElementById('notes').value;
        
        // Save and update UI
        saveData();
        newForm.reset();
        document.getElementById('maintenance-modal').style.display = 'none';
        displayMaintenanceEntries();
        
        // Update dashboard if it's visible
        if (appData.currentPage === 'dashboard') {
            updateDashboard();
        }
        
        showNotification('Maintenance entry updated successfully');
        setupMaintenanceFormHandler();
    });
}

// Delete a maintenance entry
function deleteMaintenanceEntry(e) {
    const entryId = parseInt(e.currentTarget.getAttribute('data-id'));
    
    if (confirm('Are you sure you want to delete this maintenance entry?')) {
        const index = appData.maintenanceEntries.findIndex(entry => entry.id === entryId);
        
        if (index !== -1) {
            appData.maintenanceEntries.splice(index, 1);
            saveData();
            displayMaintenanceEntries();
            
            // Update dashboard if it's visible
            if (appData.currentPage === 'dashboard') {
                updateDashboard();
            }
            
            showNotification('Maintenance entry deleted successfully');
        }
    }
}

// Set up event handlers for maintenance page
function setupMaintenanceFormHandler() {
    const addButton = document.getElementById('add-maintenance-btn');
    
    if (!addButton) return;
    
    const form = document.getElementById('maintenance-form');
    if (!form) return;
    
    // Remove previous event listeners to prevent duplicates
    const newAddButton = addButton.cloneNode(true);
    addButton.parentNode.replaceChild(newAddButton, addButton);
    
    const newForm = form.cloneNode(true);
    form.parentNode.replaceChild(newForm, form);
    
    // Add maintenance entry button
    newAddButton.addEventListener('click', () => {
        newForm.reset();
        document.getElementById('maintenance-date').valueAsDate = new Date();
        document.getElementById('maintenance-modal').style.display = 'block';
        updateMaintenanceUnitLabels();
    });
    
    // Maintenance form submission
    newForm.addEventListener('submit', addMaintenanceEntry);
}

// Initialize maintenance page
document.addEventListener('DOMContentLoaded', () => {
    setupMaintenanceFormHandler();
    // Wait for DOM to be fully loaded
    setTimeout(updateMaintenanceUnitLabels, 100);
});
