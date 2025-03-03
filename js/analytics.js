// Analytics and charts functionality

// Update all analytics charts
function updateAnalytics() {
    // Get the selected timeframe
    const timeframe = document.getElementById('timeframe').value;
    
    // Use the timeframe to filter data
    const filteredData = filterDataByTimeframe(timeframe);
    
    updateMpgChart(filteredData.fuelEntries);
    updateExpensesBreakdownChart(filteredData);
    updateMonthlyComparisonChart(filteredData);
    updateMaintenanceCategoryChart(filteredData.maintenanceEntries);
}

// Filter data based on selected timeframe
function filterDataByTimeframe(timeframe) {
    const now = new Date();
    let startDate;
    
    switch (timeframe) {
        case '3months':
            startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
            break;
        case '6months':
            startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1);
            break;
        case '1year':
            startDate = new Date(now.getFullYear() - 1, now.getMonth(), 1);
            break;
        case 'all':
        default:
            // Return all data
            return {
                fuelEntries: appData.fuelEntries,
                maintenanceEntries: appData.maintenanceEntries
            };
    }
    
    // Filter entries by date
    const filteredFuelEntries = appData.fuelEntries.filter(entry => 
        new Date(entry.date) >= startDate
    );
    
    const filteredMaintenanceEntries = appData.maintenanceEntries.filter(entry => 
        new Date(entry.date) >= startDate
    );
    
    return {
        fuelEntries: filteredFuelEntries,
        maintenanceEntries: filteredMaintenanceEntries
    };
}

// MPG over time chart
function updateMpgChart(fuelEntries) {
    const ctx = document.getElementById('mpgChart').getContext('2d');
    
    if (window.mpgChart instanceof Chart) {
        window.mpgChart.destroy();
    }
    
    // Sort entries by date (oldest first)
    const sortedEntries = [...fuelEntries].sort((a, b) => 
        new Date(a.date) - new Date(b.date)
    );
    
    // Calculate MPG for each entry
    const mpgData = [];
    for (let i = 1; i < sortedEntries.length; i++) {
        const current = sortedEntries[i];
        const previous = sortedEntries[i-1];
        
        const milesDriven = current.odometer - previous.odometer;
        if (milesDriven > 0 && current.gallons > 0) {
            mpgData.push({
                date: current.date,
                mpg: milesDriven / current.gallons
            });
        }
    }
    
    window.mpgChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: mpgData.map(item => formatDate(item.date)),
            datasets: [{
                label: 'MPG',
                data: mpgData.map(item => item.mpg.toFixed(1)),
                borderColor: 'rgba(46, 204, 113, 1)',
                backgroundColor: 'rgba(46, 204, 113, 0.2)',
                borderWidth: 2,
                fill: true,
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true, // Changed to true to prevent infinite vertical scaling
            aspectRatio: 2,
            layout: {
                padding: {
                    top: 10,
                    right: 20,
                    bottom: 10,
                    left: 10
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    title: {
                        display: true,
                        text: 'Miles per Gallon'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Fill-up Date'
                    }
                }
            }
        }
    });
}

// Expenses breakdown chart (pie chart)
function updateExpensesBreakdownChart(data) {
    const ctx = document.getElementById('expensesBreakdownChart').getContext('2d');
    
    if (window.expensesBreakdownChart instanceof Chart) {
        window.expensesBreakdownChart.destroy();
    }
    
    // Calculate total costs
    const totalFuelCost = data.fuelEntries.reduce((sum, entry) => sum + entry.total, 0);
    const totalMaintenanceCost = data.maintenanceEntries.reduce((sum, entry) => sum + entry.cost, 0);
    
    window.expensesBreakdownChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Fuel', 'Maintenance'],
            datasets: [{
                data: [totalFuelCost, totalMaintenanceCost],
                backgroundColor: [
                    'rgba(52, 152, 219, 0.7)',
                    'rgba(231, 76, 60, 0.7)'
                ],
                borderColor: [
                    'rgba(52, 152, 219, 1)',
                    'rgba(231, 76, 60, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 1,
            layout: {
                padding: 20
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = Math.round((value / total) * 100);
                            return `${label}: ${formatCurrency(value)} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

// Monthly cost comparison chart
function updateMonthlyComparisonChart(data) {
    const ctx = document.getElementById('monthlyComparisonChart').getContext('2d');
    
    if (window.monthlyComparisonChart instanceof Chart) {
        window.monthlyComparisonChart.destroy();
    }
    
    // Group expenses by month
    const months = {};
    
    // Process fuel entries
    data.fuelEntries.forEach(entry => {
        const date = new Date(entry.date);
        const monthYear = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
        
        if (!months[monthYear]) {
            months[monthYear] = { fuel: 0, maintenance: 0 };
        }
        
        months[monthYear].fuel += entry.total;
    });
    
    // Process maintenance entries
    data.maintenanceEntries.forEach(entry => {
        const date = new Date(entry.date);
        const monthYear = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
        
        if (!months[monthYear]) {
            months[monthYear] = { fuel: 0, maintenance: 0 };
        }
        
        months[monthYear].maintenance += entry.cost;
    });
    
    // Convert to arrays for chart
    const labels = Object.keys(months).sort((a, b) => {
        const dateA = new Date(a);
        const dateB = new Date(b);
        return dateA - dateB;
    });
    
    const fuelData = labels.map(month => months[month].fuel);
    const maintenanceData = labels.map(month => months[month].maintenance);
    
    window.monthlyComparisonChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Fuel',
                    data: fuelData,
                    backgroundColor: 'rgba(52, 152, 219, 0.7)',
                    borderColor: 'rgba(52, 152, 219, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Maintenance',
                    data: maintenanceData,
                    backgroundColor: 'rgba(231, 76, 60, 0.7)',
                    borderColor: 'rgba(231, 76, 60, 1)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 2,
            layout: {
                padding: {
                    top: 10,
                    right: 20,
                    bottom: 10,
                    left: 10
                }
            },
            scales: {
                x: {
                    stacked: false
                },
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '$' + value;
                        }
                    },
                    title: {
                        display: true,
                        text: 'Cost ($)'
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ' + formatCurrency(context.raw);
                        }
                    }
                }
            }
        }
    });
}

// Maintenance category breakdown chart
function updateMaintenanceCategoryChart(maintenanceEntries) {
    const ctx = document.getElementById('maintenanceCategoryChart').getContext('2d');
    
    if (window.maintenanceCategoryChart instanceof Chart) {
        window.maintenanceCategoryChart.destroy();
    }
    
    // Group maintenance entries by category/service
    const categories = {};
    
    maintenanceEntries.forEach(entry => {
        const service = entry.service.toLowerCase();
        
        // Try to classify into common categories
        let category = 'Other';
        
        if (service.includes('oil') || service.includes('filter')) {
            category = 'Oil Change & Filters';
        } else if (service.includes('tire') || service.includes('wheel') || service.includes('rotation') || service.includes('alignment')) {
            category = 'Tires & Wheels';
        } else if (service.includes('brake')) {
            category = 'Brakes';
        } else if (service.includes('battery') || service.includes('electrical')) {
            category = 'Electrical';
        } else if (service.includes('transmission')) {
            category = 'Transmission';
        } else if (service.includes('inspection') || service.includes('check')) {
            category = 'Inspections';
        }
        
        if (!categories[category]) {
            categories[category] = 0;
        }
        
        categories[category] += entry.cost;
    });
    
    // Convert to arrays for chart
    const labels = Object.keys(categories);
    const data = labels.map(category => categories[category]);
    
    // Generate colors
    const backgroundColors = [
        'rgba(231, 76, 60, 0.7)',
        'rgba(241, 196, 15, 0.7)',
        'rgba(46, 204, 113, 0.7)',
        'rgba(52, 152, 219, 0.7)',
        'rgba(155, 89, 182, 0.7)',
        'rgba(230, 126, 34, 0.7)',
        'rgba(149, 165, 166, 0.7)'
    ];
    
    const borderColors = [
        'rgba(231, 76, 60, 1)',
        'rgba(241, 196, 15, 1)',
        'rgba(46, 204, 113, 1)',
        'rgba(52, 152, 219, 1)',
        'rgba(155, 89, 182, 1)',
        'rgba(230, 126, 34, 1)',
        'rgba(149, 165, 166, 1)'
    ];
    
    window.maintenanceCategoryChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: backgroundColors.slice(0, labels.length),
                borderColor: borderColors.slice(0, labels.length),
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 1,
            layout: {
                padding: 20
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = Math.round((value / total) * 100);
                            return `${label}: ${formatCurrency(value)} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

// Setup event listeners for analytics page
function setupAnalyticsListeners() {
    document.getElementById('timeframe').addEventListener('change', updateAnalytics);
}

// Initialize analytics page
document.addEventListener('DOMContentLoaded', () => {
    setupAnalyticsListeners();
});