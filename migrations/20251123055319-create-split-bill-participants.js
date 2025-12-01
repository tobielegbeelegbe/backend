"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("split_bill_participants", {
      id: {
        type: Sequelize.CHAR(36),
        primaryKey: true,
        allowNull: false,
        collate: "utf8mb4_bin",
      },
      split_bill_id: {
        type: Sequelize.CHAR(36),
        allowNull: false,
        collate: "utf8mb4_bin",
        references: {
          model: "split_bills",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      user_id: {
        type: Sequelize.CHAR(36),
        allowNull: true,
        collate: "utf8mb4_bin",
      },
      guest_name: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      guest_phone: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },
      guest_email: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      amount_owed: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0.0,
      },
      amount_paid: {
        type: Sequelize.DECIMAL(15, 2),
        defaultValue: 0.0,
      },
      percentage: {
        type: Sequelize.FLOAT,
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM("UNPAID", "PARTIAL", "PAID", "OVERDUE"),
        defaultValue: "UNPAID",
      },
      paid: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      paid_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      invite_code: {
        type: Sequelize.STRING(12),
        allowNull: true,
        unique: true,
      },
      invite_expires_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      invited_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      accepted_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      declined_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    // Add indexes
    await queryInterface.addIndex("split_bill_participants", ["split_bill_id"]);
    await queryInterface.addIndex("split_bill_participants", ["user_id"]);
    await queryInterface.addIndex("split_bill_participants", ["guest_phone"]);
    await queryInterface.addIndex("split_bill_participants", ["status"]);
    await queryInterface.addIndex("split_bill_participants", ["invite_code"], {
      unique: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("split_bill_participants");
  },
};
