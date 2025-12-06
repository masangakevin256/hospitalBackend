const {getDb} = require("../model/hospitalDb");
const {ObjectId} = require("mongodb");

const getCareGiverTasks = async(req, res) => {
  try {
    const db = getDb();
    const user = req.user;
    const careGiverId = user.careGiverId;

    const careGiver = await db.collection("careGivers").findOne({careGiverId: careGiverId});
    if(!careGiver) return res.status(404).json({message: "Caregiver not found"});

    const tasks = await db.collection("tasks").find({careGiverId: careGiverId}).sort({createdAt: -1}).toArray();
    res.status(200).json(tasks);
  } catch (error) {
    console.error(error);
    return res.status(500).json({message: "Server error"});
  }
}

const getPatientTask = async (req, res) => {
  try {
    const user = req.user;
    if (!user || !user.patientId) {
      return res.status(400).json({ message: "Invalid user or patient ID" });
    }

    const patientId = user.patientId;
    const db = getDb();

    const patient = await db.collection("patients").findOne({ patientId });
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    const tasks = await db.collection("tasks")
      .find({ patientId })
      .sort({ createdAt: -1 })
      .toArray();

    return res.status(200).json(tasks);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

const addNewTask = async (req,res) => {
  try {
    const {title, patientId, priority, description, date, status} = req.body;
    const db = getDb();

    if(!title || !patientId || !priority || !description || !date) return res.status(400).json({message: "All fields are required"});

    const user = req.user;
    const careGiverId = user.careGiverId;

    const careGiver = await  db.collection("careGivers").findOne({careGiverId: careGiverId});
    if(!careGiver) return res.status(404).json({message: "Caregiver not found"});

    const patient = await db.collection("patients").findOne({patientId: patientId});
    if(!patient) return res.status(404).json({message: "Patient not found"});

    const patientName = patient.name;

    if(careGiver.name !== patient.assignedCareGiver.name) return res.status(403).json({message: "Access denied: not assigned to this patient"});

    const taskFormat = {
      title,
      patientId,
      patientName,
      careGiverId,
      priority,
      status: status || "pending",
      description,
      date,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    await db.collection("tasks").insertOne(taskFormat);
    res.status(200).json({"message": "Task added successfully"});
  } catch (error) {
    console.error(error);
    return res.status(500).json({message: "Server error"});
  }
}

const updateTask = async (req, res) => {
  try {
    const update = req.body;
    const {id} = req.params;
    const user = req.user;
    const careGiverId = user.careGiverId;
    const db = getDb();

    if(!id) return res.status(400).json({"message": "Task id required to continue"});
    if(!update) return res.status(400).json({"message": "Updates required to continue"});

    const careGiver = await db.collection("careGivers").findOne({careGiverId: careGiverId});
    const task = await db.collection("tasks").findOne({_id: new ObjectId(id)});

    if(task.careGiverId !== careGiverId) return res.status(403).json({"message": "Access denied"});
    if(!task) return res.status(404).json({"message": "Task not found"});

    const results = await db.collection("tasks").updateOne({_id: new ObjectId(id)}, {$set: update});
    if(results.modifiedCount === 0) return res.status(400).json({"message": "Task wasn't updated"});

    res.status(200).json({"message": "Task updated successfully"});
  } catch (error) {
    console.error(error);
    return res.status(500).json({message: "Server error"});
  }
}

const patchTask = async (req, res) => {
  try {
    const update = req.body;
    const {id} = req.params;
    const user = req.user;
    const careGiverId = user.careGiverId;
    const db = getDb();

    if(!id) return res.status(400).json({"message": "Task id required to continue"});
    if(!update) return res.status(400).json({"message": "Updates required to continue"});

    const careGiver = await db.collection("careGivers").findOne({careGiverId: careGiverId});
    const task = await db.collection("tasks").findOne({_id: new ObjectId(id)});

    if(task.careGiverId !== careGiverId) return res.status(403).json({"message": "Access denied"});
    if(!task) return res.status(404).json({"message": "Task not found"});

    const results = await db.collection("tasks").updateOne({_id: new ObjectId(id)}, {$set: update});
    if(results.modifiedCount === 0) return res.status(400).json({"message": "Task wasn't updated"});

    res.status(200).json({"message": "Task updated successfully"});
  } catch (error) {
    console.error(error);
    return res.status(500).json({message: "Server error"});
  }
}

const deleteTask = async (req,res) => {
  try {
    const {id} = req.params;
    const user = req.user;
    const careGiverId = user.careGiverId;
    const db = getDb();

    if(!id) return res.status(400).json({"message": "Task id required to continue"});

    const careGiver = await db.collection("careGivers").findOne({careGiverId: careGiverId});
    const task = await db.collection("tasks").findOne({_id: new ObjectId(id)});

    if(task.careGiverId !== careGiverId) return res.status(403).json({"message": "Access denied"});
    if(!task) return res.status(404).json({"message": "Task not found"});

    const results = await db.collection("tasks").deleteOne({_id: new ObjectId(id)});
    if(results.deletedCount === 0) return res.status(400).json({"message": "Task wasn't deleted"});

    res.status(200).json({"message": "Task deleted successfully"});
  } catch (error) {
    console.error(error);
    return res.status(500).json({message: "Server error"});
  }
}

const getTask = async (req, res) => {
  try {
    const {id} = req.params;
    const user = req.user;
    const careGiverId = user.careGiverId;
    const db = getDb();

    if(!id) return res.status(400).json({"message": "Task id required to continue"});

    const careGiver = await db.collection("careGivers").findOne({careGiverId: careGiverId});
    const task = await db.collection("tasks").findOne({_id: new ObjectId(id)});

    if(task.careGiverId !== careGiverId) return res.status(403).json({"message": "Access denied"});
    if(!task) return res.status(404).json({"message": "Task not found"});

    res.status(200).json(task);
  } catch (error) {
    console.error(error);
    return res.status(500).json({message: "Server error"});
  }
}

module.exports = {
  getCareGiverTasks,
  addNewTask,
  updateTask,
  patchTask,
  deleteTask,
  getTask,
  getPatientTask
}