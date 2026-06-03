export function uploadStorePhoto(req, res) {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  const fileUrl = `/uploads/store_photos/${req.file.filename}`;
  return res.json({ message: "Upload berhasil", url: fileUrl });
}
