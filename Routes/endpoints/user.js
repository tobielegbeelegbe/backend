const express = require("express");
const router = express.Router();
const multer = require('multer');

const {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} = require("../../Controllers/UserController");

router.use(express.urlencoded({ extended: true }));
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Routes
router.get("/", getUsers);
router.get("/getUser/:id", getUserById);
router.post("/createUser", createUser);
router.put("/updateUser/:id",upload.array('image',10), updateUser);
router.delete("/deleteUser:id", deleteUser);

module.exports = router;
