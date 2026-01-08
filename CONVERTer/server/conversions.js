const express = require('express');
const router = express.Router();
const db = require('../database');

// Получение всех конвертаций
router.get('/', async (req, res) => {
    try {
        const conversions = await db.getConversions();
        res.json(conversions);
    } catch (error) {
        res.status(500).json({ error: 'Ошибка получения истории конвертаций' });
    }
});

// Сохранение новой конвертации
router.post('/', async (req, res) => {
    try {
        const { amount, fromCurrency, toCurrency, result } = req.body;
        
        if (!amount || !fromCurrency || !toCurrency || !result) {
            return res.status(400).json({ error: 'Отсутствуют обязательные поля' });
        }
        
        const saveResult = await db.saveConversion({
            amount,
            fromCurrency,
            toCurrency,
            result
        });
        
        if (saveResult.success) {
            res.status(201).json({ 
                message: 'Конвертация сохранена', 
                id: saveResult.id 
            });
        } else {
            res.status(500).json({ error: saveResult.error });
        }
    } catch (error) {
        res.status(500).json({ error: 'Ошибка сохранения конвертации' });
    }
});

module.exports = router;