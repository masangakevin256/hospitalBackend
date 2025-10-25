
const jwt = require("jsonwebtoken");
const {getDb} = require("../model/hospitalDb");

const handleCareGiversRefreshTokens = async (req,res) => {
    const db = getDb();
    const cookies = req.cookies;

    if (!cookies?.jwt) return res.status(401).json({ message: "No refresh token" });
    const refreshToken = cookies.jwt;

    const CareGiver = await db.collection("CareGivers").findOne({ refreshToken });
    if (!CareGiver) return res.status(403).json({ message: "Invalid refresh token" });

    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, decoded) => {
        // decoded should contain CareGiverInfo object matching how we sign it in login
        if (err || CareGiver.name !== decoded?.userInfo?.name)
            return res.status(403).json({ message: "Token verification failed" });

        const accessToken = jwt.sign(
            { userInfo: { name: CareGiver.name, roles: CareGiver.roles } },
            process.env.ACCESS_SECRET_TOKEN,
            { expiresIn: "10m" }
        );

        res.json({ accessToken });
    });
}
module.exports = handleCareGiversRefreshTokens