const pool = require('../dbconnect');
const bcrypt = require('bcryptjs');



class host {
  static async findAll(userId) {
    const [rows] = await pool.execute('SELECT * FROM host WHERE user_id = ? ORDER BY created_at DESC', [userId]);
    return rows;
  }

  static async findById(id) {
    const [rows] = await pool.execute('SELECT * FROM host WHERE id = ?', [id]);
    return rows[0];
  }

  static async create({ campaign_id,user_id,}) {
    const [result] = await pool.execute('INSERT INTO host (`user_id`, `campaign_id`) VALUES (?,?)', [user_id, campaign_id]);
    return result.insertId;
  }

  static async update(id, updates) {
    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);
    values.push(id);
    await pool.execute(`UPDATE host SET ${fields} WHERE id = ?`, values);
  }

  static async delete(id) {
    await pool.execute('DELETE FROM host WHERE id = ?', [id]);
  }
}

module.exports = host;