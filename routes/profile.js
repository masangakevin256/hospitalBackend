const express = require("express");
const router = express.Router();
const { uploadProfilePicture, getProfilePicture, deleteProfilePicture } = require("../controller/profileController");
const ROLE_LIST = require("../config/role_list");
const verifyRoles = require("../middleware/verifyRoles");

router.post("/upload",verifyRoles(ROLE_LIST.Admin, ROLE_LIST.Doctor, ROLE_LIST.CareGiver, ROLE_LIST.Patient), uploadProfilePicture);
router.get("/", verifyRoles(ROLE_LIST.Admin, ROLE_LIST.Doctor, ROLE_LIST.CareGiver, ROLE_LIST.Patient), getProfilePicture);
router.delete("/delete", verifyRoles(ROLE_LIST.Admin, ROLE_LIST.Doctor, ROLE_LIST.CareGiver, ROLE_LIST.Patient), deleteProfilePicture);

module.exports = router;
