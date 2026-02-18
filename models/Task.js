const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    task_id: {
        type: String,
        required: true,
        unique: true,
    },
    project_id: {
        type: String,
        ref: 'Project',
        required: true,
    },
    org_id: {
        type: String,
        ref: 'Organization',
        required: true,
    },
    assigned_by: {
        type: String,
        ref: 'Employee',
        required: true,
    },
    assigned_to: {
        type: String,
        ref: 'Employee',
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    deadline: {
        type: Date,
        required: true,
    },
    status: {
        type: String,
        enum: ['pending', 'in-progress', 'completed', 'on-hold', 'waiting-for-approval'],
        default: 'in-progress',
        required: true,
    },
    remark: {
        type: String,
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

taskSchema.pre('save', function (next) {
    this.updated_at = Date.now();
    next();
});

const Task = mongoose.model('Task', taskSchema);
module.exports = Task;
