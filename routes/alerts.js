const express = require("express");
const router = express.Router();
const handleAlerts = require("../controller/controlAlerts");
const ROLE_LIST = require("../config/role_list");
const verifyRoles = require("../middleware/verifyRoles");

router.get("/",verifyRoles(ROLE_LIST.Admin, ROLE_LIST.Doctor, ROLE_LIST.CareGiver, ROLE_LIST.Patient) ,handleAlerts.getAllAlerts)
router.post("/", verifyRoles(ROLE_LIST.Admin,ROLE_LIST.Patient),handleAlerts.addAlert);
router.put("/:id", verifyRoles(ROLE_LIST.Admin,ROLE_LIST.Patient) ,handleAlerts.updateAlert);
router.delete("/:id",verifyRoles(ROLE_LIST.Admin,ROLE_LIST.Patient), handleAlerts.deleteAlert);
router.get("/:id",verifyRoles(ROLE_LIST.Admin,ROLE_LIST.Patient), handleAlerts.getAlert)

module.exports = router