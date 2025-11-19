const Host = require('../../Models/hosts');

exports.getHosts = async (req, res) => {
  try {
    const { userId } = req.params;
    const Hosts = await Host.findAll(userId);
    res.json(Hosts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getHost = async (req, res) => {
  try {
    const { id } = req.params;
    const Host = await Host.findById(id);
    if (!Host) return res.status(404).json({ error: 'Host not found' });
    res.json(Host);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createHost = async (user_id,campaign_id) => {
  try {
    const id = await Host.create({ user_id, campaign_id});
    return id;
  } catch (error) {
    console.log(error);
  }
};

exports.updateHost = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    await Host.update(id, updates);
    res.json({ message: 'Host updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteHost = async (req, res) => {
  try {
    const { id } = req.params;
    await Host.delete(id);
    res.json({ message: 'Host deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};