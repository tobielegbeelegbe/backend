const { DataTypes } = require("sequelize");
const sequelize = require("../Config/sequalize_db");

const SplitBillParticipant = sequelize.define(
  "SplitBillParticipant",
  {
    id: {
      type: DataTypes.CHAR(36),
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
      collate: "utf8mb4_bin",
    },
    split_bill_id: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      references: { model: "split_bills", key: "id" },
      onDelete: "CASCADE",
      collate: "utf8mb4_bin",
    },
    user_id: {
      type: DataTypes.CHAR(36),
      allowNull: true,
      // references: { model: "users", key: "id" },
      // collate: "utf8mb4_bin",
    },
    guest_name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    guest_phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    guest_email: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isEmail: true,
      },
    },
    amount_owed: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0.0,
      validate: {
        min: 0,
      },
    },
    amount_paid: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0.0,
      validate: {
        min: 0,
      },
    },
    percentage: {
      type: DataTypes.FLOAT,
      allowNull: true,
      validate: {
        min: 0,
        max: 100,
      },
    },
    status: {
      type: DataTypes.ENUM("UNPAID", "PARTIAL", "PAID", "OVERDUE"),
      defaultValue: "UNPAID",
    },
    paid: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    paid_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    balance_adjustment: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
    },
    payment_link: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    invite_code: {
      type: DataTypes.STRING(12),
      allowNull: true,
      unique: true,
    },
    invite_expires_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    invited_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    accepted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    declined_at: {
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
    tableName: "split_bill_participants",
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ["split_bill_id"] },
      { fields: ["user_id"] },
      { fields: ["guest_phone"] },
      { fields: ["status"] },
      {
        unique: true,
        fields: ["split_bill_id", "user_id"],
        name: "unique_user_per_bill",
      },
      {
        unique: true,
        fields: ["split_bill_id", "guest_phone"],
        name: "unique_guest_per_bill",
      },
    ],
    validate: {
      eitherUserOrGuest() {
        if (this.changed("user_id") || this.changed("guest_phone")) {
          const isUser = !!this.user_id;
          const isGuest = !!this.guest_phone;

          if (!isUser && !isGuest) {
            throw new Error(
              "Participant must have either user_id or guest_phone"
            );
          }

          if (isUser && isGuest) {
            throw new Error("Participant cannot be both user and guest");
          }
        }
      },
    },
  }
);

module.exports = SplitBillParticipant;
