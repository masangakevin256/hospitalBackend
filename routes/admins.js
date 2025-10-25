const express = require("express");
const router = express.Router();
const handleAdmins = require("../controller/handleAdmins");
const ROLE_LIST = require("../config/role_list");
const verifyRoles = require("../middleware/verifyRoles");

router.get("/",verifyRoles(ROLE_LIST.Admin), handleAdmins.getAllAdmins);
router.put("/:id", verifyRoles(ROLE_LIST.Admin), handleAdmins.updateAdmin);
router.delete("/:id",verifyRoles(ROLE_LIST.Admin), handleAdmins.deleteAdmin);
router.get("/:id",verifyRoles(ROLE_LIST.Admin), handleAdmins.getAdmin);
module.exports = router