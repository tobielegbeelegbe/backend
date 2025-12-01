require("dotenv").config();

module.exports = {
  development: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 6379,
    dialect: "mysql",
    dialectOptions: {
      charset: "utf8mb4",
      collate: "utf8mb4_bin",
    },
    define: {
      charset: "utf8mb4",
      collate: "utf8mb4_bin",
      timestamps: true,
      underscored: true,
    },
  },
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 6379,
    dialect: "mysql",
    dialectOptions: {
      charset: "utf8mb4",
      collate: "utf8mb4_bin",
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
    define: {
      charset: "utf8mb4",
      collate: "utf8mb4_bin",
      timestamps: true,
      underscored: true,
    },
  },
};
