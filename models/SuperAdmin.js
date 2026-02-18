const mongoose = require('mongoose');

const SuperAdminSchema = new mongoose.Schema({
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
    phone: { type: String },
    role: { type: String, enum: ['superadmin', 'admin'], default: 'admin' },
    org_id: { type: String, ref: 'Organization' },
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
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    JoiningDate: {
        type: Date,
        default: Date.now
    },
    deviceinfo:{
        type: String,
        default: ''
       }
});

const SuperAdmin = mongoose.model('SuperAdmin', SuperAdminSchema);
module.exports = SuperAdmin