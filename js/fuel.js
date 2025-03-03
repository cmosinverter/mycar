// Fuel logging functionality

// Display fuel entries in the table
function displayFuelEntries() {
    const fuelEntriesTable = document.getElementById('fuel-entries');
    fuelEntriesTable.innerHTML = '';
    
    // Update table headers and form labels based on current units
    updateUnitLabels();
    
    // Sort entries by date (newest first)
    const sortedEntries = [...appData.fuelEntries].sort((a, b) => 
        new Date(b.date) - new Date(a.date)
    );
    
    sortedEntries.forEach((entry, index) => {
        const row = document.createElement('tr');
        
        // Calculate efficiency if possible
        let efficiency = '-';
        if (index < sortedEntries.length - 1) {
            const previousEntry = sortedEntries[index + 1];
            const milesDriven = entry.odometer - previousEntry.odometer;
            if (milesDriven > 0) {
                const mpg = milesDriven / entry.gallons;
                efficiency = formatEfficiency(mpg);
            }
        }
        
        row.innerHTML = `
            <td>${formatDate(entry.date)}</td>
            <td>${formatDistance(entry.odometer)}</td>
            <td>${formatVolume(entry.gallons)}</td>
            <td>${formatPricePerUnit(entry.pricePerGallon)}</td>
            <td>${formatCurrency(entry.total)}</td>
            <td>${efficiency}</td>
            <td>
                <button class="action-btn edit-btn" data-id="${entry.id}"><i class="fas fa-edit"></i></button>
                <button class="action-btn delete-btn" data-id="${entry.id}"><i class="fas fa-trash"></i></button>
            </td>
        `;
        
        fuelEntriesTable.appendChild(row);
    });
    
    // Show a message if no entries
    if (sortedEntries.length === 0) {
        const row = document.createElement('tr');
        const cell = document.createElement('td');
        cell.colSpan = 7;
        cell.textContent = 'No fuel entries recorded yet.';
        cell.style.textAlign = 'center';
        row.appendChild(cell);
        fuelEntriesTable.appendChild(row);
    }
    
    // Add event listeners for buttons
    setupFuelEntryListeners();
}

// Update unit labels in forms and tables
function updateUnitLabels() {
    // Update form label
    const odometerLabel = document.querySelector('label[for="odometer"]');
    if (odometerLabel) {
        odometerLabel.textContent = `Odometer (${appData.settings.distanceUnit})`;
    }
    
    // Update table headers if they exist
    const headerRow = document.querySelector('#fuel th:nth-child(2)');
    if (headerRow) {
        headerRow.textContent = `Odometer (${appData.settings.distanceUnit})`;
    }
    
    // Update volume unit header (Gallons/Liters)
    const volumeHeader = document.querySelector('#fuel th:nth-child(3)');
    if (volumeHeader) {
        volumeHeader.textContent = appData.settings.volumeUnit === 'liters' ? 'Liters' : 'Gallons';
    }
    
    // Update price per unit header
    const priceHeader = document.querySelector('#fuel th:nth-child(4)');
    if (priceHeader) {
        priceHeader.textContent = appData.settings.volumeUnit === 'liters' ? 'Price/L' : 'Price/Gal';
    }
    
    // Update efficiency header
    const efficiencyHeader = document.querySelector('#fuel th:nth-child(6)');
    if (efficiencyHeader) {
        if (appData.settings.distanceUnit === 'kilometers' && appData.settings.volumeUnit === 'liters') {
            efficiencyHeader.textContent = 'km/L';
        } else if (appData.settings.distanceUnit === 'kilometers') {
            efficiencyHeader.textContent = 'km/gal';
        } else if (appData.settings.volumeUnit === 'liters') {
            efficiencyHeader.textContent = 'mi/L';
        } else {
            efficiencyHeader.textContent = 'MPG';
        }
    }
    
    // Update form input labels
    const gallonsLabel = document.querySelector('label[for="gallons"]');
    if (gallonsLabel) {
        gallonsLabel.textContent = appData.settings.volumeUnit === 'liters' ? 'Liters' : 'Gallons';
    }
    
    const priceLabel = document.querySelector('label[for="price-per-gallon"]');
    if (priceLabel) {
        const currencySymbol = appData.settings.currencySymbol || '$';
        if (appData.settings.volumeUnit === 'liters') {
            priceLabel.textContent = `Price per Liter (${currencySymbol})`;
        } else {
            priceLabel.textContent = `Price per Gallon (${currencySymbol})`;
        }
    }
}

// Add a new fuel entry
function addFuelEntry(e) {
    e.preventDefault();
    
    const date = document.getElementById('fuel-date').value;
    let odometer = parseFloat(document.getElementById('odometer').value);
    let volume = parseFloat(document.getElementById('gallons').value);
    let pricePerUnit = parseFloat(document.getElementById('price-per-gallon').value);
    
    // Convert units if needed
    if (appData.settings.distanceUnit === 'kilometers') {
        odometer = kmToMiles(odometer); // Store in miles internally
    }
    
    if (appData.settings.volumeUnit === 'liters') {
        // Convert liters to gallons for storage
        volume = litersToGallons(volume);
        // Convert price per liter to price per gallon
        pricePerUnit = pricePerUnit * 3.78541;
    }
    
    const newEntry = {
        id: Date.now(),
        date,
        odometer,
        gallons: volume, // Always stored as gallons internally
        pricePerGallon: pricePerUnit, // Always stored as price per gallon internally
        total: volume * pricePerUnit
    };
    
    // Add to array
    appData.fuelEntries.push(newEntry);
    
    // Save to localStorage
    saveData();
    
    // Update UI
    document.getElementById('fuel-form').reset();
    document.getElementById('fuel-modal').style.display = 'none';
    displayFuelEntries();
    
    // Update dashboard if it's visible
    if (appData.currentPage === 'dashboard') {
        updateDashboard();
    }
    
    showNotification('Fuel entry added successfully');
}

// Setup fuel entry event listeners
function setupFuelEntryListeners() {
    document.querySelectorAll('#fuel-entries .edit-btn').forEach(btn => {
        btn.addEventListener('click', editFuelEntry);
    });
    
    document.querySelectorAll('#fuel-entries .delete-btn').forEach(btn => {
        btn.addEventListener('click', deleteFuelEntry);
    });
}

// Edit a fuel entry
function editFuelEntry(e) {
    const entryId = parseInt(e.currentTarget.getAttribute('data-id'));
    const entry = appData.fuelEntries.find(entry => entry.id === entryId);
    
    if (!entry) return;
    
    // Pre-fill the form
    document.getElementById('fuel-date').value = entry.date;
    
    // Convert odometer reading for display if needed
    let displayOdometer = entry.odometer;
    if (appData.settings.distanceUnit === 'kilometers') {
        displayOdometer = milesToKm(entry.odometer);
    }
    
    // Convert volume for display if needed
    let displayVolume = entry.gallons;
    if (appData.settings.volumeUnit === 'liters') {
        displayVolume = gallonsToLiters(entry.gallons);
    }
    
    // Convert price per unit for display if needed
    let displayPrice = entry.pricePerGallon;
    if (appData.settings.volumeUnit === 'liters') {
        displayPrice = entry.pricePerGallon / 3.78541;
    }
    
    document.getElementById('odometer').value = displayOdometer;
    document.getElementById('gallons').value = displayVolume;
    document.getElementById('price-per-gallon').value = displayPrice;
    
    // Show the modal
    document.getElementById('fuel-modal').style.display = 'block';
    
    // Update form submission handler
    const form = document.getElementById('fuel-form');
    const newForm = form.cloneNode(true);
    form.parentNode.replaceChild(newForm, form);
    
    newForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Update entry values
        entry.date = document.getElementById('fuel-date').value;
        
        let newOdometer = parseFloat(document.getElementById('odometer').value);
        let newVolume = parseFloat(document.getElementById('gallons').value);
        let newPricePerUnit = parseFloat(document.getElementById('price-per-gallon').value);
        
        // Convert units if needed
        if (appData.settings.distanceUnit === 'kilometers') {
            newOdometer = kmToMiles(newOdometer);
        }
        
        if (appData.settings.volumeUnit === 'liters') {
            // Convert liters to gallons
            newVolume = litersToGallons(newVolume);
            // Convert price per liter to price per gallon
            newPricePerUnit = newPricePerUnit * 3.78541;
        }
        
        entry.odometer = newOdometer;
        entry.gallons = newVolume;
        entry.pricePerGallon = newPricePerUnit;
        entry.total = entry.gallons * entry.pricePerGallon;
        
        // Save and update UI
        saveData();
        newForm.reset();
        document.getElementById('fuel-modal').style.display = 'none';
        displayFuelEntries();
        
        if (appData.currentPage === 'dashboard') {
            updateDashboard();
        }
        
        showNotification('Fuel entry updated successfully');
        setupFuelFormHandler();
    });
}

// Delete a fuel entry
function deleteFuelEntry(e) {
    const entryId = parseInt(e.currentTarget.getAttribute('data-id'));
    
    // Create and show confirmation dialog
    if (confirm('Are you sure you want to delete this fuel entry?')) {
        const index = appData.fuelEntries.findIndex(entry => entry.id === entryId);
        
        if (index !== -1) {
            appData.fuelEntries.splice(index, 1);
            saveData();
            displayFuelEntries();
            
            if (appData.currentPage === 'dashboard') {
                updateDashboard();
            }
            
            showNotification('Fuel entry deleted successfully');
        }
    }
}

// Set up event handlers for fuel page
function setupFuelFormHandler() {
    const addButton = document.getElementById('add-fuel-btn');
    
    if (!addButton) return;
    
    const form = document.getElementById('fuel-form');
    if (!form) return;
    
    // Remove previous event listeners to prevent duplicates
    const newAddButton = addButton.cloneNode(true);
    addButton.parentNode.replaceChild(newAddButton, addButton);
    
    const newForm = form.cloneNode(true);
    form.parentNode.replaceChild(newForm, form);
    
    // Add fuel entry button
    newAddButton.addEventListener('click', () => {
        newForm.reset();
        document.getElementById('fuel-date').valueAsDate = new Date();
        document.getElementById('fuel-modal').style.display = 'block';
        updateUnitLabels();
    });
    
    // Fuel form submission
    newForm.addEventListener('submit', addFuelEntry);
}

// Initialize fuel page
document.addEventListener('DOMContentLoaded', () => {
    setupFuelFormHandler();
    // Wait for DOM to be fully loaded
    setTimeout(updateUnitLabels, 100);
});

// Check if a specific element is in view before updating
function isPageVisible(pageId) {
    const page = document.getElementById(pageId);
    return page && page.classList.contains('active');
}

// Update the formatVolume function used in the display
function formatVolume(gallons, precision = 3) {
    if (appData.settings.volumeUnit === 'liters') {
        return `${gallonsToLiters(gallons).toFixed(precision)} L`;
    }
    return `${gallons.toFixed(precision)} gal`;
}
