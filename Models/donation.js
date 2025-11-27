const pool = require('../dbconnect');

class Donation {
    static async create(userId, campaignId, amount, type, stat, uName) {
        console.log(campaignId);
        const [result] = await pool.execute(
            'INSERT INTO donors (user_id, campaign_id, amount, type, status, name) VALUES (?, ?, ?, ?, ?, ?)',
            [userId, campaignId, amount, type, stat, uName]
        );
        return result.insertId;
    }

    
      static async getDonationByUser(id) {
          const [rows] = await pool.execute(
              'SELECT * FROM donors WHERE user_id = ?',
              [id]
          );
          return rows[0];
      }

      static async getDonationByCampaign(id) {
          const [rows] = await pool.execute(
              'SELECT * FROM donors WHERE campaign_id = ?',
              [id]
          );
          return rows[0];
      }

    static async updateStatus(id, status) {
        await pool.execute(
            'UPDATE donors SET status = ? WHERE id = ?',
            [status, id]
        );
    }

    static async getByEventId(eventId) {
        const [rows] = await pool.execute(
            'SELECT d.*, u.email FROM donors d JOIN users u ON d.user_id = u.id WHERE d.event_id = ? ORDER BY d.created_at DESC',
            [eventId]
        );
        return rows;
    }
}

module.exports = Donation;