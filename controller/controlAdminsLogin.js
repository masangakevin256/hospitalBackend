const {getDb} = require("../model/hospitalDb");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const handleAdminLogin = async (req, res) => {
    const db = getDb()
    const {username, password} = req.body;

    if(!username || !password) {
        return res.status(400).json({"message": "username and password required"})
    };

    const admin = await db.collection("admins").findOne({username: username});

    if(!admin){
        return res.status(401).json({"message": `admin  ${username} does't exist!!`});
    }

    const match = await bcrypt.compare(password, admin.password);

    if(!match){
        return res.status(401).json({"message": "Check password and log in again!!!"})
    }
   const accessToken = jwt.sign(
        {
            userInfo: {
                username: admin.username,
                roles: admin.roles   
            }   
        },
        process.env.ACCESS_SECRET_TOKEN,
        {expiresIn: "10m"}
    )
    const refreshToken = jwt.sign(
        {
            userInfo: {
                username: admin.username,
                roles: admin.roles
            }
        },
        process.env.REFRESH_TOKEN_SECRET,
        {expiresIn: "7d"}
    )
    await db.collection("admins").updateOne(
    { _id: admin._id },
    { $set: { refreshToken } }
  );
     res
    .cookie("jwt", refreshToken, {
      httpOnly: true,  // prevents JS access
      sameSite: "Strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    })
    res.status(200).json({
    accessToken,
    admin: {
        
        username: admin.username,
        roles: admin.roles
    },
    message: `Admin ${admin.username} logged in successfully`,
    roles: admin.roles
    });

}
module.exports = handleAdminLogin