const path = require("path");
const fs = require("fs");
const multer = require("multer");
const { getDb } = require("../model/hospitalDb");

// Setup multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/profile_pics/");
  },
  filename: (req, file, cb) => {
    const uniqueName = `${req.user.userId}_${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png/;
    const extname = allowed.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowed.test(file.mimetype);
    if (extname && mimetype) cb(null, true);
    else cb(new Error("Only .png, .jpg and .jpeg allowed!"));
  }
}).single("profilePic");

// Upload / Update Profile Picture
const uploadProfilePicture = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) return res.status(400).json({ message: err.message });

    const db = getDb();
    const user = req.user;
    const collection = db.collection(user.roles + "s"); // e.g. doctors, patients, caregivers

    try {
      // Find user in DB
      const existingUser = await collection.findOne({ username: user.username });
      if (!existingUser) return res.status(404).json({ message: "User not found" });

      // Delete old image if exists
      if (existingUser.profilePic && fs.existsSync(existingUser.profilePic)) {
        fs.unlinkSync(existingUser.profilePic);
      }

      // Save new image path
      const imagePath = req.file.path;
      await collection.updateOne(
        { username: user.username },
        { $set: { profilePic: imagePath } }
      );

      res.status(200).json({ message: "Profile picture uploaded successfully", imagePath });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
};

// Get Profile Picture
const getProfilePicture = async (req, res) => {
  const db = getDb();
  const user = req.user;
  const collection = db.collection(user.roles + "s");
  // console.log(user);
  // console.log(collection)

  try {
    const existingUser = await collection.findOne({ username: user.username });
    if (!existingUser || !existingUser.profilePic)
      return res.status(404).json({ message: "No profile picture found" });

    res.sendFile(path.resolve(existingUser.profilePic));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete Profile Picture
const deleteProfilePicture = async (req, res) => {
  const db = getDb();
  const user = req.user;
  const collection = db.collection(user.roles + "s");

  try {
    const existingUser = await collection.findOne({ username: user.username });
    if (!existingUser || !existingUser.profilePic)
      return res.status(404).json({ message: "No profile picture to delete" });

    // Delete file
    if (fs.existsSync(existingUser.profilePic)) fs.unlinkSync(existingUser.profilePic);

    // Remove from DB
    await collection.updateOne(
      { username: user.username },
      { $unset: { profilePic: "" } }
    );

    res.status(200).json({ message: "Profile picture deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  uploadProfilePicture,
  getProfilePicture,
  deleteProfilePicture,
};
