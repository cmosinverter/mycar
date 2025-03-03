// Region-specific functionality and settings

// Define region settings
const regionSettings = {
    'us': {
        name: 'United States',
        currency: 'USD',
        currencySymbol: '$',
        distanceUnit: 'miles',
        volumeUnit: 'gallons',
        dateFormat: 'MM/DD/YYYY',
        locale: 'en-US'
    },
    'tw': {
        name: 'Taiwan',
        currency: 'TWD',
        currencySymbol: 'NT$',
        distanceUnit: 'kilometers',
        volumeUnit: 'liters',
        dateFormat: 'YYYY/MM/DD',
        locale: 'zh-TW'
    }
};

// Auto-detect region using browser language
function detectUserRegion() {
    const language = navigator.language || navigator.userLanguage;
    
    // Determine region based on language
    if (language.startsWith('zh-TW') || language === 'zh-Hant') {
        return 'tw';
    }
    
    // Default to US for all other languages
    return 'us';
}

// Apply region settings to the app
function applyRegionSettings(regionCode) {
    if (!regionSettings[regionCode]) {
        console.error('Invalid region code:', regionCode);
        regionCode = 'us'; // Default to US if invalid
    }
    
    const settings = regionSettings[regionCode];
    
    // Update app settings with region defaults
    appData.settings.distanceUnit = settings.distanceUnit;
    appData.settings.volumeUnit = settings.volumeUnit;
    appData.settings.currency = settings.currency;
    appData.settings.currencySymbol = settings.currencySymbol;
    appData.settings.dateFormat = settings.dateFormat;
    appData.settings.locale = settings.locale;
    appData.settings.regionCode = regionCode;
    
    // Save settings
    saveData();
    
    // Update UI with new settings
    updateUnitLabels();
    updateCurrencySymbols();
    updateSettingsForm(); // Update the settings form dropdowns
    
    // Update content if page is already loaded
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
    
    // Show a notification about region change that mentions unit changes
    setTimeout(() => {
        const unitMessage = settings.volumeUnit === 'liters' ? 
            'Units changed to kilometers and liters' : 
            'Units changed to miles and gallons';
        showNotification(`Region updated to ${settings.name}. ${unitMessage}`, 'info');
    }, 300);
}

// Update the settings form to match current settings
function updateSettingsForm() {
    const regionSelector = document.getElementById('region-selector');
    const distanceUnitSelect = document.getElementById('distance-unit');
    const volumeUnitSelect = document.getElementById('volume-unit');
    
    if (regionSelector) {
        regionSelector.value = appData.settings.regionCode || 'us';
    }
    
    if (distanceUnitSelect) {
        distanceUnitSelect.value = appData.settings.distanceUnit;
    }
    
    if (volumeUnitSelect) {
        volumeUnitSelect.value = appData.settings.volumeUnit;
    }
}

// Initialize region settings
function initializeRegionSettings() {
    // If region isn't set yet, auto-detect
    if (!appData.settings.regionCode) {
        const detectedRegion = detectUserRegion();
        applyRegionSettings(detectedRegion);
    } 
    // Otherwise update UI to match saved region
    else {
        updateSettingsForm();
    }
}

// Set up event listeners for region settings
document.addEventListener('DOMContentLoaded', () => {
    const regionSelector = document.getElementById('region-selector');
    if (regionSelector) {
        // Only apply region settings when outside of the settings modal
        // The settings modal itself handles these changes now
        const isInSettingsModal = (element) => {
            let parent = element.parentElement;
            while (parent) {
                if (parent.id === 'settings-modal') {
                    return true;
                }
                parent = parent.parentElement;
            }
            return false;
        };
        
        regionSelector.addEventListener('change', (e) => {
            // Only auto-apply if this is NOT inside the settings modal
            if (!isInSettingsModal(e.target)) {
                applyRegionSettings(e.target.value);
            }
        });
    }
    
    // Initialize region settings after a short delay to ensure DOM is ready
    setTimeout(initializeRegionSettings, 100);
});
