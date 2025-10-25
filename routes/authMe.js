const express = require("express");
const router = express.Router();
const ROLE_LIST = require("../config/role_list");
const verifyRoles = require("../middleware/verifyRoles");
const controlGetMe = require("../controller/controlGetMe");

router.get("/", verifyRoles(ROLE_LIST.Admin, ROLE_LIST.Doctor, ROLE_LIST.CareGiver, ROLE_LIST.Patient), controlGetMe.getMe);

module.exports = router