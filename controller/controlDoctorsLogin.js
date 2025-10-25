const {getDb} = require("../model/hospitalDb");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const handleDoctorLogin = async (req, res) => {
    const db = getDb()
    const {username, password} = req.body;

    if(!username || !password) {
        return res.status(400).json({"Message": "username and password required"})
    };

    const doctor = await db.collection("doctors").findOne({username: username});

    if(!doctor){
        return res.status(401).json({"Message": `doctor  ${username} does't exist!!`});
    }

    const match = await bcrypt.compare(password, doctor.password);

    if(!match){
        return res.status(401).json({"Message": "Check password and log in again!!!"})
    }
   const accessToken = jwt.sign(
        {
            userInfo: {
                username: doctor.username,
                roles: doctor.roles   
            }   
        },
        process.env.ACCESS_SECRET_TOKEN,
        {expiresIn: "10m"}
    )
    const refreshToken = jwt.sign(
        {
            userInfo: {
                username: doctor.username,
                roles: doctor.roles
            }
        },
        process.env.REFRESH_TOKEN_SECRET,
        {expiresIn: "7d"}
    )
    await db.collection("doctors").updateOne(
    { _id: doctor._id },
    { $set: { refreshToken } }
  );
     res
    .cookie("jwt", refreshToken, {
      httpOnly: true,  // prevents JS access
      sameSite: "Strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    })
    res.status(200).json({
        accessToken: accessToken,
        "Message": `Doctor ${doctor.username} logged in successfully`,
        "roles": doctor.roles
    });

}
module.exports = handleDoctorLogin