const {getDb} = require("../model/hospitalDb");
const {format} = require("date-fns");
const bcrypt = require("bcrypt");
const { ObjectId } = require("mongodb");

const addNewDoctor = async (req,res) => {
    // let updateDoctorRegistered = [];
    const handleAllUsersInputs = require("./controlAllUsersInputs");
    const sendEmail = require("../utils/sendEmail");
    const roles = "doctor"
    const db = getDb();
    const {email, username , password, phoneNumber, gender , secretReg, specialty} = req.body;
    if(!db) return res.status(404).json({"message": "Database not initialized"});
    if(!email || !username || !password  || !phoneNumber   || ! gender  || !secretReg){
        return res.status(400).json({"message": "email, username, password, adminId registering ,gender and phone number required"})
    }
    
    try {
        //check if he has the correct secret code to register
        const usedAdminCode = await db.collection("admins").findOne({adminId: secretReg});
        if(!usedAdminCode){
            return res.status(400).json({"message": "Failed to verify secret registration number"});
        }
        //check for duplicates
        const duplicateUsernameEmail = await db.collection("doctors").findOne({email: email}, {username: username});
        
        if(duplicateUsernameEmail) return res.status(409).json({"message": `Doctor with email ${email} and username ${username} already exists`});
        
        //assign id to doctor
            const lastDoctor = await db.collection("doctors")
            .find()
            .sort({ doctorId: -1 })
            .limit(1)
            .toArray();

            let doctorId;

            if (lastDoctor.length === 0) {
            // No doctor yet → start with DOC001
                doctorId = "DOC001";
            } else {
            // Extract the last doctorId
            const lastId = lastDoctor[0].doctorId; 
            
            // Extract numeric part using regex
            const num = parseInt(lastId.match(/\d+/)[0]);
            
            // Increment and pad to 3 digits
            const nextNum = String(num + 1).padStart(3, "0");
            
            // Combine with prefix
                doctorId = "DOC" + nextNum;
            }
            //hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        const doctorFormat ={
            "email": email,
            "username": username,
            "doctorId": doctorId,
            "password":hashedPassword,
            "amountPaid": 100000,
            "phoneNumber": phoneNumber,
            "roles": roles,
            "gender": gender,
            "specialty": specialty,
            "registeredBy": usedAdminCode.username,
            "createdAt": `${format(new Date() ,"yyyy/MM/dd  HH:mm:ss")}`,
        }
        //validate doctor input
        const {error} = handleAllUsersInputs.validateDoctorInput(doctorFormat);
        if(error){
            return res.status(400).json({"message": `${error.details[0].message}`});
        }
        //send email
        // await sendEmail(
        // email,
        // "Welcome to General Hospital System",
        // `Dear Dr. ${username}, welcome to the General Hospital Home Care team.`,
        // `
        //     <div style="font-family: Arial, sans-serif; padding: 20px; background: #f4f8fb; border-radius: 10px;">
        //     <h2 style="color: #007bff;">👨‍⚕️ Welcome, Dr. ${username}!</h2>
        //     <p>We’re excited to have you join our <strong>Home Health Care Program</strong>.</p>
        //     <p>Your doctor ID is <strong>${doctorId}</strong>.</p>
        //     <p>You can now start monitoring and assisting patients remotely.</p>
        //     <br />
        //     <p style="color:#777;">Best regards,<br><strong>General Hospital Administration</strong></p>
        //     </div>
        // `
        // );
        const results = await db.collection("doctors").insertOne(doctorFormat);
        res.status(201).json(
            {
                "message":
                `Doctor ${gender === "Male" ? "Mr" : "Mrs"} ${doctorFormat.username} added successfully`
             }
        )

    } catch (error) {
         res.status(500).json({"message": `${error.message}`});
    }
}

module.exports = addNewDoctor