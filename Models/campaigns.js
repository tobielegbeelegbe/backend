// campaignModel.js
// This model handles all database interactions for the 'campaigns' table.
// It exports async functions for CRUD operations.

const db = require('../dbconnect'); // Adjust path as needed

// Get all campaigns (optionally filtered by user_id or status)
const getAllCampaigns = async (userId = null, status = null) => {
  let query = 'SELECT * FROM campaigns';
  const params = [];
  
  if (userId) {
    query += ' WHERE user_id = ?';
    params.push(userId);
  } else if (status) {
    query += ' WHERE status = ?';
    params.push(status);
  }
  
  const [rows] = await db.execute(query, params);
  return rows;
};

const getCategory = async () => {
  let query = 'SELECT * FROM category';
 
  const [rows] = await db.execute(query);
  return rows;
};

const getApproval = async (id) => {
  let query = ('SELECT champions,host,approved FROM campaign WHERE id = ?', [id]);
 
  const [rows] = await db.execute('SELECT champions,host,approved,total_approved FROM campaigns WHERE id = ?', [id]);
  return rows;
};

const stakeholderApproval = async (id) => {
  const columnName = 'total_approved';
  const [rows] = await db.execute('UPDATE campaigns set ${columnName} = ${columnName} + 1 WHERE id = ?', [id]);
  return rows;
};



// Get campaign by ID
const getCampaignById = async (id) => {
  const [rows] = await db.execute('SELECT * FROM campaigns WHERE id = ?', [id]);
  return rows.length > 0 ? rows[0] : null;
};


const getCampaignByName = async (name) => {
  const [rows] = await db.execute('SELECT * FROM campaigns WHERE title = ?', [name]);
  return rows.length > 0 ? rows[0] : null;
};

// Create a new campaign
const createCampaign = async (campaignData) => {
  const { title, description, start_date, end_date, status, user_id } = campaignData;
  if (!title || !user_id) {
    throw new Error('Title and user_id are required');
  }
  
  const [result] = await db.execute(
    'INSERT INTO campaigns (title, description, start_date, end_date, status, user_id) VALUES (?, ?, ?, ?, ?, ?)',
    [title, description || null, start_date || null, end_date || null, status || 'active', user_id]
  );
  return { id: result.insertId, ...campaignData };
};

// Update campaign by ID
const updateCampaign = async (id, updateData) => {
  const { title, description, start_date, end_date, status } = updateData;
  if (!title && !description && !start_date && !end_date && !status) {
    throw new Error('At least one field must be provided for update');
  }
  
  const updateFields = [];
  const values = [];
  
  if (title !== undefined) {
    updateFields.push('title = ?');
    values.push(title);
  }
  if (description !== undefined) {
    updateFields.push('description = ?');
    values.push(description);
  }
  if (start_date !== undefined) {
    updateFields.push('start_date = ?');
    values.push(start_date);
  }
  if (end_date !== undefined) {
    updateFields.push('end_date = ?');
    values.push(end_date);
  }
  if (status !== undefined) {
    updateFields.push('status = ?');
    values.push(status);
  }
  
  values.push(id);
  
  const [result] = await db.execute(
    `UPDATE campaigns SET ${updateFields.join(', ')} WHERE id = ?`,
    values
  );
  
  if (result.affectedRows === 0) {
    throw new Error('Campaign not found');
  }
  
  return await getCampaignById(id); // Return updated campaign
};

// Delete campaign by ID
const deleteCampaign = async (id) => {
  const [result] = await db.execute('DELETE FROM campaigns WHERE id = ?', [id]);
  if (result.affectedRows === 0) {
    throw new Error('Campaign not found');
  }
  return true;
};

// Additional: Get campaigns by user ID (for user-specific queries)
const getCampaignsByUserId = async (userId) => {
  return await getAllCampaigns(userId);
};

module.exports = {
  getAllCampaigns,
  getCampaignById,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  getCampaignsByUserId,
  getCampaignByName,
  getCategory,
  getApproval,
  stakeholderApproval,
};