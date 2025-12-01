const { DataTypes } = require("sequelize");
const sequelize = require("../Config/sequalize_db");

const SplitBill = sequelize.define(
  "SplitBill",
  {
    id: {
      type: DataTypes.CHAR(36),
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
      collate: "utf8mb4_bin",
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 255],
      },
    },
    description: { type: DataTypes.TEXT, allowNull: true },
    currency: {
      type: DataTypes.STRING(3),
      allowNull: false,
      defaultValue: "NGN",
      validate: {
        isIn: [["NGN", "USD", "GBP", "EUR"]],
      },
    },
    amount: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      validate: {
        min: 0.01,
      },
    },
    creator_id: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      // collate: "utf8mb4_bin",
      // references: {
      //   model: "users",
      //   key: "id",
      // },
    },
    split_method: {
      type: DataTypes.ENUM("EVEN", "MANUAL", "PERCENTAGE", "RANDOM_PICK"),
      allowNull: false,
      defaultValue: "EVEN",
    },
    due_date: {
      type: DataTypes.DATE,
      allowNull: true,
      validate: {
        isDate: true,
        isAfterNow(value) {
          if (value && new Date(value) < new Date()) {
            throw new Error("Due date must be in the future");
          }
        },
      },
    },
    is_finalized: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    status: {
      type: DataTypes.ENUM("active", "completed", "cancelled", "overdue"),
      allowNull: false,
      defaultValue: "active",
    },
    image_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    bill_receipt: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    total_participants: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },
    total_paid: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      defaultValue: 0.0,
      validate: {
        min: 0,
      },
    },
    source_bill_type: {
      type: DataTypes.ENUM("invoice", "campaign", "request", "manual"),
      allowNull: true,
    },
    source_bill_id: {
      type: DataTypes.CHAR(36),
      allowNull: true,
      collate: "utf8mb4_bin",
    },
    reminder_sent_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    last_reminder_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "split_bills",
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ["creator_id"] },
      { fields: ["status"] },
      { fields: ["due_date"] },
      { fields: ["source_bill_type", "source_bill_id"] },
      { fields: ["created_at"] },
    ],
  }
);

module.exports = SplitBill;
