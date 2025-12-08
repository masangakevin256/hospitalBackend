const { ObjectId } = require("mongodb");
const {getDb} = require("../model/hospitalDb");

const getAllPrescription = async (req,res) =>{
    const user = req.user;
    const role = user.roles;
    const db = getDb();
    let query = {};

    if(!db) return res.json({message: "Database not initialized"});

    try {
        if(role === "doctor"){
            query = {prescribingDoctor: user.username}
        }else if (role === "patient"){
            query = {patientName: user.name}
        }else{
            return res.status(403).json({message: "Access denied"});
        }

        const prescriptions = await db.collection("prescriptions")
            .find(query)
            .sort({createdAt: -1})
            .toArray()

        res.status(200).json(prescriptions);
    } catch (error) {
        return res.status(500).json({message: `Error: ${error}`})
    }


}


const addPrescription = async (req,res) =>{
    const db = getDb();
    const user = req.user;
    const {
        patientId,
        medication,
        dosage,
        quantity,
        refills,
        expiryDate,
        status,
        instructions,
        pharmacy,
        condition,
        lastFilled,
        nextRefill
    } = req.body;


    try {
        
            if(!patientId) return res.status(400).json({message:"PatientId required"});

            const patient = await db.collection("patients").findOne({
                patientId: patientId
            });

            if(!patient) return res.status(404).json({message: "Patient not found"});

            const prescribingDoctor = await db.collection("doctors").findOne(
                {username: user.username}
            )

            if(!prescribingDoctor){
                return res.status(404).json({message: "Doctor not found"})
            }

            const canPrescribe = patient.assignedDoctor?.name;

            if(user.username !== canPrescribe) return res.status(403).json({message:"You can not prescribe to this patient.Not assigned to you!"});

            const prescriptionFormat = {
                patientId: patientId,
                patientName: patient.name,
                medication: medication,
                dosage: dosage,
                quantity: quantity,
                refills: refills,
                prescribedDate: new Date(),
                prescribingDoctor: prescribingDoctor.username,
                expiryDate: expiryDate,
                status: status,
                instructions: instructions,
                pharmacy: pharmacy,
                condition: condition,
                lastFilled: lastFilled,
                nextRefill: nextRefill,
                createdAT: new Date()
            }
            
         await db.collection("prescriptions").insertOne(prescriptionFormat);

            res.status(201).json({message: "Prescription created successfully!"});
    } catch (error) {
       return res.status(500).json({message: `Error: ${error}`})
    }


}

const updatePrescription = async (req,res) => {
    const {id} = req.params;
    const updates = req.body;
     const db = getDb();

    try {
        // if(updates.patientId) return res.status(400).json({message: "Can not update patient id"});
        // if(updates.patientName) return res.status(400).json({message: "Can not update patient name"});

        const prescription = await db.collection("prescriptions").findOne(
            {_id: new ObjectId(id)}
        )
        if(!prescription) return res.status(404).json({message: "Prescription not found"});

        const results = await db.collection("prescriptions").updateOne(
           {_id: new ObjectId(id)}, {$set: updates}
        )

        if(results.modifiedCount === 0) return res.status(404).json({message:"Prescription was'nt updated" });

        res.status(200).json({message: "Prescription was updated"});
    } catch (error) {
        return res.status(500).json({message: `Error: ${error}`})
    }
}
const patchPrescription = async (req,res) => {
    const {id} = req.params;
    const updates = req.body;
    const db = getDb();

    try {
        // if(updates.patientId) return res.status(400).json({message: "Can not update patient id"});
        // if(updates.patientName) return res.status(400).json({message: "Can not update patient name"});

        const prescription = await db.collection("prescriptions").findOne(
            {_id: new ObjectId(id)}
        )
        if(!prescription) return res.status(404).json({message: "Prescription not found"});

        const results = await db.collection("prescriptions").updateOne(
           {_id: new ObjectId(id)}, {$set: updates}
        )

        if (results.modifiedCount === 0) return res.status(404).json({message:"Prescription was'nt updated" })

        res.status(200).json({message: "Prescription was updated"});
    } catch (error) {
        return res.status(500).json({message: `Error: ${error}`})
    }
}
const deletePrescription = async(req,res) => {
    const {id} = req.params;
    const db = getDb();
    const user = req.user;
    try {
        const prescription = await db.collection("prescriptions").findOne(
            {_id: new ObjectId(id)}
        )
        if(!prescription) return res.status(400).json({message: "Prescription not found"})
        
        if(user.username !== prescription.prescribingDoctor) return res.status.json({message: "Not authorized to delete this prescription"});

        const results = await db.collection("prescriptions").deleteOne(
            {_id: new ObjectId(id)}
        )

        if(results.deleteCount === 0) return res.status(400).json({message: "Prescription was't deleted!!"});

        res.status(200).json({message: `Prescription with id ${id} deleted successfully`});
        
    } catch (error) {
      return res.status(500).json({message: `Error: ${error}`}) 
    }
}

const getPrescription = async(req,res) => {
    const {id} = req.params;
    const db = getDb();
    const user = req.user;
    

    try {
        const prescription = await db.collection("prescriptions").findOne(
                {_id: new ObjectId(id)}
            )
        if(!prescription) return res.status(400).json({message: "Prescription not found"});
        
        if(user.roles === "doctor"){
            if(user.username !== prescription.prescribingDoctor) return res.status(403).json({message: "Not authorized to get this prescription!!"})
        }else if (user.roles === "patient"){
            if(user.name !== prescription.patientName) return res.status(403).json({message: "Not authorized to access this prescription"})
        }else{
            return res.status(403).json({message: "Not authorized to access this prescription"})
    }

    res.status(200).json(prescription);
    } catch (error) {
       return res.status(500).json({message: `Error: ${error}`})
    }

}
module.exports = {
    getAllPrescription,
    addPrescription,
    updatePrescription,
    patchPrescription,
    deletePrescription,
    getPrescription
}