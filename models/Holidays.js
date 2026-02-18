const mongoose = require('mongoose');

const Holidays = new mongoose.Schema({
    holiday_name: { type: String, required: true },
    holiday_type: { type: String, required: true },
    holiday_date: { type: Date, required: true },
    org_id: { type: String, ref: 'Organization', required: true }
}, { timestamps: true });

const Holiday = mongoose.model('Holiday', Holidays)

module.exports = Holiday