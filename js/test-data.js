// Optional test data generator to populate the app with sample data

function generateTestData() {
    // Check if we already have data
    if (appData.fuelEntries.length > 0 || appData.maintenanceEntries.length > 0) {
        return; // Don't override existing data
    }

    // Generate some sample fuel entries
    const today = new Date();
    let lastOdometer = 30000; // Starting odometer value

    // Create fuel entries for the past 6 months
    for (let i = 0; i < 12; i++) {
        const entryDate = new Date(today);
        entryDate.setDate(entryDate.getDate() - (i * 15)); // Every 15 days
        
        // Randomize gallons between 10-15
        const gallons = 10 + Math.random() * 5;
        // Randomize price between $3-$4 per gallon
        const pricePerGallon = 3 + Math.random();
        // Randomize miles driven between 300-400
        const milesDriven = 300 + Math.random() * 100;

        const newOdometer = lastOdometer;
        lastOdometer -= milesDriven; // Go backwards in time

        appData.fuelEntries.push({
            id: Date.now() - i * 1000000, // Unique ID
            date: entryDate.toISOString().split('T')[0],
            odometer: newOdometer,
            gallons: parseFloat(gallons.toFixed(3)),
            pricePerGallon: parseFloat(pricePerGallon.toFixed(3)),
            total: parseFloat((gallons * pricePerGallon).toFixed(2))
        });
    }

    // Create maintenance entries
    const maintenanceItems = [
        { service: "Oil Change", cost: 45 },
        { service: "Tire Rotation", cost: 30 },
        { service: "Air Filter Replacement", cost: 25 },
        { service: "Brake Pad Replacement", cost: 150 },
        { service: "Spark Plug Replacement", cost: 80 }
    ];

    for (let i = 0; i < 5; i++) {
        const entryDate = new Date(today);
        entryDate.setDate(entryDate.getDate() - (i * 45)); // Every 45 days

        const item = maintenanceItems[i % maintenanceItems.length];
        const maintenanceOdometer = 30000 - (i * 1000);

        appData.maintenanceEntries.push({
            id: Date.now() - i * 1000000 - 500000, // Unique ID
            date: entryDate.toISOString().split('T')[0],
            odometer: maintenanceOdometer,
            service: item.service,
            cost: item.cost,
            notes: `Regular ${item.service.toLowerCase()} service`
        });
    }

    // Create reminders
    const reminderItems = [
        { service: "Oil Change", dueMileage: 33000 },
        { service: "Tire Rotation", dueMileage: 32000 },
        { service: "Brake Inspection", dueDate: new Date(today.getFullYear(), today.getMonth() + 2, today.getDate()).toISOString().split('T')[0] },
        { service: "State Inspection", dueDate: new Date(today.getFullYear(), today.getMonth() + 1, today.getDate()).toISOString().split('T')[0] }
    ];

    reminderItems.forEach((item, i) => {
        appData.reminders.push({
            id: Date.now() - i * 1000000 - 900000, // Unique ID
            service: item.service,
            dueDate: item.dueDate || null,
            dueMileage: item.dueMileage || null,
            notes: `Remember to ${item.service.toLowerCase()}`,
            completed: false
        });
    });

    // Save all the test data
    saveData();
    console.log("Test data generated successfully");
}

// Add a button to the app to generate test data (only during development)
function addTestDataButton() {
    const settingsForm = document.getElementById('settings-form');
    if (!settingsForm) return;
    
    const testDataButton = document.createElement('button');
    testDataButton.type = 'button';
    testDataButton.className = 'btn-primary';
    testDataButton.style.marginTop = '20px';
    testDataButton.textContent = 'Generate Test Data';
    
    testDataButton.addEventListener('click', () => {
        generateTestData();
        showNotification('Test data generated successfully');
        
        // Refresh current page
        if (appData.currentPage === 'dashboard') {
            updateDashboard();
        } else if (appData.currentPage === 'fuel') {
            displayFuelEntries();
        } else if (appData.currentPage === 'maintenance') {
            displayMaintenanceEntries();
        } else if (appData.currentPage === 'analytics') {
            updateAnalytics();
        } else if (appData.currentPage === 'reminders') {
            displayReminders();
        }
    });
    
    settingsForm.appendChild(testDataButton);
}

document.addEventListener('DOMContentLoaded', function() {
    // Add button after a short delay to ensure DOM is ready
    setTimeout(addTestDataButton, 500);
});
