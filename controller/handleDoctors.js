const {getDb} = require("../model/hospitalDb");
const {format} = require("date-fns");
const bcrypt = require("bcrypt");
const { ObjectId } = require("mongodb");
const getAllDoctors =  async (req,res) => {
  const db = getDb();
  const user = req.user; // comes from verifyJWT
  const role = user.roles;

  if (!db) return res.status(404).json({ message: "Database not initialized" });

  try {
    let doctors;

    if (role === "admin") {
     
      // Admin can view all doctors
      doctors = await db.collection("doctors").find().toArray();

    } 
    else if (role === "doctor") {
      // Doctor can view only their own profile
      doctors = await db.collection("doctors").find({ username: user.username }).toArray();
    } 
    else if (role === "careGiver" || role === "patient") {
      // Caregiver or patient can view only their assigned doctor(s)
      const patientsCollection = db.collection("patients");

      // Patient role: find their own record
      if (role === "patient") {
        const patient = await patientsCollection.findOne({ name: user.name });
        if (patient?.assignedDoctor?.name) {
          doctors = await db.collection("doctors").find({ name: patient.assignedDoctor.name }).toArray();
        } else {
          doctors = [];
        }
      }

      // Caregiver role: find doctors assigned to their patients
      if (role === "careGiver") {
        const assignedPatients = await patientsCollection
          .find({ "assignedCareGiver.name": user.name })
          .toArray();

        const doctorNames = [...new Set(assignedPatients.map(p => p.assignedDoctor?.name).filter(Boolean))];
        doctors = await db.collection("doctors").find({ name: { $in: doctorNames } }).toArray();
      }
    } 
    else {
      return res.status(403).json({ message: "Access denied" });
    }

    if (!doctors || doctors.length === 0) {
      return res.status(404).json({ message: "No doctors found" });
    }
    doctors.sort((a, b) => {
      const numA = parseInt(a.doctorId.slice(3)); // removes "AD" and parses the number
      const numB = parseInt(b.doctorId.slice(3));
      return numA - numB;
    });


    res.status(200).json(doctors);

  } catch (error) {
    console.error(" Error fetching doctors:", error);
    res.status(500).json({ message: "Server error while fetching doctors" });
  }

}
const updateDoctor = async (req, res) => {
  const db = getDb();
  const { id } = req.params;
  const updates = req.body;

  if (!db) return res.status(404).json({ message: "Database not initialized" });
  if (!id) return res.status(400).json({ message: "Doctor ID required" });
  if (!updates || Object.keys(updates).length === 0)
    return res.status(400).json({ message: "No updates provided" });

  try {
    const doctor = await db.collection("doctors").findOne({ _id: new ObjectId(id) });
    if (!doctor) return res.status(404).json({ message: "doctor not found" });

    // if (updates.roles) {
    //   return res.status(400).json({ message: "Cannot update roles" });
    // }

    if (updates.password) {
      updates.password = await bcrypt.hash(updates.password, 10);
    }

    // Update doctor document
    const results = await db.collection("doctors").updateOne(
      { _id: new ObjectId(id) },
      { $set: updates }
    );

    if (results.modifiedCount === 0) {
      return res.status(404).json({ message: "Doctor wasn't updated" });
    }

    res.status(200).json({ message: `Doctor updated successfully` });

  } catch (error) {
    res.status(500).json({ message: error.message });
    console.log(error)
  }
};

const deleteDoctor = async (req,res) => {
    const db = getDb();
    const {id} = req.params;
    if(!db) return res.status(404).json({"message": "Database not initialized"});
    if(!id) return res.status(404).json({"message": "Id of the doctor required to continue"});

    try {
        const doctor = await db.collection("doctors").findOne({_id: new ObjectId(id)});
        if(!doctor) return res.status(404).json({"message": `cannot find doctor with that ${id}`});

        const results = await db.collection("doctors").deleteOne({_id: new ObjectId(id)});


        if(results.deletedCount === 0) return res.status(400).json({"message": `doctor with id ${id} wasn't deleted`});

        res.status(200).json({"message": `Deleted doctor with this id ${id}`});
    } catch (error) {
        res.status(500).json({"message": `${error.message}`});
    }
}

const getDoctor = async (req, res) => {
  const db = getDb();
  const { id } = req.params;
  const user = req.user; // from verifyJwt middleware

  if (!db) return res.status(500).json({ message: "Database not initialized" });

  try {
    const doctor = await db.collection("doctors").findOne({ _id: new ObjectId(id) });
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });

    const role = user.roles;

    // Access control
    if (role === "doctor" && doctor.username !== user.username) {
      return res.status(403).json({ message: "Access denied: not your profile" });
    }

    if (role === "patient") {
      // Patient can only view their assigned doctor
      const patient = await db.collection("patients").findOne({ name: user.name });
      if (!patient || patient.assignedDoctor?.username !== doctor.username) {
        return res.status(403).json({ message: "Access denied" });
      }
    }

    if (role === "careGiver") {
      // Caregiver can only view doctors assigned to their patients
      const assignedPatients = await db
        .collection("patients")
        .find({ "assignedCareGiver.name": user.name })
        .toArray();

      const allowedDoctors = assignedPatients.map(p => p.assignedDoctor?.username).filter(Boolean);
      if (!allowedDoctors.includes(doctor.username)) {
        return res.status(403).json({ message: "Access denied" });
      }
    }

    //  Admin can view all doctors
    res.status(200).json(doctor);

  } catch (error) {
    console.error(" Error fetching doctor:", error);
    res.status(500).json({ message: "Server error while fetching doctor" });
  }
};


module.exports = {
    getAllDoctors,
    updateDoctor,
    deleteDoctor,
    getDoctor
}