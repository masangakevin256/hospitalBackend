//sending error file 

const express = require("express");
const router = express.Router();
const path = require("path");
router.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, ".." ,"views", "404.html"));
});

module.exports = router;