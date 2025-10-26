// controllers/authController.js
const { CareGiver } = require("../config/role_list");
const {getDb} = require("../model/hospitalDb");
const getMe = async (req, res) => {
  const db = getDb();
  const user = req.user; // extracted from JWT
  // console.log(user)

  try {
    let data;

       if (user.roles === "admin") {
        data = await db.collection("admins").findOne({ username: user.username });
      } else if (user.roles === "doctor") {
        data = await db.collection("doctors").findOne({ username: user.username });
      } else if (user.roles === "patient") {
        data = await db.collection("patients").findOne({ name: user.name });
      } else if (user.roles === "caregiver" || user.roles === "careGiver") {
        
        data = await db.collection("careGivers").findOne({ careGiverId: user.careGiverId });
      }


    if (!data) return res.status(404).json({ message: "User not found" });
    // console.log(data)
    // console.log(user)
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getMe };