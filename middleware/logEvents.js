const path = require("path");
const fs = require("fs");
const fsPromises = require("fs").promises;
const {v4:uuid} = require("uuid");
const {format} = require("date-fns");

const logEvents = async (message, logName) => {
    //check if log file exist
    if(!fs.existsSync(path.join(__dirname, "..", "log"))){
        await fsPromises.mkdir(path.join(__dirname, "..", "log"));
    }

    const timeItem = `${format(new Date() ,"yyyy:MM:dd\t HH:mm:ss")}`;
    const logItem = `${timeItem}: ${uuid()} ${message}\n`;
    
    await fsPromises.appendFile(path.join(__dirname, "..", "log", logName), logItem);
}
const logger = (req, res, next) => {
    // fire-and-forget logging; ensure any errors are caught so they don't crash the app
    logEvents(`${req.method}: ${req.headers.origin}: ${req.url}`, "logEvents.txt").catch(err => console.error("Log write failed:", err));
    console.log(`${req.method}:${req.url}`);
    next();
}

module.exports = {logEvents, logger}