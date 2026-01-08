const API_BASE_URL = 'http://localhost:3000/api';

// API ключ для ExchangeRate-API (в реальном приложении должен храниться на сервере)
// Для демо-версии используется бесплатный ключ с ограничениями
const API_KEY = '10f7b14d162ca01fec849eff'; // Замените на реальный API ключ

// Получение текущих курсов валют
async function getExchangeRates() {
    try {
        // Для демонстрации используем фиктивные данные, если API недоступно
        // В реальном приложении замените на реальный API вызов
        
        // Пример реального API вызова:
        const response = await fetch(`https://v6.exchangerate-api.com/v6/${API_KEY}/latest/RUB`);
         const data = await response.json();
         return data.conversion_rates;
        
        // Фиктивные данные для демонстрации
       //return {
           // USD: 0.011,
           // EUR: 0.010,
           // GBP: 0.0087,
          //  JPY: 1.63,
          //  CNY: 0.079,
          //  CAD: 0.015,
         //   AUD: 0.017,
//CHF: 0.0098};
    } catch (error) {
        console.error('Ошибка получения курсов валют:', error);
        throw error;
    }
}

// Получение исторических данных курса
async function getHistoricalRates(currency) {
    try {
        // Для демонстрации генерируем фиктивные исторические данные
        // В реальном приложении используйте реальный API
        
        const baseRate = {
            'USD': 0.011,
            'EUR': 0.010,
            'GBP': 0.0087,
            'JPY': 1.63,
            'CNY': 0.079
        }[currency] || 0.01;
        
        const days = 7;
        const data = [];
        const today = new Date();
        
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);
            
            // Генерация случайного колебания курса (±2%)
            const fluctuation = (Math.random() * 0.04) - 0.02;
            const rate = baseRate * (1 + fluctuation);
            
            data.push({
                date: date.toISOString().split('T')[0],
                rate: rate
            });
        }
        
        return data;
    } catch (error) {
        console.error('Ошибка получения исторических данных:', error);
        throw error;
    }
}

// Сохранение конвертации в базу данных
async function saveConversionToDB(conversionData) {
    try {
        const response = await fetch(`${API_BASE_URL}/conversions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(conversionData)
        });
        
        if (response.ok) {
            return true;
        } else {
            console.error('Ошибка сохранения в БД:', response.statusText);
            return false;
        }
    } catch (error) {
        console.error('Ошибка сохранения в БД:', error);
        
        // Для демонстрации возвращаем успех, если сервер недоступен
        console.log('Сервер недоступен, используется демо-режим');
        return true;
    }
}

// Получение истории конвертаций из базы данных
async function getConversionHistory() {
    try {
        const response = await fetch(`${API_BASE_URL}/conversions`);
        
        if (response.ok) {
            return await response.json();
        } else {
            console.error('Ошибка загрузки истории:', response.statusText);
            return [];
        }
    } catch (error) {
        console.error('Ошибка загрузки истории:', error);
        
        // Для демонстрации возвращаем фиктивные данные
        return [
            {
                id: 1,
                amount: 1000,
                from_currency: 'RUB',
                to_currency: 'USD',
                result: 11.0,
                timestamp: '2023-10-20T14:30:00Z'
            },
            {
                id: 2,
                amount: 500,
                from_currency: 'RUB',
                to_currency: 'EUR',
                result: 5.0,
                timestamp: '2023-10-19T10:15:00Z'
            },
            {
                id: 3,
                amount: 100,
                from_currency: 'USD',
                to_currency: 'RUB',
                result: 9090.91,
                timestamp: '2023-10-18T16:45:00Z'
            }
        ];
    }
}