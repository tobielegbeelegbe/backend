const Wallet = require("../../Models/wallet");

// Create a new wallet for a user
exports.createWallet = async (userId, currency) => {
  try {
    
    const wallet = await Wallet.create(userId, currency);
    
  } catch (error) {
    return error.message;
  }
};

exports.getWallets = async (req, res) => {
  try {
    const wallet = await Wallet.getWallets();
    if (wallet) {
      res.status(200).json(wallet);
    } else {
      res.status(404).json({ message: "Wallet not found" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getUserWallet = async (userId) => {
  try {
    const wallet = await Wallet.getWallet(userId);

    if (wallet) {
      return wallet;
    } else {
      console.log("Wallet not found");
    }
  } catch (error) {
    console.log(error.message);
  }
};

// Get a wallet by userId
exports.getWallet = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const wallet = await Wallet.getWallet({ where: { userId } });
    if (wallet) {
      res.status(200).json(wallet);
    } else {
      res.status(404).json({ message: "Wallet not found" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getWalletBalance = async (req, res) => {
  try {
    const { userId } = req.params;
    const wallet = await Wallet.getWalletBallance({ where: { userId } });
    if (wallet) {
      res.status(200).json(wallet);
    } else {
      res.status(404).json({ message: "Wallet not found" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Add funds to a wallet
exports.addFunds = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;


    const wallet = await Wallet.getWallet(id);
    if (wallet) {
      const update = await Wallet.addWalletBalance(id, amount);
      
      if(update != null)
      {
        const wallets = await Wallet.getWallet(id);
        const payload = {wallets: wallets}
        res.status(200).json(payload);
      }
      
    } else {
      res.status(404).json({ message: "Wallet not found" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.removeFunds = async (req, res) => {
  try {
    const { userId } = req.params;
    const { amount } = req.body;

    const wallet = await Wallet.getWallet(userId);
    if (wallet) {
      const update = await Wallet.minusWalletBalance(userId, amount);
      res.status(200).json(wallet);
    } else {
      res.status(404).json({ message: "Wallet not found" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteWallet = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.execute("DELETE FROM Wallet WHERE id = ?", [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Wallet  not found" });
    }
    res.status(200).json({ message: "Wallet  deleted successfully" });
  } catch (error) {
    console.error("Error deleting Wallet:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
