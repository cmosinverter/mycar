// Chart.js theme configurations

// Chart.js theme settings
function updateChartTheme(darkMode = false) {
    Chart.defaults.color = darkMode ? '#a0a0a0' : '#666666';
    Chart.defaults.borderColor = darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
    
    // Common options for all charts to respect theme
    const themeOptions = {
        scales: {
            x: {
                grid: {
                    color: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                },
                ticks: {
                    color: darkMode ? '#a0a0a0' : '#666666'
                }
            },
            y: {
                grid: {
                    color: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                },
                ticks: {
                    color: darkMode ? '#a0a0a0' : '#666666'
                }
            }
        },
        plugins: {
            legend: {
                labels: {
                    color: darkMode ? '#eaeaea' : '#333333'
                }
            },
            tooltip: {
                backgroundColor: darkMode ? 'rgba(30, 30, 46, 0.8)' : 'rgba(255, 255, 255, 0.8)',
                titleColor: darkMode ? '#ffffff' : '#000000',
                bodyColor: darkMode ? '#eaeaea' : '#333333',
                borderColor: darkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
                borderWidth: 1
            }
        }
    };
    
    // Update all existing charts
    Object.values(Chart.instances).forEach(chart => {
        // Merge theme options with existing chart options
        chart.options.scales = { 
            ...chart.options.scales, 
            ...themeOptions.scales 
        };
        
        chart.options.plugins = { 
            ...chart.options.plugins, 
            ...themeOptions.plugins 
        };
        
        // Update chart
        chart.update();
    });
}

// Listen for theme changes
document.addEventListener('themeChanged', (event) => {
    updateChartTheme(event.detail.isDark);
});

// Initialize chart theme when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Check if we should apply dark theme for charts
    const isDarkTheme = document.documentElement.classList.contains('dark-theme');
    updateChartTheme(isDarkTheme);
});
