const mongoose = require('mongoose');
const EffortSchema = require('./Effort').schema;

const AttendanceSchema = new mongoose.Schema({
    date: {
        type: Date,
        default: Date.now, // ensures one attendance record per day
    },
    checkoutAt: {
        type: String,
    },
    checkinAt: {
        type: String,
        
    },
    status: {
        type: String,
        enum: ['Full-Day', 'Half-Day', 'Absent','Pending'],
        default: 'Half-Day'
    },
    reason: { type: String },
    reasonApprovedBy: { type: String },
    request: { type: Boolean, default: false },
    efforts: [EffortSchema] 
});

module.exports = mongoose.model('Attendance', AttendanceSchema);
