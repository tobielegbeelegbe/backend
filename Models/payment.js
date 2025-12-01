const { DataTypes } = require("sequelize");
const sequelize = require("../Config/sequalize_db");

const Payment = sequelize.define(
  "Payment",
  {
    id: {
      type: DataTypes.CHAR(36),
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
      collate: "utf8mb4_bin",
    },
    participant_id: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      collate: "utf8mb4_bin",
    },
    payer_id: {
      type: DataTypes.CHAR(36),
      allowNull: true,
      collate: "utf8mb4_bin",
    },
    amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      validate: { min: 0.01 },
    },
    currency: {
      type: DataTypes.STRING(3),
      allowNull: false,
      defaultValue: "NGN",
    },
    payment_method: {
      type: DataTypes.ENUM("wallet", "card", "bank_transfer", "cash", "other"),
      allowNull: true,
    },
    transaction_reference: {
      type: DataTypes.STRING(100),
      allowNull: true,
      unique: true,
    },
    payment_status: {
      type: DataTypes.ENUM("pending", "completed", "failed", "refunded"),
      defaultValue: "completed",
    },
    payment_gateway: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "payments",
    underscored: true,
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

module.exports = Payment;
