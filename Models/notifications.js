const pool = require('../dbconnect');
const bcrypt = require('bcryptjs');



class Notification {
  static async findAll(userId) {
    const [rows] = await pool.execute('SELECT * FROM notification WHERE user_id = ? ORDER BY created_at DESC', [userId]);
    return rows;
  }

  static async findById(id) {
    const [rows] = await pool.execute('SELECT * FROM notification WHERE id = ?', [id]);
    return rows[0];
  }

  static async create({ user_id, message, type, campaign_id }) {
    const [result] = await pool.execute('INSERT INTO notification (`user_id`, `message`, `type`, `type_id`) VALUES (?, ?, ?, ?)', [user_id, message, type, campaign_id]);
    return result.insertId;
  }

  static async update(id, updates) {
    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);
    values.push(id);
    await pool.execute(`UPDATE notifications SET ${fields} WHERE id = ?`, values);
  }

  static async delete(id) {
    await pool.execute('DELETE FROM notifications WHERE id = ?', [id]);
  }
}

module.exports = Notification;