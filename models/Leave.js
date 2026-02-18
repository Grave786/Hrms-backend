const mongoose = require('mongoose');

const leaveSchema = new mongoose.Schema({
    leave_id: {
        type: String,
        required: true,
        unique: true,
    },
    employee_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        required: true,
    },
    leave_type: {
        type: String,
        required: true,
        enum: ['Sick', 'Vacation', 'Casual', 'Compensation', 'Other'],
    },
    start_date: {
        type: Date,
        required: true,
    },
    end_date: {
        type: Date,
        required: true, 
    },
    status: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected'],
        default: 'Pending', 
    },
    manager_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee'
    },
    approval_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        default: null,
    },
    reason: {
        type: String,
        required: true,
    },
    medical_certificate: {
        type: String,
        default: null,
    },
    created_at: {
        type: Date,
        default: Date.now,
    },
    updated_at: {
        type: Date,
        default: Date.now,
    },
});



const Leave = mongoose.model('Leave', leaveSchema);
module.exports = Leave;
