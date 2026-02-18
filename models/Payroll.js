const mongoose = require('mongoose');

const DeductionSchema = new mongoose.Schema({
    amount: { type: Number, required: true },
    description: { type: String },
}, { _id: false }); 


const PayrollSchema = new mongoose.Schema({
    employee_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
    org_id: { type: String, ref: 'Organization', required: true },
    salary: { type: Number, required: true },
    bonuses: { type: Number, default: 0 },
    deductions: [DeductionSchema],
    net_pay: { type: Number, required: true },
    payment_date: { type: Date, required: true },
    salary_month: { type: String, required: true }, 
    salary_year: { type: Number, required: true }
});

module.exports = mongoose.model('Payroll', PayrollSchema);