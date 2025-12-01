"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("payments", {
      id: {
        type: Sequelize.CHAR(36),
        primaryKey: true,
        allowNull: false,
        collate: "utf8mb4_bin",
      },
      participant_id: {
        type: Sequelize.CHAR(36),
        allowNull: false,
        collate: "utf8mb4_bin",
        references: {
          model: "split_bill_participants",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      payer_id: {
        type: Sequelize.CHAR(36),
        allowNull: true,
        collate: "utf8mb4_bin",
      },
      amount: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
      },
      currency: {
        type: Sequelize.STRING(3),
        allowNull: false,
        defaultValue: "NGN",
      },
      payment_method: {
        type: Sequelize.ENUM(
          "wallet",
          "card",
          "bank_transfer",
          "cash",
          "other"
        ),
        allowNull: true,
      },
      transaction_reference: {
        type: Sequelize.STRING(100),
        allowNull: true,
        unique: true,
      },
      payment_status: {
        type: Sequelize.ENUM("pending", "completed", "failed", "refunded"),
        defaultValue: "completed",
      },
      payment_gateway: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      metadata: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      notes: {
        type: Sequelize.TEXT,
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
    await queryInterface.addIndex("payments", ["participant_id"]);
    await queryInterface.addIndex("payments", ["payer_id"]);
    await queryInterface.addIndex("payments", ["transaction_reference"], {
      unique: true,
    });
    await queryInterface.addIndex("payments", ["payment_status"]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("payments");
  },
};
