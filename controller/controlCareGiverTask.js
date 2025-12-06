const {getDb} = require("../model/hospitalDb");
const {ObjectId} = require("mongodb");


const getCareGiverTasks = async(req, res) => {
    const db = getDb();
    const user = req.user;
    // console.log(user);
    const careGiverId = user.careGiverId;

    const careGiver = db.collection("careGivers").findOne({careGiverId: careGiverId});

    if(!careGiver) return res.status(404).json({message: "Caregiver not found"});


    const tasks = await db.collection("tasks").find({careGiverId: careGiverId}).sort({createdAt: -1}).toArray();

    res.status(200).json(tasks);



    
}
const addNewTask = async (req,res) => {
    const {title, patientId, priority, description, date, status} = req.body;
    const db = getDb()

    if(!title || !patientId || !priority || !description || !date) return res.status(400).json({message: "All fields are required"});

    const user = req.user;
    const careGiverId = user.careGiverId;

    const careGiver = await  db.collection("careGivers").findOne({careGiverId: careGiverId});

    if(!careGiver) return res.status(404).json({message: "Caregiver not found"});

    const patient = await db.collection("patients").findOne({patientId: patientId});

    if(!patient) return res.status(404).json({message: "Patient not found"});

    const patientName = patient.name;

    
    console.log(careGiver.name)
    console.log(patient.assignedCareGiver.name)

    if(careGiver.name !== patient.assignedCareGiver.name) return res.status(403).json({message: "Access denied: not assigned to this patient"});

    const taskFormat = {
        title: title,
        patientId: patientId,
        patientName: patientName,
        careGiverId: careGiverId,
        priority: priority,
        status: status || "pending",
        description: description,
        date: date,
        createdAt: new Date(),
        updatedAt: new Date()
    }

    const task = await db.collection("tasks").insertOne(taskFormat);

    res.status(200).json({"message": "Task added successfully"})

}

const updateTask = async (req, res) => {
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
}
const patchTask = async (req, res) => {
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
}
const deleteTask = async (req,res) => {
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

}
const getTask = async (req, res) => {
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
}
module.exports = {
    getCareGiverTasks,
    addNewTask,
    updateTask,
    patchTask,
    deleteTask,
    getTask
}