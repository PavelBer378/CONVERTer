let currencyChart = null;

// Инициализация графика
function initializeChart() {
    const ctx = document.getElementById('currency-chart').getContext('2d');
    
    currencyChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Курс валюты',
                data: [],
                borderColor: '#1a2980',
                backgroundColor: 'rgba(26, 41, 128, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                }
            },
            scales: {
                x: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Дата'
                    }
                },
                y: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Курс (к RUB)'
                    },
                    beginAtZero: false
                }
            }
        }
    });
}

// Обновление графика
function updateChart(historicalData, currency) {
    if (!currencyChart) return;
    
    const labels = historicalData.map(item => {
        const date = new Date(item.date);
        return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
    });
    
    const data = historicalData.map(item => item.rate);
    
    currencyChart.data.labels = labels;
    currencyChart.data.datasets[0].data = data;
    currencyChart.data.datasets[0].label = `Курс ${currency} к RUB`;
    
    // Обновление цвета в зависимости от тренда
    const firstRate = data[0];
    const lastRate = data[data.length - 1];
    
    if (lastRate > firstRate) {
        currencyChart.data.datasets[0].borderColor = '#2ecc71';
        currencyChart.data.datasets[0].backgroundColor = 'rgba(46, 204, 113, 0.1)';
    } else if (lastRate < firstRate) {
        currencyChart.data.datasets[0].borderColor = '#e74c3c';
        currencyChart.data.datasets[0].backgroundColor = 'rgba(231, 76, 60, 0.1)';
    } else {
        currencyChart.data.datasets[0].borderColor = '#1a2980';
        currencyChart.data.datasets[0].backgroundColor = 'rgba(26, 41, 128, 0.1)';
    }
    
    currencyChart.update();
}