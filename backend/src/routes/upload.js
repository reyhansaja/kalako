import express from "express";
import { upload } from "../uploads/multerUpload.js";

const router = express.Router();

/** UPLOAD FOTO TOKO
 * POST /api/upload/store-photo
 * form-data:
 *   file: <image>
 */
router.post("/store-photo", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  const fileUrl = `/uploads/store_photos/${req.file.filename}`;

  res.json({
    message: "Upload berhasil",
    url: fileUrl,
  });
});

export default router;
