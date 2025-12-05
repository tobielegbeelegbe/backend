// campaignModel.js
// This model handles all database interactions for the 'budgets' table.
// It exports async functions for CRUD operations.

const db = require('../dbconnect'); // Adjust path as needed

// Get all budgets (optionally filtered by user_id or status)
const getAllBudgets = async (userId = null, status = null) => {
  let query = 'SELECT * FROM budgets';
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



// Get campaign by ID
const getBudgetById = async (id) => {
  const [rows] = await db.execute('SELECT * FROM budgets WHERE campaign_id = ?', [id]);
  return rows.length > 0 ? rows[0] : null;
};



// Create a new campaign
const createBudget = async (budgetData,campaign_id) => {
  const { name, cost, files } = budgetData;
  if (!title || !user_id) {
    throw new Error('Title and user_id are required');
  }
  
  const [result] = await db.execute(
    'INSERT INTO budgets (description, cost, document, campaign_id) VALUES (?, ?, ?, ?)',
    [name, cost, files , campaign_id]
  );
  return { id: result.insertId, ...campaignData };
};


// Update campaign by ID
const updateBudget = async (id, updateData) => {
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
    `UPDATE budgets SET ${updateFields.join(', ')} WHERE id = ?`,
    values
  );
  
  if (result.affectedRows === 0) {
    throw new Error('Budget not found');
  }
  
  return await getBudgetById(id); // Return updated campaign
};

// Delete campaign by ID
const deleteBudget = async (id) => {
  const [result] = await db.execute('DELETE FROM budgets WHERE id = ?', [id]);
  if (result.affectedRows === 0) {
    throw new Error('Budget not found');
  }
  return true;
};

// Additional: Get budgets by user ID (for user-specific queries)
const getBudgetsByUserId = async (userId) => {
  return await getAllBudgets(userId);
};

module.exports = {
  getAllBudgets,
  getBudgetById,
  createBudget,
  updateBudget,
  deleteBudget,
  getBudgetsByUserId,
};