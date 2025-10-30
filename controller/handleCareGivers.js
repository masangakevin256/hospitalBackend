const {getDb} = require("../model/hospitalDb");
const {format} = require("date-fns");
const bcrypt = require("bcrypt");
const { ObjectId } = require("mongodb");

const getAllCareGivers = async (req, res) => {
  const user = req.user;
  const role = user.roles;
  const db = getDb();

  if (!db) return res.status(404).json({ message: "Database not initialized" });

  try {
    let careGivers = [];

    if (role === "admin") {
      // Admin sees all caregivers
      careGivers = await db.collection("careGivers").find().toArray();
    } 
    else if (role === "doctor") {
      // Doctor — find caregivers assigned to their patients
      const patients = await db.collection("patients")
        .find({ "assignedDoctor.name": user.username })
        .toArray();

      const caregiverNames = [
        ...new Set(patients.map(p => p.assignedCareGiver?.name).filter(Boolean))
      ];

      careGivers = await db.collection("careGivers")
        .find({ name: { $in: caregiverNames } })
        .toArray();
    } 
    else if (role === "careGiver") {
      //  Caregiver sees only themselves
      const caregiver = await db.collection("careGivers").findOne({ name: user.name });
      if (caregiver) careGivers = [caregiver];
    } 
    else if (role === "patient") {
      //  Patient sees only their caregiver
      const patient = await db.collection("patients").findOne({ name: user.name });
      if (patient?.assignedCareGiver?.name) {
        const caregiver = await db.collection("careGivers").findOne({
          name: patient.assignedCareGiver.name
        });
        if (caregiver) careGivers = [caregiver];
      }
    }

    if (!careGivers || careGivers.length === 0) {
      return res.status(404).json({ message: "No caregivers found" });
    }

    
    careGivers.sort((a, b) => {
      const numA = parseInt(a.careGiverId.slice(3));
      const numB = parseInt(b.careGiverId.slice(3));
      return numA - numB;
    });

    res.status(200).json(careGivers);

  } catch (error) {
    console.error("Error fetching caregivers:", error);
    res.status(500).json({ message: "Failed to fetch caregivers" });
  }
};

const addNewCareGiver = async (req,res) => {
  const sendEmail = require("../utils/sendEmail")
  const amountPaid = 10000
  const handleAllUsersInputs = require("./controlAllUsersInputs");
  const roles = "careGiver"
    let registeredBy;
    const db = getDb();
    const {name, phoneNumber, regId, password, gender, email} = req.body;
    if(!db) return res.status(404).json({"message": "Database not initialized"});
    if(!name ||!phoneNumber || !regId  || !password || !gender || !email){
        return res.status(400).json({
          "message": "name, phoneNumber , care giver id, gender ,email password and registerer id required"
        })
    }
    
    try {
        //check if he has the correct secret code to register
        const usedDoctorsId = await db.collection("doctors").findOne({doctorId: regId});
        const usedAdminId = await db.collection("admins").findOne({adminId: regId});

        if(!usedDoctorsId && !usedAdminId){
            return res.status(400).json({"message": "Failed to verify doctors/admin id"});
        }
        //check for duplicates
        const duplicateUsernameEmail = await db.collection("careGivers").findOne({name: name}, {phoneNumber: phoneNumber});
    
        
        if(duplicateUsernameEmail) return res.status(409).json({"message": `careGiver with name ${name} and phone number ${phoneNumber} already exists`});
        //assign id to parent
            const lastCareGiver = await db.collection("careGivers")
            .find()
            .sort({ careGiverId: -1 })
            .limit(1)
            .toArray();

            let careGiverId;

            if (lastCareGiver.length === 0) {
            // No caregiver  yet → start with CG001
                careGiverId = "CG001";
            } else {
            // Extract the last careGiverId
            const lastId = lastCareGiver[0].careGiverId; 
            
            // Extract numeric part using regex
            const num = parseInt(lastId.match(/\d+/)[0]);
            
            // Increment and pad to 3 digits
            const nextNum = String(num + 1).padStart(3, "0");
            
            // Combine with prefix
                careGiverId = "CG" + nextNum;
            }
        //hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        if(usedDoctorsId){
          registeredBy = `Doctor ${usedDoctorsId.username}`
        }else{
          registeredBy = `Admin ${usedAdminId.username}`
        }
        

        const careGiverFormat ={
            "email": email,
            "name": name,
            "careGiverId": careGiverId,
            "password":hashedPassword,
            "phoneNumber": phoneNumber,
            "roles": roles,
            "gender": gender,
            "registeredBy": registeredBy,
            "amountPaid": amountPaid,
            "createdAt": `${format(new Date() ,"yyyy/MM/dd  HH:mm:ss")}`,
        }
        //validate the care giver input
        const {error} = handleAllUsersInputs.validateCareGiverInput(careGiverFormat);
        if(error){
          return res.status(400).json({"message": `${error.details[0].message}`})
        }
        //send email
      const emailSend =  await sendEmail(
        careGiverFormat.email,
        "Welcome to General Hospital Care Team",
        `Dear ${name}, welcome to General Hospital Home Care Program as a Caregiver.`,
        `
          <div style="font-family: Arial, sans-serif; padding: 20px; background: #f0f9ff; border-radius: 10px;">
            <h2 style="color: #007bff;">👩‍⚕️ Welcome, ${name}!</h2>
            <p>We’re excited to have you join our <strong>Home Health Care Program</strong> as a Caregiver.</p>
            <p><strong>Caregiver ID:</strong> ${careGiverId}</p>
            <p><strong>Registered by:</strong> ${registeredBy}</p>
            <p>You can now start assisting patients assigned to you through the monitoring system.</p>
            <br />
            <p style="color:#777;">Best regards,<br><strong>General Hospital Administration</strong></p>
          </div>
        `
      );
      // if(!emailSend) return res.status(400).json({"message": "Failed to send email"});
        //add care giver
        const results = await db.collection("careGivers").insertOne(careGiverFormat);
        res.status(201).json(
            {"message":
              `careGiver ${gender === "Male" ? "Mr": "Mrs"} ${careGiverFormat.name} added successfully`
             }
        )

    } catch (error) {
         res.status(500).json({"message": `${error.message}`});
    }
}
 
const updateCareGiver = async (req, res) => {
  const db = getDb();
  const { id } = req.params;
  const updates = req.body;

  if (!db) return res.status(404).json({ message: "Database not initialized" });
  if (!id) return res.status(400).json({ message: "careGiver ID required" });
  if (!updates || Object.keys(updates).length === 0)
    return res.status(400).json({ message: "No updates provided" });

  try {
    const careGiver = await db.collection("careGivers").findOne({ _id: new ObjectId(id) });
    if (!careGiver) return res.status(404).json({ message: "careGiver not found" });

    // if (updates.roles) {
    //   return res.status(400).json({ message: "Cannot update roles" });
    // }

    if (updates.password) {
      updates.password = await bcrypt.hash(updates.password, 10);
    }

    // Update careGiver document
    const results = await db.collection("careGivers").updateOne(
      { _id: new ObjectId(id) },
      { $set: updates }
    );

    if (results.modifiedCount === 0) {
      return res.status(404).json({ message: "careGiver wasn't updated" });
    }

    res.status(200).json({ message: `careGiver updated successfully` });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteCareGiver = async (req,res) => {
    const db = getDb();
    const {id} = req.params;
    if(!db) return res.status(404).json({"message": "Database not initialized"});
    if(!id) return res.status(404).json({"message": "Id of the careGiver required to continue"});

    try {
        const careGiver = await db.collection("careGivers").findOne({_id: new ObjectId(id)});
        if(!careGiver) return res.status(404).json({"message": `cannot find careGiver with that ${id}`});

        const results = await db.collection("careGivers").deleteOne({_id: new ObjectId(id)});


        if(results.deletedCount === 0) return res.status(400).json({"message": `careGiver with id ${id} wasn't deleted`});

        res.status(200).json({"message": `Deleted careGiver with this id ${id}`});
    } catch (error) {
        res.status(500).json({"message": `${error.message}`});
    }
}
const getCareGiver = async (req,res) => {
  const db = getDb();
  const { id } = req.params;
  const user = req.user;

  if (!db) return res.status(404).json({ message: "Database not initialized" });

  try {
    const careGiver = await db.collection("careGivers").findOne({ _id: new ObjectId(id) });
    if (!careGiver) return res.status(404).json({ message: "Caregiver not found" });

    const role = user.roles;

    // Role-based restrictions
    if (role === "admin") {
      // Admin can access any caregiver
      return res.status(200).json(careGiver);
    }

    if (role === "doctor") {
      // Doctor can access caregiver if assigned to their patient(s)
      const patient = await db.collection("patients").findOne({
        "assignedDoctor.name": user.username,
        "assignedCareGiver.name": careGiver.name,
      });

      if (!patient) {
        return res.status(403).json({ message: "Access denied: not assigned to your patient" });
      }

      return res.status(200).json(careGiver);
    }

    if (role === "careGiver") {
      // Caregiver can only access their own profile
      if (careGiver.name !== user.name) {
        return res.status(403).json({ message: "Access denied: cannot view another caregiver" });
      }
      return res.status(200).json(careGiver);
    }

    if (role === "patient") {
      // Patient can only view their own assigned caregiver
      const patient = await db.collection("patients").findOne({ name: user.name });
      if (patient?.assignedCareGiver?.name !== careGiver.name) {
        return res.status(403).json({ message: "Access denied: not your caregiver" });
      }
      return res.status(200).json(careGiver);
    }

    return res.status(403).json({ message: "Access denied" });

  } catch (error) {
    console.error("Error fetching caregiver:", error);
    res.status(500).json({ message: "Server error" });
  }

}
module.exports = {
    getAllCareGivers,
    addNewCareGiver,
    updateCareGiver,
    deleteCareGiver,
    getCareGiver
}