const pool = require('../dbconnect');
const bcrypt = require('bcryptjs');

class SplitBill {
    static async create(bill_id,user_id, amount_to_pay, method,description,date_due,images) {

        const sql = 'INSERT INTO `bill_splits`(`bill_id`, `user_id`, `amount_to_pay`, `method`, `description`, `date_due`, `images`) VALUES VALUES (?,?,?,?,?,?,?)'
        const [result] = await pool.execute(
            sql,[bill_id, user_id, amount_to_pay, method, description,date_due,images]
        );


        return result.insertId;
    }

    static async updateSplitBill(user_id,bill_id,amount_paid, last,username,rUsername) {

        //const sql = 'INSERT INTO `users`(`email`,`phone`, `password_hash`) VALUES (?,?,?,?,?)'
        const [result] = await pool.execute(
            'UPDATE `bill_splits` SET first_name = ?, last_name =?, username = ?, rusername = ? WHERE id = ?',
            [first, last, username,rUsername, id]
        );

        console.log(result);

        return result.insertId;
    }

    static async getSpliBills(bill_id) {
        const [rows] = await pool.execute(
            'SELECT * FROM bill_splits WHERE id = ?',
            [bill_id]
        );
        return rows[0];
    }

    

    static async findById(id) {
        const [rows] = await pool.execute(
            'SELECT * FROM bill_splits WHERE id = ?',
            [id]
        );
        return rows[0];
    }

    static async Delete(id) {
        const [rows] = await pool.execute(
            'DELETE FROM `bill_splits` WHERE id = ?',
            [id]
        );
        return rows[0];
    }

}

module.exports = SplitBill;