const express = require("express");
const router = express.Router();
const handlePatients = require("../controller/handlePatients");
const ROLE_LIST = require("../config/role_list");
const verifyRoles = require("../middleware/verifyRoles");
// const verifyJwt = require("../middleware/verifyJwt");

router.get("/",verifyRoles(ROLE_LIST.Admin, ROLE_LIST.Doctor, ROLE_LIST.CareGiver, ROLE_LIST.Patient), handlePatients.getAllPatients);
router.get("/assignedDoctor",verifyRoles( ROLE_LIST.Doctor), handlePatients.getAllPatientsDoctor);
router.post("/", verifyRoles(ROLE_LIST.Admin, ROLE_LIST.Doctor), handlePatients.addNewPatient);
router.put("/:id", verifyRoles(ROLE_LIST.Admin, ROLE_LIST.Doctor, ROLE_LIST.CareGiver, ROLE_LIST.Patient), handlePatients.updatePatient);
router.delete("/:id",verifyRoles(ROLE_LIST.Admin), handlePatients.deletePatient);
router.get("/:id", verifyRoles(ROLE_LIST.Admin, ROLE_LIST.Doctor, ROLE_LIST.CareGiver, ROLE_LIST.Patient), handlePatients.getPatient);
module.exports = router