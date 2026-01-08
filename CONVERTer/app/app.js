document.addEventListener('DOMContentLoaded', function() {
    // Элементы DOM
    const amountInput = document.getElementById('amount');
    const fromCurrencySelect = document.getElementById('from-currency');
    const toCurrencySelect = document.getElementById('to-currency');
    const swapButton = document.getElementById('swap-currencies');
    const convertButton = document.getElementById('convert-btn');
    const conversionResult = document.getElementById('conversion-result');
    const exchangeRateElement = document.getElementById('exchange-rate');
    const saveButton = document.getElementById('save-btn');
    const saveStatus = document.getElementById('save-status');
    const ratesTable = document.getElementById('rates-table');
    const analyticCurrencySelect = document.getElementById('analytic-currency');
    const updateAnalyticsButton = document.getElementById('update-analytics');
    const loadHistoryButton = document.getElementById('load-history');
    const historyTable = document.getElementById('history-table');
    
    // Текущие курсы валют
    let exchangeRates = {};
    let conversionHistory = [];
    
    // Инициализация приложения
    async function initApp() {
        try {
            // Загрузка текущих курсов валют
            await loadExchangeRates();
            
            // Загрузка истории конвертаций
            await loadConversionHistory();
            
            // Инициализация графика
            initializeChart();
            
            // Обновление аналитики для выбранной валюты
            updateAnalytics();
        } catch (error) {
            console.error('Ошибка инициализации приложения:', error);
            showError('Не удалось загрузить данные. Пожалуйста, обновите страницу.');
        }
    }
    
    // Загрузка курсов валют
    async function loadExchangeRates() {
        try {
            showLoading(ratesTable, 'Загрузка курсов валют...');
            
            // Получение курсов валют из API
            const rates = await getExchangeRates();
            exchangeRates = rates;
            
            // Отображение таблицы курсов
            displayRatesTable(rates);
            
            // Обновление опций выбора валют
            updateCurrencyOptions();
        } catch (error) {
            console.error('Ошибка загрузки курсов валют:', error);
            showError(ratesTable, 'Не удалось загрузить курсы валют. Попробуйте позже.');
        }
    }
    
    // Отображение таблицы курсов
    function displayRatesTable(rates) {
        if (!rates || Object.keys(rates).length === 0) {
            ratesTable.innerHTML = '<div class="loading">Данные о курсах валют недоступны</div>';
            return;
        }
        
        const baseCurrency = 'RUB';
        const currencies = ['USD', 'EUR', 'GBP', 'JPY', 'CNY', 'CAD', 'AUD', 'CHF'];
        
        let html = `
            <div class="rate-row header">
                <div class="currency-code">Код</div>
                <div class="currency-name">Валюта</div>
                <div class="currency-rate">Курс к ${baseCurrency}</div>
            </div>
        `;
        
        currencies.forEach(currency => {
            if (rates[currency]) {
                const rate = rates[currency];
                const currencyNames = {
                    'USD': 'Доллар США',
                    'EUR': 'Евро',
                    'GBP': 'Фунт стерлингов',
                    'JPY': 'Японская йена',
                    'CNY': 'Китайский юань',
                    'CAD': 'Канадский доллар',
                    'AUD': 'Австралийский доллар',
                    'CHF': 'Швейцарский франк'
                };
                
                html += `
                    <div class="rate-row">
                        <div class="currency-code">${currency}</div>
                        <div class="currency-name">${currencyNames[currency] || currency}</div>
                        <div class="currency-rate">${rate.toFixed(4)}</div>
                    </div>
                `;
            }
        });
        
        ratesTable.innerHTML = html;
    }
    
    // Обновление опций выбора валют
    function updateCurrencyOptions() {
        // Здесь можно динамически обновлять опции на основе полученных данных
        // В данном случае используем статический набор валют
    }
    
    // Конвертация валют
    async function convertCurrency() {
        const amount = parseFloat(amountInput.value);
        const fromCurrency = fromCurrencySelect.value;
        const toCurrency = toCurrencySelect.value;
        
        if (isNaN(amount) || amount <= 0) {
            showError('Пожалуйста, введите корректную сумму для конвертации.');
            return;
        }
        
        try {
            // Получение актуальных курсов
            const rates = await getExchangeRates();
            exchangeRates = rates;
            
            // Расчет конвертации
            let result;
            
            if (fromCurrency === 'RUB') {
                // Конвертация из RUB в другую валюту
                result = amount * rates[toCurrency];
            } else if (toCurrency === 'RUB') {
                // Конвертация из другой валюты в RUB
                result = amount / rates[fromCurrency];
            } else {
                // Конвертация между двумя валютами через RUB
                const toRub = amount / rates[fromCurrency];
                result = toRub * rates[toCurrency];
            }
            
            // Отображение результата
            const formattedResult = result.toFixed(4);
            conversionResult.textContent = `${formattedResult} ${toCurrency}`;
            
            // Отображение курса
            let rateText = '';
            if (fromCurrency === 'RUB') {
                rateText = `1 ${toCurrency} = ${(1/rates[toCurrency]).toFixed(4)} RUB`;
            } else if (toCurrency === 'RUB') {
                rateText = `1 ${fromCurrency} = ${rates[fromCurrency].toFixed(4)} RUB`;
            } else {
                const crossRate = rates[fromCurrency] / rates[toCurrency];
                rateText = `1 ${fromCurrency} = ${crossRate.toFixed(4)} ${toCurrency}`;
            }
            
            exchangeRateElement.textContent = rateText;
            
            // Сохранение данных о конвертации для возможного сохранения
            conversionHistory.push({
                amount,
                fromCurrency,
                toCurrency,
                result,
                rate: rateText,
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            console.error('Ошибка конвертации:', error);
            showError('Не удалось выполнить конвертацию. Пожалуйста, попробуйте снова.');
        }
    }
    
    // Сохранение результата конвертации
    async function saveConversion() {
        if (conversionHistory.length === 0) {
            showSaveStatus('Нет данных для сохранения. Сначала выполните конвертацию.', 'error');
            return;
        }
        
        const lastConversion = conversionHistory[conversionHistory.length - 1];
        
        try {
            showSaveStatus('Сохранение...', 'neutral');
            
            // Отправка данных на сервер для сохранения в БД
            const saved = await saveConversionToDB(lastConversion);
            
            if (saved) {
                showSaveStatus('Результат успешно сохранен в базе данных!', 'success');
            } else {
                showSaveStatus('Не удалось сохранить результат.', 'error');
            }
        } catch (error) {
            console.error('Ошибка сохранения:', error);
            showSaveStatus('Ошибка при сохранении. Проверьте подключение к серверу.', 'error');
        }
    }
    
    // Загрузка истории конвертаций
    async function loadConversionHistory() {
        try {
            showLoading(historyTable, 'Загрузка истории конвертаций...');
            
            // Получение истории из БД
            const history = await getConversionHistory();
            
            // Отображение истории
            displayHistoryTable(history);
        } catch (error) {
            console.error('Ошибка загрузки истории:', error);
            showError(historyTable, 'Не удалось загрузить историю. Попробуйте позже.');
        }
    }
    
    // Отображение таблицы истории
    function displayHistoryTable(history) {
        if (!history || history.length === 0) {
            historyTable.innerHTML = '<p>История конвертаций пуста</p>';
            return;
        }
        
        let html = `
            <div class="history-row header">
                <div>Дата и время</div>
                <div>Из валюты</div>
                <div>В валюту</div>
                <div>Сумма</div>
                <div>Результат</div>
            </div>
        `;
        
        history.forEach(item => {
            const date = new Date(item.timestamp).toLocaleString('ru-RU');
            
            html += `
                <div class="history-row">
                    <div>${date}</div>
                    <div>${item.from_currency}</div>
                    <div>${item.to_currency}</div>
                    <div>${item.amount}</div>
                    <div>${item.result.toFixed(4)} ${item.to_currency}</div>
                </div>
            `;
        });
        
        historyTable.innerHTML = html;
    }
    
    // Обновление аналитики
    async function updateAnalytics() {
        const currency = analyticCurrencySelect.value;
        
        try {
            // Получение исторических данных для аналитики
            const historicalData = await getHistoricalRates(currency);
            
            // Обновление графика
            updateChart(historicalData, currency);
            
            // Расчет и отображение аналитики
            calculateAndDisplayAnalytics(historicalData, currency);
        } catch (error) {
            console.error('Ошибка обновления аналитики:', error);
            showError('Не удалось загрузить аналитику для выбранной валюты.');
        }
    }
    
    // Расчет и отображение аналитики
    function calculateAndDisplayAnalytics(data, currency) {
        if (!data || data.length === 0) return;
        
        const rates = data.map(item => item.rate);
        const dates = data.map(item => item.date);
        
        const currentRate = rates[rates.length - 1];
        const weeklyChange = ((rates[rates.length - 1] - rates[0]) / rates[0] * 100).toFixed(2);
        const maxRate = Math.max(...rates);
        const minRate = Math.min(...rates);
        const avgRate = (rates.reduce((sum, rate) => sum + rate, 0) / rates.length).toFixed(4);
        
        // Обновление элементов аналитики
        document.getElementById('current-rate').textContent = currentRate.toFixed(4);
        
        const weeklyChangeElement = document.getElementById('weekly-change');
        weeklyChangeElement.textContent = `${weeklyChange}%`;
        
        if (parseFloat(weeklyChange) > 0) {
            weeklyChangeElement.className = 'value positive';
        } else if (parseFloat(weeklyChange) < 0) {
            weeklyChangeElement.className = 'value negative';
        } else {
            weeklyChangeElement.className = 'value neutral';
        }
        
        document.getElementById('max-rate').textContent = maxRate.toFixed(4);
        document.getElementById('min-rate').textContent = minRate.toFixed(4);
        document.getElementById('avg-rate').textContent = avgRate;
    }
    
    // Вспомогательные функции
    function showError(message, element = null) {
        if (element) {
            element.innerHTML = `<div class="error">${message}</div>`;
        } else {
            alert(message);
        }
    }
    
    function showLoading(element, message) {
        element.innerHTML = `<div class="loading">${message}</div>`;
    }
    
    function showSaveStatus(message, type) {
        saveStatus.textContent = message;
        saveStatus.className = `save-status ${type}`;
        
        // Автоматическое скрытие сообщения через 5 секунд
        setTimeout(() => {
            saveStatus.textContent = '';
            saveStatus.className = 'save-status';
        }, 5000);
    }
    
    // Обработчики событий
    swapButton.addEventListener('click', function() {
        const fromValue = fromCurrencySelect.value;
        const toValue = toCurrencySelect.value;
        
        fromCurrencySelect.value = toValue;
        toCurrencySelect.value = fromValue;
        
        // Если есть результат конвертации, обновить его
        if (conversionResult.textContent !== '-') {
            convertCurrency();
        }
    });
    
    convertButton.addEventListener('click', convertCurrency);
    saveButton.addEventListener('click', saveConversion);
    updateAnalyticsButton.addEventListener('click', updateAnalytics);
    loadHistoryButton.addEventListener('click', loadConversionHistory);
    
    // Автоматическая конвертация при изменении суммы или валют
    amountInput.addEventListener('input', convertCurrency);
    fromCurrencySelect.addEventListener('change', convertCurrency);
    toCurrencySelect.addEventListener('change', convertCurrency);
    
    // Инициализация приложения
    initApp();
});