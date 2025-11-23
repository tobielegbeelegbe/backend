"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableExists = await queryInterface.sequelize.query(
      `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'split_bill_activities'`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (tableExists.length === 0) {
      await queryInterface.createTable("split_bill_activities", {
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
        participant_id: {
          type: Sequelize.CHAR(36),
          allowNull: true,
          collate: "utf8mb4_bin",
          comment: "Which participant was affected (optional)",
        },
        actor_id: {
          type: Sequelize.CHAR(36),
          allowNull: true,
          collate: "utf8mb4_bin",
        },
        action_type: {
          type: Sequelize.ENUM(
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
          type: Sequelize.TEXT,
          allowNull: true,
        },
        amount_before: {
          type: Sequelize.DECIMAL(15, 2),
          allowNull: true,
          comment: "Amount before this change",
        },
        amount_after: {
          type: Sequelize.DECIMAL(15, 2),
          allowNull: true,
          comment: "Amount after this change",
        },
        amount_difference: {
          type: Sequelize.DECIMAL(15, 2),
          allowNull: true,
          comment: "Calculated difference",
        },
        metadata: {
          type: Sequelize.JSON,
          allowNull: true,
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
        },
      });

      // Add indexes
      await queryInterface.addIndex("split_bill_activities", ["split_bill_id"]);
      await queryInterface.addIndex("split_bill_activities", [
        "participant_id",
      ]);
      await queryInterface.addIndex("split_bill_activities", ["actor_id"]);
      await queryInterface.addIndex("split_bill_activities", ["action_type"]);
      await queryInterface.addIndex("split_bill_activities", ["created_at"]);
    } else {
      const columns = await queryInterface.describeTable(
        "split_bill_activities"
      );

      if (!columns.participant_id) {
        await queryInterface.addColumn(
          "split_bill_activities",
          "participant_id",
          {
            type: Sequelize.CHAR(36),
            allowNull: true,
            collate: "utf8mb4_bin",
            after: "split_bill_id",
          }
        );
        await queryInterface.addIndex("split_bill_activities", [
          "participant_id",
        ]);
      }

      if (!columns.amount_before) {
        await queryInterface.addColumn(
          "split_bill_activities",
          "amount_before",
          {
            type: Sequelize.DECIMAL(15, 2),
            allowNull: true,
            after: "description",
          }
        );
      }

      if (!columns.amount_after) {
        await queryInterface.addColumn(
          "split_bill_activities",
          "amount_after",
          {
            type: Sequelize.DECIMAL(15, 2),
            allowNull: true,
            after: "amount_before",
          }
        );
      }

      if (!columns.amount_difference) {
        await queryInterface.addColumn(
          "split_bill_activities",
          "amount_difference",
          {
            type: Sequelize.DECIMAL(15, 2),
            allowNull: true,
            after: "amount_after",
          }
        );
      }

      await queryInterface.sequelize.query(`
        ALTER TABLE split_bill_activities 
        MODIFY COLUMN action_type ENUM(
          'created',
          'updated',
          'amount_increased',
          'amount_decreased',
          'participant_added',
          'participant_removed',
          'payment_made',
          'payment_refunded',
          'refund_issued',
          'refund_pending',
          'shares_recalculated',
          'completed',
          'cancelled',
          'reminder_sent'
        ) NOT NULL
      `);
    }
  },

  down: async (queryInterface, Sequelize) => {
    const columns = await queryInterface.describeTable("split_bill_activities");

    if (columns.participant_id) {
      await queryInterface.removeColumn(
        "split_bill_activities",
        "participant_id"
      );
    }
    if (columns.amount_before) {
      await queryInterface.removeColumn(
        "split_bill_activities",
        "amount_before"
      );
    }
    if (columns.amount_after) {
      await queryInterface.removeColumn(
        "split_bill_activities",
        "amount_after"
      );
    }
    if (columns.amount_difference) {
      await queryInterface.removeColumn(
        "split_bill_activities",
        "amount_difference"
      );
    }
  },
};
