const { getDb } = require("../model/hospitalDb");
const { ObjectId } = require("mongodb");
const {format} = require("date-fns");

const getAllAlerts = async (req, res) => {
  const db = getDb();
  if (!db) return res.status(404).json({ message: "Database not initialized" });

  const user = req.user;
  // console.log("user", user);

  try {
    let alerts = [];

    //  Role-based filtering
    if (user.roles === "admin") {
      // admin sees everything
      alerts = await db.collection("alerts").find().toArray();
    } 
    else if (user.roles === "doctor") {
      // doctor sees alerts for patients assigned to them
      const patients = await db
        .collection("patients")
        .find({ "assignedDoctor.name": user.username })
        .project({ patientId: 1 })
        .toArray();

      const patientIds = patients.map(p => p.patientId);
      alerts = await db
        .collection("alerts")
        .find({ patientId: { $in: patientIds } })
        .toArray();
    } 
    else if (user.roles === "careGiver") {
      // caregiver sees alerts for patients assigned to them
      const patients = await db
        .collection("patients")
        .find({ "assignedCareGiver.name": user.name })
        .project({ patientId: 1 })
        .toArray();

      const patientIds = patients.map(p => p.patientId);
      alerts = await db
        .collection("alerts")
        .find({ patientId: { $in: patientIds } })
        .toArray();
    } 
    else if (user.roles === "patient") {
      // patient sees only their alerts
      alerts = await db
        .collection("alerts")
        .find({ patientId: user.patientId })
        .toArray();
    } 
    else {
      // if role is unknown
      return res.status(403).json({ message: "Unauthorized role" });
    }

    res.status(200).json(alerts);
  } catch (error) {
    console.error("Error fetching alerts:", error);
    res.status(500).json({ message: error.message });
  }
};

const addAlert = async (req, res) => {
  const handleAllUsersInputs = require("./controlAllUsersInputs");
  const db = getDb();
  const { patientId, alertType, message, status } = req.body;

  if (!patientId || !alertType || !message) {
    return res.status(400).json({ message: "patientId, alertType, and message are required" });
  }
  const patient = await db.collection("patients").findOne(
    {patientId: patientId}
  );
  if(!patient){
    return res.status(404).json({"message": `Patient id ${patientId} not found`})
  }
  try {
    const alertDoc = {
      "patientId": patientId,
      "alertType": alertType,
      "message": message,
      "status": status || "pending",
      "timeStamp": `${format(new Date() ,"yyyy/MM/dd  HH:mm:ss")}`
    };
    //validate doc alert input
    const {error} = handleAllUsersInputs.validateAlertInput(alertDoc);
    if(error){
      return res.status(400).json({"message": `${error.details[0].message}`})
    }
    const result = await db.collection("alerts").insertOne(alertDoc);
    //update to patient db collections
    await db.collection("patients").updateOne(
      {patientId: patientId},
      {$push: {alerts: alertDoc.message}}
    )
    // alert doctor
   await db.collection("doctors").updateOne(
      {assignedPatients: patient.name},
      {$push: {alerts: [
        {patientId: alertDoc.patientId},
        {message: alertDoc.message}
      ]}}
    )
    res.status(201).json({
      message: "Alert created and   successfully",
      alertId: result.insertedId,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
const updateAlert = async (req,res) => {
    const db = getDb();
    const {id} = req.params;
    const updates = req.body;
    if(!db) return res.status(404).json({"message": "Database not initialized"});
    if(!id) return res.status(404).json({"message": "Id of the alert required to continue"});
    if(!updates){
        return res.status(400).json({"message": "Updates required to continue!!!"});
    }

    try {
        //get alert with the id
        const alert = await db.collection("alerts").findOne({_id: new ObjectId(id)});
        if(!alert) return res.status(404).json({"message": `cannot find alert with that ${id}`})

        
        //update the alert
        const results = await db.collection("alerts").updateOne({_id: new ObjectId(id)}, {$set: updates});
        
       if (results.modifiedCount === 0) {
            return res.status(404).json({ "message": "alert wasn't updated" });
        }
         //send success message
        res.status(200).json({"message": `Updated alert with this id ${id}`});
    } catch (error) {
        res.status(500).json({"message": `${error.message}`});
    }
}
const deleteAlert = async (req,res) => {
    const db = getDb();
    const {id} = req.params;
    if(!db) return res.status(404).json({"message": "Database not initialized"});
    if(!id) return res.status(404).json({"message": "Id of the alert required to continue"});

    try {
        const alert = await db.collection("alerts").findOne({_id: new ObjectId(id)});
        if(!alert) return res.status(404).json({"message": `cannot find alert with that ${id}`});

        const results = await db.collection("alerts").deleteOne({_id: new ObjectId(id)});

        if(results.deletedCount === 0) return res.status(400).json({"message": `alert with id ${id} wasn't deleted`});

        res.status(200).json({"message": `Deleted alert with this id ${id}`});
    } catch (error) {
        res.status(500).json({"message": `${error.message}`});
    }
}
const getAlert = async (req,res) => {
    const db = getDb();
    const {id} = req.params;
    if(!db) return res.status(404).json({"message": "Database not initialized"});
    if(!id) return res.status(404).json({"message": "Id of the alert required to continue"});

    try {
        const alert = await db.collection("alerts").findOne({_id: new ObjectId(id)});
        if(!alert) return res.status(404).json({"message": `cannot find alert with that ${id}`});

        const results = await db.collection("alerts").findOne({_id: new ObjectId(id)});

        res.status(200).json(results);
    } catch (error) {
        res.status(500).json({"message": `${error.message}`});
    }
}

module.exports = {
  getAllAlerts,
  addAlert,
  updateAlert,
  deleteAlert,
  getAlert
}
