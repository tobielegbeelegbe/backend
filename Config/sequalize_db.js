const { Sequelize } = require("sequelize");

const DB_NAME = process.env.DB_DATABASE || "Greyfoundr";
const DB_USER = process.env.DB_USER || "username";
const DB_PASSWORD = process.env.DB_PASSWORD || "password";
const DB_HOST = process.env.DB_HOST || "31.97.211.112";
const DB_PORT = process.env.DB_PORT || 6379;

const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
  host: DB_HOST,
  port: DB_PORT,
  dialect: "mysql",
  logging: false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  dialectOptions: {
    charset: "utf8mb4",
  },
  define: {
    charset: "utf8mb4",
    collate: "utf8mb4_bin",
    timestamps: true,
    underscored: true,
  },
});

module.exports = sequelize;
