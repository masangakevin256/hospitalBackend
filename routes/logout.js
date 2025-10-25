const express = require("express");
const router = express.Router();

router.post("/admins", require("../controller/controlAdminsLogout"));
router.post("/doctors", require("../controller/controlDoctorsLogout"));
router.post("/patients", require("../controller/controlPatientsLogout"));
router.post("/careGivers", require("../controller/controlCareGiverLogout"));

module.exports = router