const express = require("express");
const router = express.Router();
const addNewDoctor = require("../controller/controlDoctorsRegister")
router.post("/", addNewDoctor);
module.exports = router