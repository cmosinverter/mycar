// Main application controller

// Data model
const appData = {
    fuelEntries: [],
    maintenanceEntries: [],
    reminders: [],
    currentPage: 'dashboard',
    settings: {
        distanceUnit: 'miles', // Default to miles
        volumeUnit: 'gallons',  // Default to gallons
        currency: 'USD',  // Default currency
        currencySymbol: '$', // Default currency symbol
        dateFormat: 'MM/DD/YYYY', // Default date format
        locale: 'en-US', // Default locale
        regionCode: null // Will be auto-detected
    }
};

// Unit conversion functions
function milesToKm(miles) {
    return miles * 1.60934;
}

function kmToMiles(km) {
    return km / 1.60934;
}

function gallonsToLiters(gallons) {
    return gallons * 3.78541;
}

function litersToGallons(liters) {
    return liters / 3.78541;
}

function mpgToKpl(mpg) {
    return mpg * 0.425144;
}

function kplToMpg(kpl) {
    return kpl / 0.425144;
}

// Format distance with current unit
function formatDistance(distance, precision = 1) {
    if (appData.settings.distanceUnit === 'kilometers') {
        return `${milesToKm(distance).toFixed(precision)} km`;
    }
    return `${distance.toFixed(precision)} mi`;
}

// Format volume with current unit
function formatVolume(gallons, precision = 3) {
    if (appData.settings.volumeUnit === 'liters') {
        return `${gallonsToLiters(gallons).toFixed(precision)} L`;
    }
    return `${gallons.toFixed(precision)} gal`;
}

// Format price per volume unit
function formatPricePerUnit(pricePerGallon, precision = 3) {
    if (appData.settings.volumeUnit === 'liters') {
        // Convert price per gallon to price per liter
        const pricePerLiter = pricePerGallon / 3.78541;
        return `${appData.settings.currencySymbol}${pricePerLiter.toFixed(precision)}/L`;
    }
    return `${appData.settings.currencySymbol}${pricePerGallon.toFixed(precision)}/gal`;
}

// Format efficiency with current unit
function formatEfficiency(mpg) {
    if (appData.settings.distanceUnit === 'kilometers' && appData.settings.volumeUnit === 'liters') {
        // Convert to km/L
        return `${(mpg * 0.425144).toFixed(1)} km/L`;
    } else if (appData.settings.distanceUnit === 'kilometers') {
        // Convert to km/gal
        return `${(mpg * 1.60934).toFixed(1)} km/gal`;
    } else if (appData.settings.volumeUnit === 'liters') {
        // Convert to mi/L
        return `${(mpg / 3.78541).toFixed(1)} mi/L`;
    }
    return `${mpg.toFixed(1)} MPG`;
}

// Load data from localStorage
function loadData() {
    const storedData = localStorage.getItem('myCarData');
    if (storedData) {
        const parsedData = JSON.parse(storedData);
        appData.fuelEntries = parsedData.fuelEntries || [];
        appData.maintenanceEntries = parsedData.maintenanceEntries || [];
        appData.reminders = parsedData.reminders || [];
        appData.settings = parsedData.settings || { 
            distanceUnit: 'miles',
            volumeUnit: 'gallons',
            currency: 'USD',
            currencySymbol: '$',
            dateFormat: 'MM/DD/YYYY',
            locale: 'en-US'
        };
    }
}

// Save data to localStorage
function saveData() {
    localStorage.setItem('myCarData', JSON.stringify(appData));
}

// Navigation handling
function setupNavigation() {
    const navItems = document.querySelectorAll('nav ul li');
    
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            // Update active class
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
            
            // Show the selected page
            const targetPage = item.getAttribute('data-page');
            document.querySelectorAll('.page').forEach(page => {
                page.classList.remove('active');
            });
            document.getElementById(targetPage).classList.add('active');
            appData.currentPage = targetPage;
            
            // Update the content when switching to the page
            if (targetPage === 'dashboard') {
                updateDashboard();
            } else if (targetPage === 'fuel') {
                displayFuelEntries();
            } else if (targetPage === 'maintenance') {
                displayMaintenanceEntries();
            } else if (targetPage === 'analytics') {
                updateAnalytics();
            } else if (targetPage === 'reminders') {
                displayReminders();
            }
        });
    });
}

// Modal handling
function setupModals() {
    const modals = document.querySelectorAll('.modal');
    const closeButtons = document.querySelectorAll('.close');
    
    // Close modal when clicking the X button
    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            modals.forEach(modal => {
                modal.style.display = 'none';
            });
        });
    });
    
    // Close modal when clicking outside the modal content
    window.addEventListener('click', (event) => {
        modals.forEach(modal => {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        });
    });
}

// Format currency with region-specific settings
function formatCurrency(amount) {
    try {
        const currencyCode = appData.settings.currency || 'USD';
        const locale = appData.settings.locale || 'en-US';
        
        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: currencyCode
        }).format(amount);
    } catch (error) {
        // Fallback to basic formatting if Intl isn't supported
        const symbol = appData.settings.currencySymbol || '$';
        return `${symbol}${amount.toFixed(2)}`;
    }
}

// Format date with region-specific settings
function formatDate(dateString) {
    try {
        const date = new Date(dateString);
        const locale = appData.settings.locale || 'en-US';
        
        // Different date format options based on region
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        
        return date.toLocaleDateString(locale, options);
    } catch (error) {
        // Fallback to ISO format if formatting fails
        return dateString;
    }
}

// Display a notification
function showNotification(message, type = 'success') {
    // Remove any existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(n => n.remove());
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Add notification to the DOM
    document.body.appendChild(notification);
    
    // Force layout recalculation
    notification.offsetHeight;
    
    // Animate it in
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Remove after 4 seconds (extended from 3)
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300); // Wait for fade-out animation
    }, 4000);
}

// General utility functions
function calculateAvgMPG(entries, count = 3) {
    if (entries.length === 0) return 0;

    const recentEntries = [...entries]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, count);
    
    if (recentEntries.length < 2) return 0;
    
    let totalMPG = 0;
    let validEntries = 0;
    
    for (let i = 0; i < recentEntries.length - 1; i++) {
        const current = recentEntries[i];
        const next = recentEntries[i + 1];
        
        const milesDriven = current.odometer - next.odometer;
        if (milesDriven > 0 && current.gallons > 0) {
            totalMPG += milesDriven / current.gallons;
            validEntries++;
        }
    }
    
    return validEntries > 0 ? totalMPG / validEntries : 0;
}

// Get expenses by month for the last 6 months
function getExpensesByMonth() {
    const months = [];
    const currentDate = new Date();
    
    // Create array of last 6 months
    for (let i = 5; i >= 0; i--) {
        const monthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        const monthName = monthDate.toLocaleString('default', { month: 'short' });
        months.push({
            name: monthName,
            fuel: 0,
            maintenance: 0
        });
    }
    
    // Calculate fuel expenses by month
    appData.fuelEntries.forEach(entry => {
        const entryDate = new Date(entry.date);
        const monthIndex = months.findIndex(month => {
            const monthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - months.findIndex(m => m.name === month.name), 1);
            return entryDate.getMonth() === monthDate.getMonth() && entryDate.getFullYear() === monthDate.getFullYear();
        });
        
        if (monthIndex !== -1) {
            months[monthIndex].fuel += entry.total;
        }
    });
    
    // Calculate maintenance expenses by month
    appData.maintenanceEntries.forEach(entry => {
        const entryDate = new Date(entry.date);
        const monthIndex = months.findIndex(month => {
            const monthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - months.findIndex(m => m.name === month.name), 1);
            return entryDate.getMonth() === monthDate.getMonth() && entryDate.getFullYear() === monthDate.getFullYear();
        });
        
        if (monthIndex !== -1) {
            months[monthIndex].maintenance += entry.cost;
        }
    });
    
    return months;
}

// Get current month's expenses
function getCurrentMonthExpenses() {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    let fuelCost = 0;
    let maintenanceCost = 0;
    
    // Sum fuel costs
    appData.fuelEntries.forEach(entry => {
        const entryDate = new Date(entry.date);
        if (entryDate.getMonth() === currentMonth && entryDate.getFullYear() === currentYear) {
            fuelCost += entry.total;
        }
    });
    
    // Sum maintenance costs
    appData.maintenanceEntries.forEach(entry => {
        const entryDate = new Date(entry.date);
        if (entryDate.getMonth() === currentMonth && entryDate.getFullYear() === currentYear) {
            maintenanceCost += entry.cost;
        }
    });
    
    return { fuelCost, maintenanceCost };
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

// Handle window resize to update charts
function handleWindowResize() {
    window.addEventListener('resize', () => {
        // Delay chart update to avoid performance issues
        if (appData.resizeTimeout) clearTimeout(appData.resizeTimeout);
        
        appData.resizeTimeout = setTimeout(() => {
            if (appData.currentPage === 'dashboard') {
                updateExpensesChart();
            } else if (appData.currentPage === 'analytics') {
                updateAnalytics();
            }
        }, 250);
    });
}

// Update currency symbols across the app
function updateCurrencySymbols() {
    const currencySymbol = appData.settings.currencySymbol || '$';
    
    // Update fuel modal price label
    const priceLabel = document.querySelector('label[for="price-per-gallon"]');
    if (priceLabel) {
        const unitName = appData.settings.volumeUnit === 'liters' ? 'Liter' : 'Gallon';
        priceLabel.textContent = `Price per ${unitName} (${currencySymbol})`;
    }
    
    // Update maintenance cost label
    const costLabel = document.querySelector('label[for="cost"]');
    if (costLabel) {
        costLabel.textContent = `Cost (${currencySymbol})`;
    }
}

// Setup settings handlers
function setupSettings() {
    const settingsBtn = document.getElementById('settings-btn');
    const settingsModal = document.getElementById('settings-modal');
    const settingsForm = document.getElementById('settings-form');
    const distanceUnitSelect = document.getElementById('distance-unit');
    const volumeUnitSelect = document.getElementById('volume-unit');
    const regionSelector = document.getElementById('region-selector');
    
    // Store original values when opening the modal
    let originalRegion, originalDistanceUnit, originalVolumeUnit;
    
    // Show settings modal
    settingsBtn.addEventListener('click', () => {
        // Update form to match current settings
        updateSettingsForm();
        
        // Store original values for comparison later
        originalRegion = appData.settings.regionCode;
        originalDistanceUnit = appData.settings.distanceUnit;
        originalVolumeUnit = appData.settings.volumeUnit;
        
        settingsModal.style.display = 'block';
    });
    
    // Region selector change - dynamically update units based on region selection
    if (regionSelector) {
        regionSelector.addEventListener('change', (e) => {
            const selectedRegion = e.target.value;
            const regionConfig = regionSettings[selectedRegion];
            
            if (regionConfig) {
                // Update unit selectors to match the region defaults
                distanceUnitSelect.value = regionConfig.distanceUnit;
                volumeUnitSelect.value = regionConfig.volumeUnit;
            }
        });
    }
    
    // Save settings
    settingsForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const newDistanceUnit = distanceUnitSelect.value;
        const newVolumeUnit = volumeUnitSelect.value;
        const newRegion = regionSelector ? regionSelector.value : appData.settings.regionCode;
        
        // Compare with original values that were stored when opening the modal
        const regionChanged = originalRegion !== newRegion;
        const distanceUnitChanged = originalDistanceUnit !== newDistanceUnit;
        const volumeUnitChanged = originalVolumeUnit !== newVolumeUnit;
        const settingsChanged = regionChanged || distanceUnitChanged || volumeUnitChanged;
        
        // Update settings
        appData.settings.distanceUnit = newDistanceUnit;
        appData.settings.volumeUnit = newVolumeUnit;
        appData.settings.regionCode = newRegion;
        
        // If region changed, update currency settings too
        if (regionChanged && regionSettings[newRegion]) {
            appData.settings.currency = regionSettings[newRegion].currency;
            appData.settings.currencySymbol = regionSettings[newRegion].currencySymbol;
            appData.settings.dateFormat = regionSettings[newRegion].dateFormat;
            appData.settings.locale = regionSettings[newRegion].locale;
        }
        
        // Save to localStorage
        saveData();
        
        // Close modal
        settingsModal.style.display = 'none';
        
        // Update UI if settings changed
        if (settingsChanged) {
            updateUnitLabels();
            updateCurrencySymbols();
            
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
            
            // Provide detailed feedback about what changed
            setTimeout(() => {
                let changeMessage = 'Settings updated: ';
                const changes = [];
                
                if (regionChanged) {
                    changes.push(`region to ${regionSettings[newRegion].name}`);
                }
                if (distanceUnitChanged) {
                    changes.push(`distance unit to ${newDistanceUnit}`);
                }
                if (volumeUnitChanged) {
                    changes.push(`volume unit to ${newVolumeUnit}`);
                }
                
                changeMessage += changes.join(', ');
                showNotification(changeMessage, 'success');
            }, 300);
        } else {
            setTimeout(() => {
                showNotification('No changes made to settings.', 'info');
            }, 300);
        }
    });
}

// Update all unit labels across the application
function updateUnitLabels() {
    if (appData.currentPage === 'dashboard') {
        // Update efficiency label in dashboard
        const efficiencyLabel = document.querySelector('.stat-card .efficiency + .stat-info h3');
        if (efficiencyLabel) {
            if (appData.settings.distanceUnit === 'kilometers' && appData.settings.volumeUnit === 'liters') {
                efficiencyLabel.textContent = 'Avg. km/L';
            } else if (appData.settings.distanceUnit === 'kilometers') {
                efficiencyLabel.textContent = 'Avg. km/gal';
            } else if (appData.settings.volumeUnit === 'liters') {
                efficiencyLabel.textContent = 'Avg. mi/L';
            } else {
                efficiencyLabel.textContent = 'Avg. MPG';
            }
        }
        
        // Update the efficiency value as well
        const avgMpg = calculateAvgMPG(appData.fuelEntries);
        const efficiencyDisplay = document.querySelector('.avg-mpg');
        if (efficiencyDisplay) {
            efficiencyDisplay.textContent = formatEfficiency(avgMpg);
        }
    } else if (appData.currentPage === 'fuel') {
        // Update fuel page labels
        const fuelPage = document.getElementById('fuel');
        if (fuelPage) {
            // Update odometer header
            const odometerHeader = fuelPage.querySelector('thead tr th:nth-child(2)');
            if (odometerHeader) {
                odometerHeader.textContent = `Odometer (${appData.settings.distanceUnit})`;
            }
            
            // Update gallons header
            const gallonsHeader = fuelPage.querySelector('thead tr th:nth-child(3)');
            if (gallonsHeader) {
                gallonsHeader.textContent = appData.settings.volumeUnit === 'liters' ? 'Liters' : 'Gallons';
            }
            
            // Update price per unit header
            const priceHeader = fuelPage.querySelector('thead tr th:nth-child(4)');
            if (priceHeader) {
                priceHeader.textContent = appData.settings.volumeUnit === 'liters' ? 'Price/L' : 'Price/Gal';
            }
            
            // Update efficiency header
            const efficiencyHeader = fuelPage.querySelector('thead tr th:nth-child(6)');
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
            
            // Update form labels
            const odometerLabel = document.querySelector('label[for="odometer"]');
            if (odometerLabel) {
                odometerLabel.textContent = `Odometer (${appData.settings.distanceUnit})`;
            }
            
            const gallonsLabel = document.querySelector('label[for="gallons"]');
            if (gallonsLabel) {
                gallonsLabel.textContent = appData.settings.volumeUnit === 'liters' ? 'Liters' : 'Gallons';
            }
            
            const priceLabel = document.querySelector('label[for="price-per-gallon"]');
            if (priceLabel) {
                priceLabel.textContent = appData.settings.volumeUnit === 'liters' ? 'Price per Liter' : 'Price per Gallon';
            }
        }
    } else if (appData.currentPage === 'maintenance') {
        // Update maintenance page labels
        const maintenancePage = document.getElementById('maintenance');
        if (maintenancePage) {
            const odometerHeader = maintenancePage.querySelector('th:nth-child(2)');
            if (odometerHeader) {
                odometerHeader.textContent = `Odometer (${appData.settings.distanceUnit})`;
            }
        }
    }
    
    // Update currency symbols in forms and tables
    updateCurrencySymbols();
}

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
    // Load data from localStorage
    loadData();
    
    // Set up navigation
    setupNavigation();
    
    // Set up modals
    setupModals();
    
    // Check reminders
    checkReminders();
    
    // Handle window resize
    handleWindowResize();
    
    // Setup settings
    setupSettings();
});