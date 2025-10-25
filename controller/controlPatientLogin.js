const {getDb} = require("../model/hospitalDb");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const handlePatientLogin = async (req, res) => {
    const db = getDb()
    const {name, password} = req.body;

    if(!name || !password) {
        return res.status(400).json({"message": "name and password required"})
    };

    const patient = await db.collection("patients").findOne({name: name});

    if(!patient){
        return res.status(401).json({"message": `patient  ${name} does't exist!!`});
    }

    const match = await bcrypt.compare(password, patient.password);

    if(!match){
        return res.status(401).json({"message": "Check password and log in again!!!"})
    }
   const accessToken = jwt.sign(
        {
            userInfo: {
                name: patient.name,
                roles: patient.roles   
            }   
        },
        process.env.ACCESS_SECRET_TOKEN,
        {expiresIn: "10m"}
    )
    const refreshToken = jwt.sign(
        {
            userInfo: {
                name: patient.name,
                roles: patient.roles,
                patientId: patient.patientId
            }
        },
        process.env.REFRESH_TOKEN_SECRET,
        {expiresIn: "7d"}
    )
    await db.collection("patients").updateOne(
    { _id: patient._id },
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
        "message": `patient ${patient.name} logged in successfully`,
        "roles": patient.roles,
        patientId: patient.patientId
    });

}
module.exports = handlePatientLogin