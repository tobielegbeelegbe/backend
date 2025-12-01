const express = require("express");
const { upload } = require("../../middleware");
const { uploadFile } = require("../../Controllers/uploadController");

const router = express.Router();

router.post("/image", upload.single("image"), uploadFile);

module.exports = router;
