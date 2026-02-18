const mongoose = require('mongoose');
const Organization = require('./Organization');

const RoleSchema = new mongoose.Schema({
    role_id: { type: String, unique: true },
    role_name: { type: String, required: true },
    org_id: { type: String, ref: 'Organization', required: true }, 
    permissions: {
        type: [String],
        default: [
            "CreateLeaveRequest", 
            "UpdateLeaveRequest", 
            "DeleteLeaveRequest", 
            "GetLeaveRequest", 
            "ApplyForResignation", 
            "GetAttendanceRecord",
            "update-profile", "mark-attendance", "update-efforts", "view-profile"
        ]
    },    
    vacancies: { type: Number, default: 0 },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
});

RoleSchema.pre('save', async function (next) {
    if (this.isNew) {
        try {
            // Find the organization based on org_id
            const organization = await Organization.findOne({org_id: this.org_id});
            if (!organization) {
                throw new Error('Organization not found');
            }

            // Get the organization name and format it for role_id
            const org_name = organization.org_name.replace(" ", "-");
            const role_name = this.role_name;

            // Get the serial number by counting existing roles with the same role_name and org_id
            const count = await this.model('Role').countDocuments({
                role_name: role_name,
                org_id: this.org_id
            });

            // Generate the role_id in the format: "ROLE_NAME-ORG_NAME-SERIAL_NUMBER"
            this.role_id = `${role_name}-${org_name}-${count + 1}`;
        } catch (error) {
            return next(error);
        }
    }
    next();
});

const Role = mongoose.model('Role', RoleSchema);
module.exports = Role;
