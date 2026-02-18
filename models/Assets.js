const mongoose = require('mongoose');

const assetSchema = new mongoose.Schema({
    asset_id: {
        type: String,
        required: true,
        unique: true,
    },
    employee_id: {
        type: String,
        ref: 'Employee',
        required: true,
    },
    org_id: {
        type: String,
        ref: 'Organization',
        required: true,
    },
    asset_type: {
        type: String,
        required: true,
    },
    asset_details: {
        type: String,
        required: true,
    },
    assigned_date: {
        type: Date,
        required: true,
    },
    purchased_date: {
        type: Date,
        required: true,
    },      
    status: {
        type: String,
        enum: ["Available", "Assigned", "Returned", "Under Maintenance", "Expired"],
        default: "Available",
    },
    returned_date: {
        type: Date,
        default: null,
    },
    remarks: {
        type: String,
        default: null,
    },
}, { timestamps: true });

const Asset = mongoose.model('Asset', assetSchema);

module.exports = Asset;
