'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('split_bills', {
      id: {
        type: Sequelize.CHAR(36),
        primaryKey: true,
        allowNull: false,
        collate: 'utf8mb4_bin',
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      currency: {
        type: Sequelize.STRING(3),
        allowNull: false,
        defaultValue: 'NGN',
      },
      amount: {
        type: Sequelize.DECIMAL(18, 2),
        allowNull: false,
      },
      creator_id: {
        type: Sequelize.CHAR(36),
        allowNull: false,
        collate: 'utf8mb4_bin',
      },
      split_method: {
        type: Sequelize.ENUM('EVEN', 'MANUAL', 'PERCENTAGE', 'RANDOM_PICK'),
        allowNull: false,
        defaultValue: 'EVEN',
      },
      due_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      is_finalized: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      status: {
        type: Sequelize.ENUM('active', 'completed', 'cancelled', 'overdue'),
        allowNull: false,
        defaultValue: 'active',
      },
      image_url: {
        type: Sequelize.STRING(500),
        allowNull: true,
      },
      bill_receipt: {
        type: Sequelize.STRING(500),
        allowNull: true,
      },
      total_participants: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      total_paid: {
        type: Sequelize.DECIMAL(18, 2),
        allowNull: false,
        defaultValue: 0.0,
      },
      source_bill_type: {
        type: Sequelize.ENUM('invoice', 'campaign', 'request', 'manual'),
        allowNull: true,
      },
      source_bill_id: {
        type: Sequelize.CHAR(36),
        allowNull: true,
        collate: 'utf8mb4_bin',
      },
      reminder_sent_count: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      last_reminder_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // Add indexes
    await queryInterface.addIndex('split_bills', ['creator_id']);
    await queryInterface.addIndex('split_bills', ['status']);
    await queryInterface.addIndex('split_bills', ['due_date']);
    await queryInterface.addIndex('split_bills', ['source_bill_type', 'source_bill_id']);
    await queryInterface.addIndex('split_bills', ['created_at']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('split_bills');
  }
};