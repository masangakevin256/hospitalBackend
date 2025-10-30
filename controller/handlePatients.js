const {getDb} = require("../model/hospitalDb");
const {format, add} = require("date-fns");
const bcrypt = require("bcrypt");
const { ObjectId } = require("mongodb");
const getAllPatients = async (req, res) => {
  const user = req.user; // { name: 'omondi clinton', roles: 'patient' }
  const role = user.roles?.toLowerCase?.();

  // console.log("User role:", role);
  const db = getDb();
  let patients;
  // console.log("User role:", role);
  // console.log(user)

  try {
    if (role === "admin" || role === "doctor") {
      // Return all patients
      patients = await db.collection("patients").find().toArray();
    } 

    else if (role.toLowerCase() === "caregiver") {
      patients = await db.collection("patients").find({
        "assignedCareGiver.name": user.name
      }).toArray();
    }

    else if (role === "patient") {
      // Return only their own record
      patients = await db.collection("patients").find({ name: user.name }).toArray();
    } 
    else {
      return res.status(403).json({ message: "Access denied: invalid role" });
    }

    if (!patients || patients.length === 0)
      return res.status(404).json({ message: "No patients found" });

    // console.log("Patients found:", patients.length);
    
  patients.sort((a, b) => {
    const numA = parseInt(a.patientId.slice(3));
    const numB = parseInt(b.patientId.slice(3));
    return numA - numB;
  });

    res.json(patients);
    // console.log("Patients in frontend:", patients);

  } catch (error) {
    console.error("Error fetching patients:", error);
    res.status(500).json({ message: "Server error" });
  }
};
const getAllPatientsDoctor = async (req, res) => {
  try {
    const user = req.user; // { name: 'omondi clinton', roles: 'patient' }
    const role = user.roles?.toLowerCase?.();
    // console.log("User Role: ", role)
    const db = getDb();
    let patients;
    if(role === "doctor"){
      patients = await db.collection("patients").find({
        "assignedDoctor.name": user.username
      }).toArray();
    }
    patients.sort((a, b) => {
      const numA = parseInt(a.patientId.slice(3));
      const numB = parseInt(b.patientId.slice(3));
      return numA - numB;
    });
    res.json(patients)
  } catch (error) {
    console.error("Error fetching patients:", error);
    res.status(500).json({ message: "Server error" });
  }
}
const addNewPatient = async (req,res) => {
  const handleAllUsersInputs = require("./controlAllUsersInputs");
  const sendEmail = require("../utils/sendEmail");
    // let updatePatientRegistered = [];
    const roles = "patient"
    let registeredBy;
    const db = getDb();
    const {name,age, phoneNumber, address, password, sickness, regId , assignedDoctor, assignedCareGiver, gender, email} = req.body;
    if(!db) return res.status(404).json({"message": "Database not initialized"});
    if(!name || !age  || !address || !phoneNumber || !sickness || !regId  || !password || !assignedDoctor || !gender || !email ){
        return res.status(400).json({
          "message": "name, age,gender, password ,  sickness, doctor/admin id assign doctor and care giver, gender , and address phone number required"
        })
    }
    try {
        //check if he has the correct secret code to register
        const usedDoctorsId = await db.collection("doctors").findOne({doctorId: regId});
        const usedAdminId = await db.collection("admins").findOne({adminId: regId});

        if(!usedDoctorsId && !usedAdminId){
            return res.status(400).json({"message": "Failed to verify doctors/admin id"});
        }
        //check is assigned doctor exists
        const doctorToBeAssigned = await db.collection("doctors").findOne({username: assignedDoctor});
        //check assigned caregiver
        const careGiverToBeAssigned = await db.collection("careGivers").findOne({name: assignedCareGiver});

        if(!doctorToBeAssigned) return res.status(400).json({"message": `Doctor ${assignedDoctor} doesn't exist`})
        // if(!careGiverToBeAssigned) return res.status(400).json({"message": `Care giver ${assignedCareGiver} doesn't exist`})
        //check for duplicates
        const duplicateUsernameEmail = await db.collection("patients").findOne({name: name}, {phoneNumber: phoneNumber});
      
        
        if(duplicateUsernameEmail) return res.status(409).json({"message": `patient with name ${name} and phone number ${phoneNumber} already exists`});
        //assign id to 
            const lastPatient = await db.collection("parents")
            .find()
            .sort({ patientId: -1 })
            .limit(1)
            .toArray();

            let patientId;

            if (lastPatient.length === 0) {
            // No patient yet → start with PAT001
                patientId = "PAT001";
            } else {
            // Extract the last patientId
            const lastId = lastPatient[0].patientId; 
            
            // Extract numeric part using regex
            const num = parseInt(lastId.match(/\d+/)[0]);
            
            // Increment and pad to 3 digits
            const nextNum = String(num + 1).padStart(3, "0");
            
            // Combine with prefix
                patientId = "PAT" + nextNum;
            }
        //hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        if(usedDoctorsId){
          registeredBy = `Doctor ${usedDoctorsId.username}`
        }else{
          registeredBy = `Admin ${usedAdminId.username}`
        }
        //update the doctor 
      const updatePatientToDoctor = await db.collection("doctors").updateOne(
        { username: assignedDoctor },
        { $push: { assignedPatients: name }}
      );
       const updatePatientToCareGiver = await db.collection("careGivers").updateOne(
        { name: assignedCareGiver }, // 
        { $push: { assignedPatients: name }} 
      );

        const patientFormat ={
            "email": email,
            "name": name,
            "age": age,
            "gender": gender,
            "patientId": patientId,
            "password":hashedPassword,
            "phoneNumber": phoneNumber,
            "roles": roles,
            "address": address,
            "registeredBy": registeredBy,
            "assignedDoctor": ({
              name: doctorToBeAssigned.username,
              phoneNumber: doctorToBeAssigned.phoneNumber
            }),
            "assignedCareGiver": ({
               name: careGiverToBeAssigned.name,
                phoneNumber: careGiverToBeAssigned.phoneNumber
            }),
            "sickness": sickness,
            "createdAt": `${format(new Date() ,"yyyy/MM/dd  HH:mm:ss")}`,
        }
      //validate patient input
      // const {error} = handleAllUsersInputs.validatePatientInput(patientFormat);
      //   if(error){
      //       return res.status(400).json({"message": `${error.details[0].message}`})
      //   }
       const registrar = await db.collection("doctors").findOne({ username: registeredBy }) 
                    || await db.collection("admins").findOne({ username: registeredBy });
        

        //send email to patients
      await sendEmail(
        patientFormat.email,
        "Welcome to General Hospital Home Care System",
        `Dear ${patientFormat.name},\nWelcome to our Home Health Care program. Your assigned doctor is ${patientFormat.assignedDoctor.name}.`,
        `
          <div style="font-family: Arial, sans-serif; padding: 20px; background: #f4f8fb; border-radius: 10px;">
            <h2 style="color: #28a745;">🎉 Welcome, ${patientFormat.name}!</h2>
            <p>We’re happy to have you in our <strong>Home Health Care Program</strong>.</p>
            <p>Your assigned doctor is <strong>${patientFormat.assignedDoctor.name}</strong>.</p>
            <p>Your care giver is <strong>${patientFormat.assignedCareGiver.name}</strong>.</p>
            <p>You can now receive remote monitoring and care updates directly from our system.</p>
            <br />
            <p style="color:#777;">Best regards,<br><strong>General Hospital Home Care Team</strong></p>
          </div>
        `,
          registrar?.email
      );
        const results = await db.collection("patients").insertOne(patientFormat);
        res.status(201).json(
            {"message":`Patient  ${gender === "Male" ? "Mr": "Mrs"} ${patientFormat.name} added successfully` }
        )

    } catch (error) {
         res.status(500).json({"message": `${error.message}`});
    }
}
 
const updatePatient = async (req, res) => {
  try {
    const db = getDb();
    const {id} = req.params;
    const updates = req.body;

    if (!db) return res.status(500).json({ message: "Database not initialized" });
    if (!id) return res.status(400).json({ message: "Missing patient ID" });
    if(!updates) return res.status(404).json({"message": "Updates not found!"})

      if(updates.password ) {
        updates.password = await bcrypt.hash(updates.password, 10);
      }

   const result = await db.collection("patients").updateOne({_id: new ObjectId(id)}, {$set: updates})

    if (result.modifiedCount === 0) {
      return res.status(200).json({ message: "No changes made" });
    }

    // Return updated patient data
    const updatedPatient = await db.collection("patients").findOne({ _id: new ObjectId(id) });
    res.status(200).json({
      message: "Patient updated successfully",
      patient: updatedPatient,
    });

  } catch (error) {
    console.error("Error updating patient:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const deletePatient = async (req,res) => {
    const db = getDb();
    const {id} = req.params;
    if(!db) return res.status(404).json({"message": "Database not initialized"});
    if(!id) return res.status(404).json({"message": "Id of the patient required to continue"});

    try {
        const patient = await db.collection("patients").findOne({_id: new ObjectId(id)});
        if(!patient) return res.status(404).json({"message": `cannot find patient with that ${id}`});

        const results = await db.collection("patients").deleteOne({_id: new ObjectId(id)});

    const deleteDoctorPatient = await db.collection("doctors").updateOne(
      { assignedPatients: patient.name },   // find doctor with this patient
      { $pull: { assignedPatients: patient.name } }  // remove from array
    )
    const deleteCareGiverPatient = await db.collection("careGivers").updateOne(
      { assignedPatients: patient.name },   // find care giver with this patient
      { $pull: { assignedPatients: patient.name } }  // remove from array
    )
    if(results.deletedCount === 0) return res.status(400).json({"message": `patient with id ${id} wasn't deleted`});

        res.status(200).json({"message": `Deleted patient with this id ${id}`});
    } catch (error) {
        res.status(500).json({"message": `${error.message}`});
    }
}
const getPatient = async (req, res) => {
  const db = getDb();
  const { id } = req.params;
  const user = req.user; 

  try {
    const patient = await db.collection("patients").findOne({ _id: new ObjectId(id) });
    if (!patient) return res.status(404).json({ message: "Patient not found" });

    // Role-based visibility control
    if (user.roles === "patient" && patient.name !== user.name) {
      return res.status(403).json({ message: "Access denied: you can only view your own record" });
    }

    if (user.roles === "careGiver" && patient.assignedCareGiver?.name !== user.name) {
      return res.status(403).json({ message: "Access denied: not assigned to this caregiver" });
    }

    if (user.roles === "doctor" && patient.assignedDoctor?.name !== user.username) {
      return res.status(403).json({ message: "Access denied: not assigned to this doctor" });
    }

    // Admins can view any patient
    res.status(200).json(patient);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
    getAllPatients,
    getAllPatientsDoctor,
    addNewPatient,
    updatePatient,
    deletePatient,
    getPatient
}