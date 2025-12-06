const express = require("express");
const router = express.Router();
const ROLE_LIST = require("../config/role_list");
const verifyRoles = require("../middleware/verifyRoles");
const controlCareGiverTasks = require("../controller/controlCareGiverTask");

router.get("/", verifyRoles(ROLE_LIST.CareGiver), controlCareGiverTasks.getCareGiverTasks);
router.get("/patient", verifyRoles(ROLE_LIST.Patient), controlCareGiverTasks.getPatientTask);
router.post("/", verifyRoles(ROLE_LIST.CareGiver), controlCareGiverTasks.addNewTask);
router.put("/:id", verifyRoles(ROLE_LIST.CareGiver), controlCareGiverTasks.updateTask);
router.patch("/:id", verifyRoles(ROLE_LIST.CareGiver), controlCareGiverTasks.patchTask);
router.delete("/:id", verifyRoles(ROLE_LIST.CareGiver), controlCareGiverTasks.deleteTask);
router.get("/:id", verifyRoles(ROLE_LIST.CareGiver), controlCareGiverTasks.getTask);    


module.exports = router;
