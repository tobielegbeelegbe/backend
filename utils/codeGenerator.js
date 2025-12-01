const crypto = require("crypto");

const generateInviteCode = () => {
  return crypto.randomBytes(6).toString("hex").toUpperCase();
};

const generateTransactionReference = () => {
  const timestamp = Date.now();
  const random = crypto.randomBytes(4).toString("hex");
  return `TXN-${timestamp}-${random}`.toUpperCase();
};

module.exports = {
  generateInviteCode,
  generateTransactionReference,
};
