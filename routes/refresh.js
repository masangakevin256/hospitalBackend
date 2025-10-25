const express = require("express");
const router = express.Router();
const ROLE_LIST = require("../config/role_list");
const verifyRoles = require("../middleware/verifyRoles");

router.post("/admins", require("../controller/handleAdminsRefreshTokens"));
router.post("/patients", require("../controller/handlePatientsRefreshTokens"));
router.post("/doctors", require("../controller/handleDoctorsRefreshTokens"));
router.post("/careGivers", require("../controller/handleCareGiverRefreshTokens"));
module.exports = router