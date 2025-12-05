const pool = require('../dbconnect');
const bcrypt = require('bcryptjs');



class offers {
  static async findAll(userId) {
    const [rows] = await pool.execute('SELECT * FROM offers WHERE user_id = ? ORDER BY created_at DESC', [userId]);
    return rows;
  }

  static async findById(id) {
    const [rows] = await pool.execute('SELECT * FROM offers WHERE id = ?', [id]);
    return rows[0];
  }

  static async create({ offer_name,offer_desc,campaign_id}) {
    const [result] = await pool.execute('INSERT INTO offers (`user_id`, `campaign_id`) VALUES (?,?)', [user_id, campaign_id]);
    return result.insertId;
  }

  static async update(id, updates) {
    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);
    values.push(id);
    await pool.execute(`UPDATE offers SET ${fields} WHERE id = ?`, values);
  }

  static async delete(id) {
    await pool.execute('DELETE FROM offers WHERE id = ?', [id]);
  }
}

module.exports = offers;