const {getDb} = require("../model/hospitalDb");
const {format} = require("date-fns");
const bcrypt = require("bcrypt");
const { ObjectId } = require("mongodb");

const addNewAdmin = async (req,res) => {
    // let updateAdminRegistered = [];
    const handleAllUsersInputs = require("./controlAllUsersInputs");
    const sendEmail = require("../utils/sendEmail");
    const roles = "admin"
    const db = getDb();
    const {email, username , password, phoneNumber, secretReg, gender } = req.body;
    if(!db) return res.status(404).json({"message": "Database not initialized"});
    if(!email || !username || !password  ||! phoneNumber || !gender || !secretReg ){
        return res.status(400).json({"message": "email, username, password , secret reg, gender  and phone number required"})
    }
    
    try {
       // check if he has the correct secret code to register
        const usedAdminCode = await db.collection("admins").findOne({adminId: secretReg});
        if(!usedAdminCode){
            return res.status(400).json({"message": "Failed to verify secret registration number"});
        }
        //check for duplicates
        const duplicateUsernameEmail = await db.collection("admins").findOne({email: email}, {username: username});
        
        if(duplicateUsernameEmail) return res.status(409).json({"message": `Admin with email ${email} and username ${username} already exists`});

        //assign id to admin
            const lastAdmin = await db.collection("admins")
            .find()
            .sort({ adminId: -1 })
            .limit(1)
            .toArray();

            let adminId;

            if (lastAdmin.length === 0) {
            // No parent yet → start with TC001
                adminId = "AD001";
            } else {
            // Extract the last adminId
            const lastId = lastAdmin[0].adminId; 
            
            // Extract numeric part using regex
            const num = parseInt(lastId.match(/\d+/)[0]);
            
            // Increment and pad to 3 digits
            const nextNum = String(num + 1).padStart(3, "0");
            
            // Combine with prefix
                adminId = "AD" + nextNum;
            }
        //hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        const adminFormat ={
            "email": email,
            "username": username,
            "adminId": adminId,
            "password":hashedPassword,
            "amountPaid": 100000,
            "phoneNumber": phoneNumber,
            "roles": roles,
            'gender': gender,
            "registeredBy": usedAdminCode.username,
            "createdAt": `${format(new Date() ,"yyyy/MM/dd  HH:mm:ss")}`,
        }
        //validate admin input
        const {error} = handleAllUsersInputs.validateAdminInput(adminFormat);
        if(error){
            return res.status(400).json({"message": `${error.details[0].message}`});
        }
        //send email 
        // await sendEmail(
        // email,
        // "Admin Account Created - General Hospital System",
        // `Dear ${username}, your admin account for General Hospital has been created successfully.`,
        // `
        //     <div style="font-family: Arial, sans-serif; padding: 20px; background: #e6f4ea; border-radius: 10px;">
        //     <h2 style="color: #28a745;">✅ Welcome, ${username}!</h2>
        //     <p>Your admin account for the <strong>General Hospital Home Care System</strong> is now active.</p>
        //     <p><strong>Admin ID:</strong> ${adminId}</p>
        //     <p>Please keep your credentials secure.</p>
        //     <br />
        //     <p style="color:#777;">Best regards,<br><strong>General Hospital IT Department</strong></p>
        //     </div>
        // `
        // );
        const results = await db.collection("admins").insertOne(adminFormat);
        res.status(201).json(
            {"message":`
                Admin ${gender === "Male" ? "Mr": "Mrs"} ${adminFormat.username} added successfully` 
            }
        )

    } catch (error) {
         res.status(500).json({"message": `${error.message}`});
    }
}

module.exports = addNewAdmin