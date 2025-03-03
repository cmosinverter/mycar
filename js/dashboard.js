// Dashboard functionality

// Update dashboard content
function updateDashboard() {
    updateExpenseStats();
    updateRecentExpenses();
    updateExpensesChart();
}

// Update the expense statistics cards
function updateExpenseStats() {
    try {
        const expenses = getCurrentMonthExpenses();
        const avgMpg = calculateAvgMPG(appData.fuelEntries);
        
        document.querySelector('.total-fuel-cost').textContent = formatCurrency(expenses.fuelCost);
        document.querySelector('.total-maintenance-cost').textContent = formatCurrency(expenses.maintenanceCost);
        
        // Update efficiency display with appropriate unit
        const efficiencyDisplay = document.querySelector('.avg-mpg');
        if (efficiencyDisplay) {
            efficiencyDisplay.textContent = formatEfficiency(avgMpg);
        }
    } catch (error) {
        console.error("Error updating expense stats:", error);
    }
}

// Update the recent expenses table
function updateRecentExpenses() {
    const recentExpensesTable = document.getElementById('recent-expenses-table');
    recentExpensesTable.innerHTML = '';
    
    // Combine and sort all expenses by date (newest first)
    const allExpenses = [];
    
    // Add fuel entries
    appData.fuelEntries.forEach(entry => {
        // Format description with appropriate units
        let description;
        if (appData.settings.volumeUnit === 'liters') {
            const liters = gallonsToLiters(entry.gallons);
            const pricePerLiter = entry.pricePerGallon / 3.78541;
            description = `${liters.toFixed(3)} L @ $${pricePerLiter.toFixed(3)}/L`;
        } else {
            description = `${entry.gallons.toFixed(3)} gal @ $${entry.pricePerGallon.toFixed(3)}/gal`;
        }
        
        allExpenses.push({
            date: entry.date,
            type: 'Fuel',
            description: description,
            amount: entry.total
        });
    });
    
    // Add maintenance entries
    appData.maintenanceEntries.forEach(entry => {
        allExpenses.push({
            date: entry.date,
            type: 'Maintenance',
            description: entry.service,
            amount: entry.cost
        });
    });
    
    // Sort by date (newest first)
    allExpenses.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Display the 10 most recent expenses
    const recentExpenses = allExpenses.slice(0, 10);
    
    recentExpenses.forEach(expense => {
        const row = document.createElement('tr');
        
        const dateCell = document.createElement('td');
        dateCell.textContent = formatDate(expense.date);
        
        const typeCell = document.createElement('td');
        typeCell.textContent = expense.type;
        
        const descriptionCell = document.createElement('td');
        descriptionCell.textContent = expense.description;
        
        const amountCell = document.createElement('td');
        amountCell.textContent = formatCurrency(expense.amount);
        
        row.appendChild(dateCell);
        row.appendChild(typeCell);
        row.appendChild(descriptionCell);
        row.appendChild(amountCell);
        
        recentExpensesTable.appendChild(row);
    });
    
    // Show a message if no expenses
    if (recentExpenses.length === 0) {
        const row = document.createElement('tr');
        const cell = document.createElement('td');
        cell.colSpan = 4;
        cell.textContent = 'No expenses recorded yet.';
        cell.style.textAlign = 'center';
        row.appendChild(cell);
        recentExpensesTable.appendChild(row);
    }
}

// Update the expenses chart
function updateExpensesChart() {
    const ctx = document.getElementById('expensesChart').getContext('2d');
    const monthlyData = getExpensesByMonth();
    
    // If a chart already exists, destroy it before creating a new one
    if (window.expensesChart instanceof Chart) {
        window.expensesChart.destroy();
    }
    
    window.expensesChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: monthlyData.map(item => item.name),
            datasets: [
                {
                    label: 'Fuel',
                    data: monthlyData.map(item => item.fuel),
                    backgroundColor: 'rgba(52, 152, 219, 0.7)',
                    borderColor: 'rgba(52, 152, 219, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Maintenance',
                    data: monthlyData.map(item => item.maintenance),
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

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
    updateDashboard();
});
