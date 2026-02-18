const mongoose = require('mongoose');

const resignationSchema = new mongoose.Schema({
    employee_id: { type: String, ref: 'Employee', required: true },
    org_id: { type: String, ref: 'Organization', required: true },
    resignation_date: { type: Date, default: Date.now }, 
    last_working_day: { type: Date, required: true },
    reason: { type: String, required: true },
    status: { type: String, default: 'Pending' },
});

const Resignation = mongoose.model('Resignation', resignationSchema);

module.exports = Resignation;
