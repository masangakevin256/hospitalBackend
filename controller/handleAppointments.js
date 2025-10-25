const { getDb } = require("../model/hospitalDb");
const { format } = require("date-fns");
const { ObjectId } = require("mongodb");


const getAllAppointments = async (req, res) => {
  const db = getDb();
  const user = req.user;
  const role = user.roles?.toLowerCase?.();

  try {
    let query = {};

    //  Doctors only see their assigned appointments' appointments
    if (role === "doctor") {
      query = { "assignedDoctor": user.username };
    }

    // Caregivers only see their assigned appointments' appointments
    else if (role === "caregiver") {
      query = { "assignedCareGiver": user.name };
    }else if (role === "patient"){
      const patient = await db.collection("patients").findOne({ name: user.name });
      query = {"patientId": patient.patientId}
    }

    // Admins see all appointments (query remains {})

    const appointments = await db.collection("appointments").find(query).toArray();

    // Sort numerically by appointmentId (e.g., AP001, AP010)
    appointments.sort((a, b) => {
      const numA = parseInt(a.appointmentId?.slice(2) || 0);
      const numB = parseInt(b.appointmentId?.slice(2) || 0);
      return numA - numB;
    });

    res.status(200).json(appointments);
  } catch (error) {
    console.error("Error fetching appointments:", error);
    res.status(500).json({ message: "Failed to fetch appointments" });
  }
};


const addNewAppointment = async (req, res) => {
  const handleAllUsersInput = require("../controller/controlAllUsersInputs");
  const db = getDb();
  const {
    patientId,
    patientName,
    date,
    time,
    duration,
    type,
    reason,
    notes,
    status,
  } = req.body;

    if (!patientId) {
      return res.status(400).json({ message: "Patient id required" });
    }

  try {
    //  Generate appointment ID
    const total = await db.collection("appointments").countDocuments();
    const appointmentId = `AP${String(total + 1).padStart(3, "0")}`;
    //  Find appointment and their assigned doctor + caregiver
    const patient = await db.collection("patients").findOne({ patientId });
    if (!patient) {
      return res.status(400).json({ message: "Invalid patient ID" });
    }
    const assignedDoctor = patient.assignedDoctor.name;
    const assignedCareGiver = patient.assignedCareGiver.name;
    // Prevent duplicate active appointments for the same appointment
    const existingAppointment = await db.collection("appointments").findOne({
      appointmentId,
      status: { $in: ["Pending", "Scheduled"] },
    });
    if (existingAppointment) {
      return res.status(400).json({ message: "appointment already has an active appointment" });
    }

    //  Prepare appointment record
    const newAppointment = {
      patientId:patientId,
      appointmentId: appointmentId,
      patientName: patient.name,
      assignedDoctor: assignedDoctor,
      assignedCareGiver: assignedCareGiver,
      date:date,
      time: time,
      duration: duration || "Not specified",
      type: type,
      notes: notes,
      reason: reason,
      status: status || "Pending",
      createdAt: format(new Date(), "yyyy/MM/dd HH:mm:ss"),
      updatedAt: format(new Date(), "yyyy/MM/dd HH:mm:ss"),
    };

    // // Validate with Joi
    // const { error } = handleAllUsersInput.validateAppointmentInput(newAppointment);
    // if (error) {
    //   return res.status(400).json({ message: error.details[0].message });
    // }

    // Insert into DB
    await db.collection("appointments").insertOne(newAppointment);

    res.status(201).json({
      message: "Appointment created successfully",
      appointment: newAppointment,
    });
  } catch (error) {
    console.error("Error creating appointment:", error);
    res.status(500).json({ message: "Failed to create appointment" });
  }
};


const getAppointmentById = async (req, res) => {
  const db = getDb();
  const { id } = req.params;

  try {
    const appointment = await db.collection("appointments").findOne({  _id: new ObjectId(id)  });
    if (!appointment)
      return res.status(404).json({ message: "Appointment not found" });

    res.status(200).json(appointment);
  } catch (error) {
    console.error("Error getting appointment:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const updateAppointment = async (req, res) => {
  const db = getDb();
    const { id } = req.params;
    const updates = req.body;
    const user = req.user
  
    if (!db) return res.status(404).json({ message: "Database not initialized" });
    if (!id) return res.status(400).json({ message: "appointment ID required" });
    if (!updates || Object.keys(updates).length === 0)
      return res.status(400).json({ message: "No updates provided" });
  
    try {
      
      
      const appointment = await db.collection("appointments").findOne({ _id: new ObjectId(id) });
      if (!appointment) return res.status(404).json({ message: "appointment not found" });
      
      const results = await db.collection("appointments").updateOne({ _id: new ObjectId(id) }, {$set: updates})
  
      if (results.modifiedCount === 0) {
        return res.status(404).json({ message: "appointment wasn't updated" });
      }
  
      res.status(200).json({ message: `appointment updated successfully` });
  
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
};


const deleteAppointment = async (req, res) => {
  const db = getDb();
  const { id } = req.params;

  try {
    const appointment = await db.collection("appointments").findOne({  _id: new ObjectId(id)  });
    if (!appointment)
      return res.status(404).json({ message: "Appointment not found" });

    await db.collection("appointments").deleteOne({  _id: new ObjectId(id)  });

    res.status(200).json({ message: "Appointment deleted successfully" });
  } catch (error) {
    console.error("Error deleting appointment:", error);
    res.status(500).json({ message: "Failed to delete appointment" });
  }
};

module.exports = {
  getAllAppointments,
  addNewAppointment,
  getAppointmentById,
  updateAppointment,
  deleteAppointment,
};
