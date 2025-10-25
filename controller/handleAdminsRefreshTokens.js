
const jwt = require("jsonwebtoken");
const {getDb} = require("../model/hospitalDb");

const handleAdminsRefreshTokens = async (req,res) => {
    const db = getDb();
    const cookies = req.cookies;

    if (!cookies?.jwt) return res.status(401).json({ message: "No refresh token" });
    const refreshToken = cookies.jwt;

    const admin = await db.collection("admins").findOne({ refreshToken });
    if (!admin) return res.status(403).json({ message: "Invalid refresh token" });

    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, decoded) => {
        // decoded should contain adminInfo object matching how we sign it in login
        if (err || admin.username !== decoded?.userInfo?.username)
            return res.status(403).json({ message: "Token verification failed" });

        const accessToken = jwt.sign(
            { userInfo: { username: admin.username, roles: admin.roles } },
            process.env.ACCESS_SECRET_TOKEN,
            { expiresIn: "10m" }
        );

        res.json({ accessToken });
    });
}
module.exports = handleAdminsRefreshTokens