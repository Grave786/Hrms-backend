const mongoose = require('mongoose');
const Organization = require('./Organization');

const DepartmentSchema = new mongoose.Schema({
    dept_id: { type: String },
    dept_name: { type: String, required: true },
    org_id: { type: String, ref: 'Organization', required: true },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
});

DepartmentSchema.pre('save', async function (next) {
    if (this.isNew) {
        try {
            // Check if the organization exists
            const organizationExists = await Organization.exists({ org_id: this.org_id });
            if (!organizationExists) {
                throw new Error('Invalid org_id: Organization does not exist.');
            }
        } catch (error) {
            return next(error);
        }
    }
    next();
}); 

const Department = mongoose.model('Department', DepartmentSchema);
module.exports = Department
