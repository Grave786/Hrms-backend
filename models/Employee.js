const mongoose = require('mongoose');

const DeductionSchema = new mongoose.Schema({
    amount: { type: Number, required: true },
    description: { type: String },
}, { _id: false });

const EmployeeSchema = new mongoose.Schema({
    emp_id: { type: String, unique: true },
    avatar: {
        type: String,
        default: ''
    },
    name: {
        type: String,
        required: true
    },
    first_name: { type: String, required: true },
    last_name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    previewPassword: { type: String, required: true },
    phone: { type: String, required: true },
    org_id: { type: String, ref: 'Organization', required: true },
    dept_id: { type: String, ref: 'Department', required: true },
    role_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Role' },
    additional_permissions: { type: [String] },
    blocked_permissions: { type: [String] },
    manager_id: { type: String, ref: 'Employee' },
    status: { type: String, enum: ['Active', 'Inactive', 'On Notice Period'], default: 'Active' },
    JoiningDate: { type: Date, required: true },
    deviceinfo: {
        type: String,
        default: ''
    },
    resignation_date: { type: Date },
    address: { type: String },
    salary: { type: Number, required: true },
    deductions: [DeductionSchema],
    location: {
        latitude: {
            type: Number,
            default: 0
        },
        longitude: {
            type: Number,
            default: 0
        }
    },
    attendance: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'ParentAttendance'
        }
    ],
    lastSeenAnnouncement: { type: Date, default: Date.now },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

EmployeeSchema.pre('save', function (next) {
    this.updated_at = Date.now();
    next();
});

const Employee = mongoose.model('Employee', EmployeeSchema);
module.exports = Employee;
