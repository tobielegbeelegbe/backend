const pool = require('../dbconnect');

class Backer {
    static async create(userId, campaignId, amount, backerId) {
        const [result] = await pool.execute(
            'INSERT INTO backers (user_id, campaign_id, amount, backer_id) VALUES (?, ?, ?, ?)',
            [userId, campaignId, amount, backerId]
        );
        return result.insertId;
    }

    
      static async getDonationByUser(id) {
          const [rows] = await pool.execute(
              'SELECT * FROM backers WHERE user_id = ?',
              [id]
          );
          return rows[0];
      }

      static async getDonationByCampaign(id) {
          const [rows] = await pool.execute(
              'SELECT * FROM backers WHERE campaign_id = ?',
              [id]
          );
          return rows[0];
      }

    static async updateStatus(id, status) {
        await pool.execute(
            'UPDATE backers SET status = ? WHERE id = ?',
            [status, id]
        );
    }

    static async getByEventId(eventId) {
        const [rows] = await pool.execute(
            'SELECT d.*, u.email FROM backers d JOIN users u ON d.user_id = u.id WHERE d.event_id = ? ORDER BY d.created_at DESC',
            [eventId]
        );
        return rows;
    }
}

module.exports = Backer;