const express = require("express");
const router = express.Router();
const ROLE_LIST = require("../config/role_list");
const verifyRole = require("../middleware/verifyRoles");
const controlPrescription = require("../controller/controlPrescription");

router.get("/", verifyRole(ROLE_LIST.Doctor, ROLE_LIST.Patient, ROLE_LIST.Admin), controlPrescription.getAllPrescription);
router.post("/", verifyRole(ROLE_LIST.Doctor), controlPrescription.addPrescription);
router.put("/:id", verifyRole(ROLE_LIST.Doctor,ROLE_LIST.Patient), controlPrescription.updatePrescription);
router.patch("/:id", verifyRole(ROLE_LIST.Doctor,ROLE_LIST.Patient), controlPrescription.patchPrescription);
router.delete("/:id", verifyRole(ROLE_LIST.Doctor), controlPrescription.deletePrescription);
router.get("/:id", verifyRole(ROLE_LIST.Doctor, ROLE_LIST.Patient), controlPrescription.getPrescription);


module.exports = router