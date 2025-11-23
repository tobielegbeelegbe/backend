const sequelize = require("../Config/sequalize_db");
const Payment = require("./payment");
const SplitBill = require("./splitbill");
const SplitBillParticipant = require("./splitBillParticipant");
const SplitBillActivity = require("./splitBillActivity");
const Refund = require("./refund");

SplitBill.hasMany(SplitBillParticipant, {
  foreignKey: "split_bill_id",
  as: "participants",
  onDelete: "CASCADE",
});

SplitBill.hasMany(SplitBillActivity, {
  foreignKey: "split_bill_id",
  as: "activities",
  onDelete: "CASCADE",
});

SplitBillParticipant.belongsTo(SplitBill, {
  foreignKey: "split_bill_id",
  as: "bill",
});

SplitBillParticipant.hasMany(Payment, {
  foreignKey: "participant_id",
  as: "payments",
  onDelete: "CASCADE",
});

Payment.belongsTo(SplitBillParticipant, {
  foreignKey: "participant_id",
  as: "participant",
});

SplitBillActivity.belongsTo(SplitBill, {
  foreignKey: "split_bill_id",
  as: "bill",
});

Refund.belongsTo(SplitBillParticipant, {
  foreignKey: "participant_id",
  as: "participant",
});

module.exports = {
  sequelize,
  SplitBill,
  SplitBillParticipant,
  Payment,
  SplitBillActivity,
  Refund,
};
