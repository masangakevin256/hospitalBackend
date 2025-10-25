const express = require("express");
const router = express.Router();
const handleDoctors = require("../controller/handleDoctors");
const ROLE_LIST = require("../config/role_list");
const verifyRoles = require("../middleware/verifyRoles");

router.get("/",verifyRoles(ROLE_LIST.Admin, ROLE_LIST.Doctor, ROLE_LIST.CareGiver, ROLE_LIST.Patient) ,handleDoctors.getAllDoctors);
router.put("/:id", verifyRoles(ROLE_LIST.Admin, ROLE_LIST.Doctor) ,handleDoctors.updateDoctor);
router.delete("/:id",verifyRoles(ROLE_LIST.Admin) , handleDoctors.deleteDoctor);
router.get("/:id",verifyRoles(ROLE_LIST.Admin, ROLE_LIST.Doctor, ROLE_LIST.CareGiver, ROLE_LIST.Patient) , handleDoctors.getDoctor);
module.exports = router