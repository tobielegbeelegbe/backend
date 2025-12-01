const pool = require("../dbconnect");
const bcrypt = require("bcryptjs");

//const pool = await pools.getConnection();
class User {
  static async create(
    email,
    password,
    phone,
    code,
    first_name,
    last_name,
    profile_pic,
    rusername
  ) {
    const hashedPassword = await bcrypt.hash(password, 10);
    const username = email;
    //const sql = 'INSERT INTO `users`(`email`,`phone`, `password_hash`) VALUES (?,?,?,?,?)'
    const [result] = await pool.execute(
      "INSERT INTO users (email, password_hash, phone, username,verify_code, first_name, last_name, profile_pic, rusername) VALUES (?, ?,?,?,?,?,?,?,?)",
      [
        email,
        hashedPassword,
        phone,
        username,
        code,
        first_name,
        last_name,
        profile_pic,
        rusername,
      ]
    );

    return result.insertId;
  }

  static async updateDetails(id, first, last, username, rUsername) {
    //const sql = 'INSERT INTO `users`(`email`,`phone`, `password_hash`) VALUES (?,?,?,?,?)'
    const [result] = await pool.execute(
      "UPDATE users SET first_name = ?, last_name =?, username = ?, rusername = ? WHERE id = ?",
      [first, last, username, rUsername, id]
    );

    console.log(result);

    return result.insertId;
  }

  static async updateVerify(id) {
    let verify = 1;
    //const sql = 'INSERT INTO `users`(`email`,`phone`, `password_hash`) VALUES (?,?,?,?,?)'
    const [result] = await pool.execute(
      "UPDATE users SET verify = ? WHERE id = ?",
      [verify, id]
    );

    console.log(result);

    return result.insertId;
  }

  static async findAll() {
    const [rows] = await pool.execute("SELECT * FROM users");
    return rows;
  }

  static async findByEmail(email) {
    const [rows] = await pool.execute("SELECT * FROM users WHERE email = ?", [
      email,
    ]);
    return rows[0];
  }

  static async findById(id) {
    const [rows] = await pool.execute("SELECT * FROM users WHERE id = ?", [id]);
    return rows[0];
  }

  static async updateWalletBalance(id, amount) {
    await pool.execute(
      "UPDATE users SET wallet_balance = wallet_balance + ? WHERE id = ?",
      [amount, id]
    );
  }
}

module.exports = User;
