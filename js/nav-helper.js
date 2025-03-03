// This file ensures proper navigation between tabs

document.addEventListener('DOMContentLoaded', () => {
    // Wait for all scripts to load
    setTimeout(() => {
        // If nothing else has triggered a page load, show dashboard
        if (!window.pageInitialized) {
            // Click on the dashboard tab to ensure proper initialization
            const dashboardTab = document.querySelector('nav ul li[data-page="dashboard"]');
            if (dashboardTab) {
                dashboardTab.click();
                window.pageInitialized = true;
            }
        }
    }, 200);
    
    // Add click listeners to each navigation item
    document.querySelectorAll('nav ul li').forEach(navItem => {
        navItem.addEventListener('click', () => {
            window.pageInitialized = true;
        });
    });
});
