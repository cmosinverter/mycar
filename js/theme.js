// Theme management functionality

// Theme options
const THEMES = {
    LIGHT: 'light',
    DARK: 'dark',
    SYSTEM: 'system'
};

// Initialize theme settings in appData if not already present
function initThemeSettings() {
    if (!appData.settings.theme) {
        appData.settings.theme = THEMES.SYSTEM;
        saveData();
    }
}

// Apply the selected theme
function applyTheme(theme) {
    // Store the selected theme
    appData.settings.theme = theme;
    saveData();
    
    // Determine if we should apply dark mode
    let isDark = false;
    
    if (theme === THEMES.DARK) {
        isDark = true;
    } else if (theme === THEMES.SYSTEM) {
        // Check system preference
        isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    
    // Apply or remove dark mode class
    document.documentElement.classList.toggle('dark-theme', isDark);
    
    // Update the theme selector in settings if it exists
    const themeSelector = document.getElementById('theme-selector');
    if (themeSelector) {
        themeSelector.value = theme;
    }
    
    // Dispatch event so charts can update their colors
    document.dispatchEvent(new CustomEvent('themeChanged', { detail: { isDark } }));
}

// Listen for system theme changes
function setupSystemThemeListener() {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
        if (appData.settings.theme === THEMES.SYSTEM) {
            // Only react to system changes if the theme is set to "system"
            applyTheme(THEMES.SYSTEM);
        }
    });
}

// Setup the theme selector in settings
function setupThemeSelector() {
    // Inject the theme selection into settings form
    const settingsForm = document.getElementById('settings-form');
    if (settingsForm) {
        // Create theme selection element
        const themeGroup = document.createElement('div');
        themeGroup.className = 'form-group';
        themeGroup.innerHTML = `
            <label for="theme-selector">Theme</label>
            <select id="theme-selector" required>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="system">System Default</option>
            </select>
            <p class="help-text">Choose your preferred visual theme</p>
        `;
        
        // Insert it after the volume unit selection
        const volumeUnitGroup = settingsForm.querySelector('div.form-group:nth-child(3)');
        if (volumeUnitGroup) {
            volumeUnitGroup.after(themeGroup);
        } else {
            // Fallback: just append to the form
            settingsForm.appendChild(themeGroup);
        }
        
        // Set initial value
        const themeSelector = document.getElementById('theme-selector');
        if (themeSelector) {
            themeSelector.value = appData.settings.theme || THEMES.SYSTEM;
            
            // Add change listener
            themeSelector.addEventListener('change', () => {
                applyTheme(themeSelector.value);
            });
        }
    }
}

// Initialize theme functionality
document.addEventListener('DOMContentLoaded', () => {
    // Initialize theme settings
    initThemeSettings();
    
    // Setup system theme listener
    setupSystemThemeListener();
    
    // Setup theme selector in settings
    setupThemeSelector();
    
    // Apply the current theme
    applyTheme(appData.settings.theme);
});
