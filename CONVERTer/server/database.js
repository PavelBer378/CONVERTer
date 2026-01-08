const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const CryptoJS = require('crypto-js');
require('dotenv').config();

// Ключ шифрования (должен храниться в защищенном месте)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'demo-encryption-key-change-in-production';

// Создание пула подключений к PostgreSQL
const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'currency_converter',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

// Функция шифрования данных
function encryptData(data) {
    return CryptoJS.AES.encrypt(JSON.stringify(data), ENCRYPTION_KEY).toString();
}

// Функция дешифрования данных
function decryptData(encryptedData) {
    const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY);
    return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
}

// Инициализация базы данных
async function initDatabase() {
    try {
        const client = await pool.connect();
        
        // Создание таблицы для конвертаций
        await client.query(`
            CREATE TABLE IF NOT EXISTS conversions (
                id SERIAL PRIMARY KEY,
                amount DECIMAL NOT NULL,
                from_currency VARCHAR(10) NOT NULL,
                to_currency VARCHAR(10) NOT NULL,
                result DECIMAL NOT NULL,
                encrypted_data TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // Создание таблицы для пользователей (если нужно)
        await client.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        console.log('База данных инициализирована');
        client.release();
    } catch (error) {
        console.error('Ошибка инициализации базы данных:', error);
    }
}

// Сохранение конвертации в БД
async function saveConversion(conversionData) {
    const { amount, fromCurrency, toCurrency, result } = conversionData;
    
    // Шифрование данных конвертации
    const dataToEncrypt = {
        amount,
        fromCurrency,
        toCurrency,
        result,
        timestamp: new Date().toISOString()
    };
    
    const encryptedData = encryptData(dataToEncrypt);
    
    try {
        const client = await pool.connect();
        const query = `
            INSERT INTO conversions (amount, from_currency, to_currency, result, encrypted_data)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, created_at
        `;
        
        const values = [amount, fromCurrency, toCurrency, result, encryptedData];
        const res = await client.query(query, values);
        
        client.release();
        return { success: true, id: res.rows[0].id };
    } catch (error) {
        console.error('Ошибка сохранения конвертации:', error);
        return { success: false, error: error.message };
    }
}

// Получение истории конвертаций
async function getConversions(limit = 50) {
    try {
        const client = await pool.connect();
        const query = `
            SELECT id, amount, from_currency, to_currency, result, created_at
            FROM conversions
            ORDER BY created_at DESC
            LIMIT $1
        `;
        
        const res = await client.query(query, [limit]);
        client.release();
        
        return res.rows;
    } catch (error) {
        console.error('Ошибка получения истории конвертаций:', error);
        return [];
    }
}

// Создание пользователя (дополнительная функция)
async function createUser(username, password) {
    try {
        const passwordHash = await bcrypt.hash(password, 10);
        const client = await pool.connect();
        
        const query = `
            INSERT INTO users (username, password_hash)
            VALUES ($1, $2)
            RETURNING id
        `;
        
        const res = await client.query(query, [username, passwordHash]);
        client.release();
        
        return { success: true, userId: res.rows[0].id };
    } catch (error) {
        console.error('Ошибка создания пользователя:', error);
        return { success: false, error: error.message };
    }
}

module.exports = {
    pool,
    initDatabase,
    saveConversion,
    getConversions,
    createUser,
    encryptData,
    decryptData
};