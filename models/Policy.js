const mongoose = require('mongoose');

const policySchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        unique: true
    },
    description: {
        type: String,
        required: true,
    },
    org_id: {
        type: String,
        ref: 'Organization',
        required: true
    },
    createdBy: {
        type: String,
        ref: 'Employee',
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const Policy = mongoose.model('Policy', policySchema);

module.exports = Policy;
