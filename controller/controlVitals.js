const {getDb} = require("../model/hospitalDb");
const {format} = require("date-fns");

const recentVitals = async (req, res) => {
   const db = getDb();
  if (!db) return res.status(404).json({ message: "Database not initialized" });

  const user = req.user;

  try {
    let vitalsQuery = {};

    if (user.roles === "admin") {
      // Admin: see all vitals
      vitalsQuery = {};
    } 
    else if (user.roles === "doctor") {
      // Doctor: get patientIds where assignedDoctor.username = user.username
      const assignedPatients = await db
        .collection("patients")
        .find({ "assignedDoctor.name": user.username })
        .project({ patientId: 1 })
        .toArray();

      const patientIds = assignedPatients.map((p) => p.patientId);
      vitalsQuery = { patientId: { $in: patientIds } };
    } 
    else if (user.roles === "careGiver") {
      // Caregiver: get patientIds where assignedCareGiver.name = user.name
      const assignedPatients = await db
        .collection("patients")
        .find({ "assignedCareGiver.name": user.name })
        .project({ patientId: 1 })
        .toArray();

      const patientIds = assignedPatients.map((p) => p.patientId);
      vitalsQuery = { patientId: { $in: patientIds } };
    } 
    else if (user.roles === "patient") {
      // Patient: only own vitals
      vitalsQuery = { patientId: user.patientId };
    } 
    else {
      return res.status(403).json({ message: "Unauthorized role" });
    }

    const vitals = await db
      .collection("vitals")
      .find(vitalsQuery)
      .sort({ timestamp: -1 })
      .limit(10)
      .toArray();

    res.status(200).json(vitals);
  } catch (error) {
    console.error("Error fetching vitals:", error);
    res.status(500).json({ message: error.message });
  }
};


const addVitals = async (req, res) => {
  const user = req.user;
  const sendVitalAlertEmail = require("../utils/sendVitalEmail");
  const handleAllUsersInputs = require("./controlAllUsersInputs");
  const { getDb } = require("../model/hospitalDb");
  const { format } = require("date-fns");

  const db = getDb();
  const {
    patientId,
    bloodPressure,
    glucoseLevel,
    heartRate,
    temperature,
    oxygenSaturation,
    respiratoryRate,
    weight,
    height,
    bmi,
    notes,
    status
  } = req.body;

  if (!patientId || !bloodPressure || !glucoseLevel || !heartRate) {
    return res.status(400).json({
      message: "Patient ID, blood pressure, glucose level, and heart rate are required",
    });
  }

  try {
    //  Find patient
    const patient = await db.collection("patients").findOne({ patientId });
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }
    //check if its the patient sending alert
    //if he/she is a patient and the patientId is not the same can't send the vital
    if (user.roles === "patient" && user.patientId !== patientId) {
      return res.status(403).json({ message: "Unauthorized to send this vital" });
    }

    //  Try find doctor assigned to this patient (by ID instead of name)
    const doctor = await db.collection("doctors").findOne({
      assignedPatients: { $in: [patient.patientId] },
    });

    //  Create vitals object
    const vitalsDoc = {
      patientId,
      bloodPressure,
      glucoseLevel,
      heartRate,
      temperature,
      oxygenSaturation,
      respiratoryRate,
      weight,
      height,
      bmi,
      notes,
      timestamp: format(new Date(), "yyyy/MM/dd HH:mm:ss"),
    };

    // Validate input
    const { error } = handleAllUsersInputs.validateVitalInput(vitalsDoc);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    // Save to DB
    await db.collection("patients").updateOne(
      { patientId },
      { $push: { vitals: { glucoseLevel, bloodPressure } } }
    );
    await db.collection("patients").updateOne(
      { patientId },
      { $set: { height: vitalsDoc.height, weight: vitalsDoc.weight, lastHeartRate: vitalsDoc.heartRate } }
    );

    await db.collection("vitals").insertOne(vitalsDoc);

    //  Detect abnormal vitals
    const [systolic, diastolic] = bloodPressure.split("/").map(Number);
    const glucose = parseFloat(glucoseLevel);
    const heart = parseInt(heartRate);

    let alertType = null;
    let message = "";

    if (systolic > 140 || diastolic > 90) {
      alertType = "High Blood Pressure";
      message = `Patient ${patient.name} has high blood pressure: ${bloodPressure}`;
    } else if (glucose > 7.8) {
      alertType = "High Glucose Level";
      message = `Patient ${patient.name} has high glucose level: ${glucoseLevel}`;
    } else if (heart < 50 || heart > 100) {
      alertType = "Abnormal Heart Rate";
      message = `Patient ${patient.name} has abnormal heart rate: ${heartRate}`;
    }

    //  Handle alert & email (only if doctor exists)
    if (alertType) {
      const alertDoc = {
        patientId,
        alertType,
        message,
        weight,
        height,
        status: status || "pending",
        timestamp: format(new Date(), "yyyy/MM/dd HH:mm:ss"),
      };

      await db.collection("alerts").insertOne(alertDoc);
      await db.collection("patients").updateOne(
        { patientId },
        { $push: { alerts: alertDoc } }
      );

      // ✅ Send email if doctor found
      if (doctor && doctor.email) {
        await sendVitalAlertEmail(
          patient,
          {
            alertType,
            message,
            timestamp: new Date().toLocaleString(),
          },
          doctor.email
        );
      } else {
        console.warn(` No assigned doctor found for patient ${patientId}`);
      }
    }

    res.status(201).json({
      message: "Vitals recorded successfully",
      alert: alertType ? "Alert created" : "Vitals normal",
    });
  } catch (error) {
    console.error("addVitals error:", error);
    res.status(500).json({ message: error.message });
  }
};

const deleteVital = async (req,res) => {
    const db = getDb();
    const {id} = req.params;
    if(!db) return res.status(404).json({"message": "Database not initialized"});
    if(!id) return res.status(404).json({"message": "Id of the vital required to continue"});

    try {
        const vital = await db.collection("vitals").findOne({_id: new ObjectId(id)});
        if(!vital) return res.status(404).json({"message": `cannot find vital with that ${id}`});

        const results = await db.collection("vitals").deleteOne({_id: new ObjectId(id)});


        if(results.deletedCount === 0) return res.status(400).json({"message": `vital with id ${id} wasn't deleted`});

        res.status(200).json({"message": `Deleted vital with this id ${id}`});
    } catch (error) {
        res.status(500).json({"message": `${error.message}`});
    }
}

module.exports = {
  addVitals,
  recentVitals,
  deleteVital
}
