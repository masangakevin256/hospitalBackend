const express = require("express");
const router = express.Router();
const handleCareGivers = require("../controller/handleCareGivers");
const ROLE_LIST = require("../config/role_list");
const verifyRoles = require("../middleware/verifyRoles");

router.get("/", verifyRoles(ROLE_LIST.Admin, ROLE_LIST.Doctor, ROLE_LIST.CareGiver, ROLE_LIST.Patient), handleCareGivers.getAllCareGivers);
router.post("/", verifyRoles(ROLE_LIST.Admin, ROLE_LIST.Doctor), handleCareGivers.addNewCareGiver);
router.put("/:id", verifyRoles(ROLE_LIST.Admin, ROLE_LIST.Doctor, ROLE_LIST.CareGiver), handleCareGivers.updateCareGiver);
router.delete("/:id",verifyRoles(ROLE_LIST.Admin), handleCareGivers.deleteCareGiver);
router.get("/:id", verifyRoles(ROLE_LIST.Admin, ROLE_LIST.Doctor), handleCareGivers.getCareGiver);
module.exports = router