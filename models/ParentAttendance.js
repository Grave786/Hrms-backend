const mongoose = require('mongoose');
const AttendanceSchema = require('./Attendance').schema;

const ParentAttendanceSchema = new mongoose.Schema({
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            refPath: 'userType', // Dynamically reference either AdminModel or UserModel
        },
        userType: {
            type: String,
            required: true,
            enum: ['SuperAdmin', 'Employee'], // Ensures valid model type
        },
        attendance: [AttendanceSchema],
    });
    
    

module.exports = mongoose.model('ParentAttendance', ParentAttendanceSchema);
