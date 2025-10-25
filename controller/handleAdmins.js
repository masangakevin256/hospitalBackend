const {getDb} = require("../model/hospitalDb");
const {format} = require("date-fns");
const bcrypt = require("bcrypt");
const { ObjectId } = require("mongodb");
const getAllAdmins =  async (req,res) => {
    const db = getDb();
    if(!db) return res.status(404).json({"message": "Database not initialized"});

    try {
        const admins = await db.collection("admins").find().toArray();
        admins.sort((a, b) => {
        const numA = parseInt(a.adminId.slice(2)); // removes "AD" and parses the number
        const numB = parseInt(b.adminId.slice(2));
        return numA - numB;
        });

        res.status(200).json(admins);
    } catch (error) {
        res.status(500).json({"message": "Failed to fetch admins"});
        
    }
}

const updateAdmin = async (req,res) => {
    const db = getDb();
    const {id} = req.params;
    const updates = req.body;
    if(!db) return res.status(404).json({"message": "Database not initialized"});
    if(!id) return res.status(404).json({"message": "Id of the Admin required to continue"});
    if(!updates){
        return res.status(400).json({"message": "Updates required to continue!!!"});
    }

    try {
        //get Admin with the id
        const admin = await db.collection("admins").findOne({_id: new ObjectId(id)});
        if(!admin) return res.status(404).json({"message": `cannot find Admin with that ${id}`})

        if(updates.password){
            updates.password = await bcrypt.hash(updates.password, 10);
        }
        // if(updates.adminId){
        //     return res.status(400).json({"message": "Cannot update admin id"});
        // }
        //  if(updates.roles){
        //     return res.status(400).json({"message": "Cannot update roles"});
        // }
        //update the Admin
        const results = await db.collection("admins").updateOne({_id: new ObjectId(id)}, {$set: updates});
        
       if (results.modifiedCount === 0) {
            return res.status(404).json({ "message": "Admin wasn't updated" });
        }
         //send success message
        res.status(200).json({"message": `Updated Admin with this id ${id}`});
    } catch (error) {
        res.status(500).json({"message": `${error.message}`});
    }
}
const deleteAdmin = async (req,res) => {
    const db = getDb();
    const {id} = req.params;
    if(!db) return res.status(404).json({"message": "Database not initialized"});
    if(!id) return res.status(404).json({"message": "Id of the Admin required to continue"});

    try {
        const Admin = await db.collection("admins").findOne({_id: new ObjectId(id)});
        if(!Admin) return res.status(404).json({"message": `cannot find Admin with that ${id}`});

        const results = await db.collection("admins").deleteOne({_id: new ObjectId(id)});

        if(results.deletedCount === 0) return res.status(400).json({"message": `Admin with id ${id} wasn't deleted`});

        res.status(200).json({"message": `Deleted Admin with this id ${id}`});
    } catch (error) {
        res.status(500).json({"message": `${error.message}`});
    }
}
const getAdmin = async (req,res) => {
    const db = getDb();
    const {id} = req.params;
    if(!db) return res.status(404).json({"message": "Database not initialized"});
    if(!id) return res.status(404).json({"message": "Id of the Admin required to continue"});

    try {
        const admin = await db.collection("admins").findOne({_id: new ObjectId(id)});
        if(!admin) return res.status(404).json({"message": `cannot find Admin with that ${id}`});

        const results = await db.collection("admins").findOne({_id: new ObjectId(id)});

        res.status(200).json(results);
    } catch (error) {
        res.status(500).json({"message": `${error.message}`});
    }
}
module.exports = {
    getAllAdmins,
    updateAdmin,
    deleteAdmin,
    getAdmin
}