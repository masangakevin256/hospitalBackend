
const jwt = require("jsonwebtoken");
const {getDb} = require("../model/hospitalDb");

const handleDoctorsRefreshTokens = async (req,res) => {
    const db = getDb();
    const cookies = req.cookies;

    if (!cookies?.jwt) return res.status(401).json({ message: "No refresh token" });
    const refreshToken = cookies.jwt;

    const doctor = await db.collection("doctors").findOne({ refreshToken });
    if (!doctor) return res.status(403).json({ message: "Invalid refresh token" });

    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, decoded) => {
        // decoded should contain doctorInfo object matching how we sign it in login
        if (err || doctor.username !== decoded?.userInfo?.username)
            return res.status(403).json({ message: "Token verification failed" });

        const accessToken = jwt.sign(
            { userInfo: { username: doctor.username, roles: doctor.roles } },
            process.env.ACCESS_SECRET_TOKEN,
            { expiresIn: "10m" }
        );

        res.json({ accessToken });
    });
}
module.exports = handleDoctorsRefreshTokens