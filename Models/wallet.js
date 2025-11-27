const pool = require('../dbconnect');
const bcrypt = require('bcryptjs');

class Wallet {

    static async create(user_id, currency) {

        const [result] = await pool.execute(
            'INSERT INTO wallets (user_id, currency) VALUES (?,?)',
            [user_id, currency]
        );


        return result.insertId;
    }

    static async getWalletBallance(id) {
        const [rows] = await pool.execute(
            'SELECT balance FROM wallets WHERE id = ?',
            [email]
        );
        return rows[0];
    }

    static async getWallet(id) {
        const [rows] = await pool.execute(
            'SELECT * FROM wallets WHERE user_id = ?',
            [id]
        );
        return rows[0];
    }

    static async getWallets() {
        const [rows] = await pool.execute(
            'SELECT * FROM wallets',
            
        );
        return rows[0];
    }

    static async addWalletBalance(id, amount) {
        await pool.execute(
            'UPDATE wallets SET balance = balance + ? WHERE id = ?',
            [amount, id]
        );
    }

    static async minusWalletBalance(id, amount) {
        await pool.execute(
            'UPDATE wallets SET balance = balance - ? WHERE user_id = ?',
            [amount, id]
        );
    }
}


module.exports = Wallet;