const {getDb} = require("../model/hospitalDb")
const handlePatientsLogout =async (req, res)=> {
    const db = getDb();
    const cookies = req.cookies;

    if (!cookies?.jwt) return res.sendStatus(204); // No content
    const refreshToken = cookies.jwt;

    const patient = await db.collection("patients").findOne({ refreshToken });
    if (patient) {
        await db.collection("patients").updateOne(
        { _id: user._id },
        { $unset: { refreshToken: "" } }
        );
    }

    res.clearCookie("jwt", { httpOnly: true, sameSite: "Strict" });
    res.json({ message: `${patient.username} Logout successfully`});
    console.log(`${patient.username} Logout successfully`);
   
}
module.exports = handlePatientsLogout