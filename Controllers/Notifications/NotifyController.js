const Notification = require('../../Models/notifications');

exports.getNotifications = async (req, res) => {
  try {
    const { userId } = req.params;
    console.log(userId);
    const notifications = await Notification.findAll(userId);
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getNotification = async (req, res) => {
  try {
    const { id } = req.params;
    
    const notification = await Notification.findById(id);
    if (!notification) return res.status(404).json({ error: 'Notification not found' });
    res.json(notification);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createNotification = async (user_id,message,type,campaign_id) => {
  try {
   
    const id = await Notification.create({ user_id, message, type, campaign_id });
    return id;
  } catch (error) {
    console.log(error);
  }
};

exports.updateNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    await Notification.update(id, updates);
    res.json({ message: 'Notification updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    await Notification.delete(id);
    res.json({ message: 'Notification deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};