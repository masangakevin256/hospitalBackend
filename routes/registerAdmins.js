const express = require("express");
const router = express.Router();
const addNewAdmin = require("../controller/controlAdminsRegistration")
router.post("/", addNewAdmin);
module.exports = router