require("dotenv").config();
const path = require("path")
const express = require("express");
const { logger } = require("./middleware/logEvents");
const errorLog = require("./middleware/errorLog");
const {connectToDb, getDb} = require("./model/hospitalDb");
const corsOptions = require("./controller/controlCorsOptions");
const cors = require("cors");
const verifyJwt = require("./middleware/verifyJwt");
let db;
const app = express();
const PORT = process.env.PORT || 3500;

//custom middleware
app.use(logger)
app.use(cors(corsOptions));

//in built middleware
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(express.static(path.join(__dirname, "public")));

//routes 
//login
app.use("/login", require("./routes/login"));
//refresh
app.use("/refresh", require("./routes/refresh"));
// logout
app.use("/logout", require("./routes/logout"));
//registration routes
app.use("/register/admins", require("./routes/registerAdmins"));
app.use("/register/doctors", require("./routes/registerDoctors"));
// //patients only added by doctor or admin
app.use(verifyJwt);
// //handle alerts
app.use("/alerts", require("./routes/alerts"));
// //vitals
app.use("/vitals", require("./routes/vitals"));
// //profile
app.use("/profiles", require("./routes/profile"));

// //appointments
app.use("/appointments", require("./routes/appointments"));
// //getting single user 
app.use("/auth/me", require("./routes/authMe"));
// //get, update, delete routes
app.use("/admins", require("./routes/admins"));
app.use("/doctors", require("./routes/doctors"));
app.use("/patients", require("./routes/patients"));
app.use("/careGivers", require("./routes/careGivers"));

app.all(/.*/, (req, res) => {
    res.status(404);
    if(req.accepts("html")){
        res.sendFile(path.join(__dirname, "views", "404.html"));
    }else if(req.accepts("json")){
        res.json({message: "404 Not Found"})
    }else{
        res.type("txt").send("404 Not Found");
    } 
});
app.use(errorLog);

connectToDb((err) => {
  if (!err) {
    app.listen(PORT, () => {
      console.log(`Server listening on http://localhost:${PORT}.....`);
    });

    db = getDb(); 
    console.log("Database connection established");
  } else {
    console.error("Failed to connect to the database:", err);
  }
});