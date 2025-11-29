const Offer = require('../../Models/offers');

exports.getOffers = async (req, res) => {
  try {
    const { userId } = req.params;
    const Offers = await Offer.findAll(userId);
    res.json(Offers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getOffer = async (req, res) => {
  try {
    const { id } = req.params;
    const Offer = await Offer.findById(id);
    if (!Offer) return res.status(404).json({ error: 'Offer not found' });
    res.json(Offer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createOffer = async (offer_name,offer_desc,campaign_id) => {
  try {
    const id = await Offer.create({ offer_name,offer_desc, campaign_id});
    return id;
  } catch (error) {
    console.log(error);
  }
};

exports.updateOffer = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    await Offer.update(id, updates);
    res.json({ message: 'Offer updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteOffer = async (req, res) => {
  try {
    const { id } = req.params;
    await Offer.delete(id);
    res.json({ message: 'Offer deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};