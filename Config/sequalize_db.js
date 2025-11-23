const {Sequelize, DataTypes} = require("sequelize");

const sequelize = new Sequelize(
   'nooraan1_greyfoundr',
   'nooraan1_greyfoundr',
   'SY8sgDCE4HXD',
    {
      host: '209.172.2.60',
      dialect: 'mysql'
    }
  );



// sequelize.sync({ alter: true })
//   .then(() => console.log("Database synchronized"))
//   .catch((err) => console.error("Sync error", err));


  module.exports = sequelize;