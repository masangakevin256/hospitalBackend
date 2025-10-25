const express = require("express");
const router = express.Router();
const handleAppointments = require("../controller/handleAppointments");
const ROLE_LIST = require("../config/role_list");
const verifyRoles = require("../middleware/verifyRoles");

router.get("/",verifyRoles(ROLE_LIST.Admin, ROLE_LIST.Doctor, ROLE_LIST.CareGiver, ROLE_LIST.Patient) ,handleAppointments.getAllAppointments);
router.post("/",verifyRoles(ROLE_LIST.Admin, ROLE_LIST.Doctor, ROLE_LIST.CareGiver, ROLE_LIST.Patient) ,handleAppointments.addNewAppointment);
router.put("/:id", verifyRoles(ROLE_LIST.Admin, ROLE_LIST.Doctor) ,handleAppointments.updateAppointment);
router.delete("/:id",verifyRoles(ROLE_LIST.Admin, ROLE_LIST.Doctor, ROLE_LIST.CareGiver) , handleAppointments.deleteAppointment);
router.get("/:id",verifyRoles(ROLE_LIST.Admin, ROLE_LIST.Doctor, ROLE_LIST.CareGiver, ROLE_LIST.Patient) , handleAppointments.getAppointmentById);
module.exports = router