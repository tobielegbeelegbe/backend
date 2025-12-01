const { DataTypes } = require("sequelize");
const sequelize = require("../Config/sequalize_db");

const SplitBillActivity = sequelize.define(
  "SplitBillActivity",
  {
    id: {
      type: DataTypes.CHAR(36),
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
      collate: "utf8mb4_bin",
    },
    split_bill_id: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      references: {
        model: "split_bills",
        key: "id",
      },
      onDelete: "CASCADE",
      collate: "utf8mb4_bin",
    },
    participant_id: {
      type: DataTypes.CHAR(36),
      allowNull: true,
      collate: "utf8mb4_bin",
      comment: "Which participant was affected (optional)",
    },
    actor_id: {
      type: DataTypes.CHAR(36),
      allowNull: true,
      collate: "utf8mb4_bin",
    },
    action_type: {
      type: DataTypes.ENUM(
        "created",
        "updated",
        "amount_increased",
        "amount_decreased",
        "participant_added",
        "participant_removed",
        "payment_made",
        "payment_refunded",
        "refund_issued",
        "refund_pending",
        "shares_recalculated",
        "completed",
        "cancelled",
        "reminder_sent"
      ),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    amount_before: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
    },
    amount_after: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
    },
    amount_difference: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "split_bill_activities",
    timestamps: false,
    indexes: [
      { fields: ["split_bill_id"] },
      { fields: ["participant_id"] },
      { fields: ["actor_id"] },
      { fields: ["action_type"] },
      { fields: ["created_at"] },
    ],
  }
);

module.exports = SplitBillActivity;
