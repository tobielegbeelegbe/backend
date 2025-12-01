const express = require("express");
const router = express.Router();
const con = require("../../dbconnect");
const {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} = require("../../Controllers/UserController");

router.use(express.urlencoded({ extended: true }));

// Routes
router.get("/", getUsers);
router.get("/getUser/:id", getUserById);
router.post("/createUser", createUser);
router.put("/updateUser/:id", updateUser);
router.delete("/deleteUser:id", deleteUser);

module.exports = router;
