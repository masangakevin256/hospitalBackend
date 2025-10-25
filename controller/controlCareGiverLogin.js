const {getDb} = require("../model/hospitalDb");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const handleCareGiverLogin = async (req, res) => {
    const db = getDb()
    const {name, password} = req.body;

    if(!name || !password) {
        return res.status(400).json({"Message": "name and password required"})
    };

    const careGiver = await db.collection("careGivers").findOne({name: name});

    if(!careGiver){
        return res.status(401).json({"Message": `careGiver  ${name} does't exist!!`});
    }

    const match = await bcrypt.compare(password, careGiver.password);

    if(!match){
        return res.status(401).json({"Message": "Check password and log in again!!!"})
    }
   const accessToken = jwt.sign(
        {
            userInfo: {
                name: careGiver.name,
                roles: careGiver.roles ,
                careGiverId: careGiver.careGiverId
            }   
        },
        process.env.ACCESS_SECRET_TOKEN,
        {expiresIn: "10m"}
    )
    const refreshToken = jwt.sign(
        {
            userInfo: {
                name: careGiver.name,
                roles: careGiver.roles,
                careGiverId: careGiver.careGiverId
            }
        },
        process.env.REFRESH_TOKEN_SECRET,
        {expiresIn: "7d"}
    )
    await db.collection("careGivers").updateOne(
    { _id: careGiver._id },
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
        "Message": `careGiver ${careGiver.name} logged in successfully`,
        "roles": careGiver.roles
    });

}
module.exports = handleCareGiverLogin