const {getDb} = require("../model/hospitalDb")
const handleAdminsLogout =async (req, res)=> {
    const db = getDb();
    const cookies = req.cookies;

    if (!cookies?.jwt) return res.sendStatus(204); // No content
    const refreshToken = cookies.jwt;

    const admin = await db.collection("admins").findOne({ refreshToken });
    if (admin) {
        await db.collection("admins").updateOne(
        { _id: user._id },
        { $unset: { refreshToken: "" } }
        );
    }

    res.clearCookie("jwt", { httpOnly: true, sameSite: "Strict" });
    res.json({ message: `${admin.username} Logout successfully`});
    console.log(`${admin.username} Logout successfully`);
   
}
module.exports = handleAdminsLogout