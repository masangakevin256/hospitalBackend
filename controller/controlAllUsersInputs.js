const Joi = require("joi");

const validatePatientInput = (input) => {
  const schema = Joi.object({
    email: Joi.string().min(8).max(50).trim().required(),
    name: Joi.string().min(3).max(50).trim().required(),
    age: Joi.number().integer().min(0).required(),
    gender: Joi.string().valid("Male", "Female", "Other").required(),
    patientId: Joi.string().alphanum().min(3).required(),
    password: Joi.string().min(8).required(),
    registeredBy: Joi.string().required(),
    assignedDoctor: Joi.object({
      name: Joi.string().required(),
      phoneNumber: Joi.string().pattern(/^(?:0\d{9}|\+254\d{9})$/).required()
    }).required(),
    assignedCareGiver: Joi.object({
      name: Joi.string().required(),
      phoneNumber: Joi.string().pattern(/^(?:0\d{9}|\+254\d{9})$/).required()
    }).required(),
    roles: Joi.string().valid("patient").required(),
    phoneNumber: Joi.string()
      .pattern(/^(?:0\d{9}|\+254\d{9})$/)
      .required()
      .messages({
        "string.pattern.base": "Phone number must be in format eg 0712345678 or +254712345678",
      }),
    address: Joi.string().min(5).max(100).trim().required(),
    sickness: Joi.string().min(5).trim().required(),
    createdAt: Joi.string().optional(),
  });

  return schema.validate(input);
};

module.exports = { validatePatientInput };

const validateCareGiverInput = (input) => {
    const schema = Joi.object({
         email: Joi.string().min(8).max(50).trim().required(),
        name: Joi.string().min(8).max(50).trim().required(),
        regId: Joi.number().optional(),
        careGiverId: Joi.string().alphanum().min(1).required(),
        password: Joi.string().min(8).required(),
        gender: Joi.string().valid("Male", "Female", "Other").required(),
        roles: Joi.string().valid("careGiver").required(),
        phoneNumber: Joi.string()
            .pattern(/^(?:0\d{9}|\+254\d{9})$/)
            .required()
            .messages({
                "string.pattern.base":
                "Phone number must be in format eg 0712345678 or +254712345678",
        }),
        amountPaid: Joi.number().valid(10000).required(),
        registeredBy: Joi.string().required(),
        createdAt: Joi.string().optional()
    });
    return schema.validate(input)
}
const validateDoctorInput = (input) => {
    const schema = Joi.object({
        email: Joi.string().min(8).max(50).trim().required(),
        username: Joi.string().min(8).max(50).trim().required(),
        secretReg: Joi.number().optional(),
        specialty: Joi.string().optional(),
        doctorId: Joi.string().alphanum().min(1).required(),
        password: Joi.string().min(8).required(),
        gender: Joi.string().valid("Male", "Female", "Other").required(),
        roles: Joi.string().valid("doctor").required(),
        phoneNumber: Joi.string()
            .pattern(/^(?:0\d{9}|\+254\d{9})$/)
            .required()
            .messages({
                "string.pattern.base":
                "Phone number must be in format eg 0712345678 or +254712345678",
        }),
        amountPaid: Joi.number().valid(100000).required(),
        registeredBy: Joi.string().required(),
        createdAt: Joi.string().optional()
    })
    return schema.validate(input)
}
const validateAdminInput = (input) => {
    const schema = Joi.object({
        email: Joi.string().min(8).max(50).trim().required(),
        username: Joi.string().min(8).max(50).trim().required(),
        secretReg: Joi.number().optional(),
        adminId: Joi.string().alphanum().min(1).required(),
        password: Joi.string().min(8).required(),
        gender: Joi.string().valid("Male", "Female", "Other").required(),
        roles: Joi.string().valid("admin").required(),
        phoneNumber: Joi.string()
            .pattern(/^(?:0\d{9}|\+254\d{9})$/)
            .required()
            .messages({
                "string.pattern.base":
                "Phone number must be in format eg 0712345678 or +254712345678",
        }),
        amountPaid: Joi.number().valid(100000).required(),
        registeredBy: Joi.string().required(),
        createdAt: Joi.string().optional()
    })

    return schema.validate(input)
}
const validateAlertInput = (input) => {
    const schema = Joi.object({
        patientId: Joi.string().alphanum().min(3).required(),
        alertType: Joi.string().required(),
        message: Joi.string().required(),
        status: Joi.string().required(),
        timeStamp: Joi.string().required(),
        
    });
    return schema.validate(input)
}
const validateVitalInput = (input) => {
  const schema = Joi.object({
    patientId: Joi.string().required(),
    bloodPressure: Joi.string().required(),
    glucoseLevel: Joi.number().required(),
    heartRate: Joi.string().required(),
    temperature: Joi.string().required(),
    oxygenSaturation: Joi.number().required(),
    respiratoryRate: Joi.number().required(),
    weight: Joi.number().required(),
    height: Joi.number().required(),
    bmi: Joi.string().required(),
    notes: Joi.string().allow(""), 
    timestamp: Joi.string().required()
  });

  return schema.validate(input);
};


const validateAppointmentInput = (input) => {
  const schema = Joi.object({
    appointmentId: Joi.string()
      .alphanum()
      .min(3)
      .optional(),

    patientId: Joi.string()
      .min(3)
      .max(20)
      .required()
      .messages({
        "string.base": "Patient ID must be a string",
        "any.required": "Patient ID is required",
      }),

    //  Optional patientName
    patientName: Joi.string()
      .min(3)
      .max(50)
      .optional()
      .allow("")
      .messages({
        "string.base": "Patient name must be a string",
      }),

    
    date: Joi.date()
      .required()
      .messages({
        "date.base": "Date must be a valid date",
        "any.required": "Appointment date is required",
      }),

    
    time: Joi.string()
      .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](\s)?(AM|PM)?$/i)
      .required()
      .messages({
        "string.pattern.base": "Time must be in format HH:mm or HH:mm AM/PM",
      }),

    duration: Joi.string()
      .optional()
      .allow("")
      .default("Not specified"),

    type: Joi.string()
      .valid("Check-up", "Consultation", "Follow-up", "Emergency", "Other")
      .optional()
      .allow(""),

    notes: Joi.string()
      .max(300)
      .optional()
      .allow(""),

    reason: Joi.string()
      .max(200)
      .optional()
      .allow(""),

    status: Joi.string()
      .valid("Pending", "Scheduled", "Completed", "Cancelled")
      .default("Pending"),

    assignedDoctor: Joi.object({
      name: Joi.string().required(),
      phoneNumber: Joi.string()
        .pattern(/^(?:0\d{9}|\+254\d{9})$/)
        .required()
        .messages({
          "string.pattern.base": "Doctor phone must be 07XXXXXXXX or +2547XXXXXXXX",
        }),
    }).required(),

    assignedCareGiver: Joi.object({
      name: Joi.string().required(),
      phoneNumber: Joi.string()
        .pattern(/^(?:0\d{9}|\+254\d{9})$/)
        .required()
        .messages({
          "string.pattern.base": "Caregiver phone must be 07XXXXXXXX or +2547XXXXXXXX",
        }),
    }).required(),

    createdAt: Joi.string().optional(),
    updatedAt: Joi.string().optional(),
  });

  return schema.validate(input);
};


module.exports ={
    validatePatientInput,
    validateCareGiverInput,
    validateAlertInput,
    validateDoctorInput,
    validateAdminInput,
    validateVitalInput,
    validateAppointmentInput
}