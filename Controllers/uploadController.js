const cloudinary = require("../Config/cloudinary");

const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const stream = cloudinary.uploader.upload_stream(
      { folder: "greyfoundr" },
      (error, result) => {
        if (error) {
          console.error(error);
          return res.status(500).json({ error: "Cloud upload failed" });
        }

        return res.json({
          url: result.secure_url,
          public_id: result.public_id,
        });
      }
    );

    stream.end(req.file.buffer);
  } catch (error) {
    console.error("Upload error:", error);
    return res.status(500).json({ error: error.message });
  }
};

module.exports = { uploadFile };
