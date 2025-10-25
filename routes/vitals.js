const express = require("express");
const router = express.Router();
const controlVitals = require("../controller/controlVitals")
const ROLE_LIST = require("../config/role_list");
const verifyRoles = require("../middleware/verifyRoles");


router.get("/",verifyRoles(ROLE_LIST.Admin,ROLE_LIST.Doctor, ROLE_LIST.CareGiver, ROLE_LIST.Patient), controlVitals.recentVitals);
router.post("/", verifyRoles(ROLE_LIST.Admin, ROLE_LIST.Doctor, ROLE_LIST.CareGiver, ROLE_LIST.Patient), controlVitals.addVitals);
router.delete("/", verifyRoles(ROLE_LIST.Admin, ROLE_LIST.Doctor, ROLE_LIST.CareGiver) ,controlVitals.deleteVital);

module.exports = router