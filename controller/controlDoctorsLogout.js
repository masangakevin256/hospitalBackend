const {getDb} = require("../model/hospitalDb")
const handleDoctorsLogout =async (req, res)=> {
    const db = getDb();
    const cookies = req.cookies;

    if (!cookies?.jwt) return res.sendStatus(204); // No content
    const refreshToken = cookies.jwt;

    const doctor = await db.collection("doctors").findOne({ refreshToken });
    if (doctor) {
        await db.collection("doctors").updateOne(
        { _id: user._id },
        { $unset: { refreshToken: "" } }
        );
    }

    res.clearCookie("jwt", { httpOnly: true, sameSite: "Strict" });
    res.json({ message: `${doctor.username} Logged  out successfully` });
    console.log(`${doctor.username} Logout successfully`);
   
}
module.exports = handleDoctorsLogout