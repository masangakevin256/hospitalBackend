const jwt = require("jsonwebtoken")
const verifyJwt = (req, res, next) => {
    const authHeader = req.headers.authorization || req.headers.Authorization;

    if(!authHeader){
        return res.sendStatus(401);
    }
    const token = authHeader.split(" ")[1];
    if(!token){
        return res.status(403).json({"Message": "Token to verify required"});
    }

   jwt.verify(
    token, process.env.ACCESS_SECRET_TOKEN, (error, decoded) => {
        if(error){
            return res.status(400).json({"Message": "Failed to verify tokens"});
        }
        req.user = decoded.userInfo
        next()
    }
   ) 
}
module.exports = verifyJwt