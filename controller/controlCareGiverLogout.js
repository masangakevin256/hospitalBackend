const {getDb} = require("../model/hospitalDb")
const handleCareGiversLogout =async (req, res)=> {
    const db = getDb();
    const cookies = req.cookies;

    if (!cookies?.jwt) return res.sendStatus(204) // No content
    const refreshToken = cookies.jwt;

    const careGiver = await db.collection("careGivers").findOne({ refreshToken });
    if (careGiver) {
        await db.collection("careGivers").updateOne(
        { _id: user._id },
        { $unset: { refreshToken: "" } }
        );
    }

    res.clearCookie("jwt", { httpOnly: true, sameSite: "Strict" });
    res.json({ message: `${careGiver.username} Logout successfully`});
    console.log(`${careGiver.username} Logout successfully`);
   
}
module.exports = handleCareGiversLogout