const express = require("express");
const router = express.Router();

router.post("/admins", require("../controller/controlAdminsLogin"));
router.post("/doctors", require("../controller/controlDoctorsLogin"));
router.post("/patients", require("../controller/controlPatientLogin"));
router.post("/careGivers", require("../controller/controlCareGiverLogin"));

module.exports = router