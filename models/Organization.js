const mongoose = require('mongoose');

const OrganizationSchema = new mongoose.Schema({
    org_id: { type: String, unique: true },
    org_name: { type: String, required: true },
    location: { type: String, required: true },
    org_type: { type: String, enum: ['IT', 'Corporation', 'Governmental', 'NGO', 'Educational', 'Healthcare', 'SME', 'NPO', 'Startup', 'MNC', 'Religious', 'Partnership', 'Other'], default: 'Other' },
    admin_id: { type: mongoose.Schema.Types.ObjectId, ref: 'SuperAdmin' },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
});

//function to create custom organization id
function generateOrgId(org) {
    const orgNameCode = org.org_name.slice(0, 3).toUpperCase(); 
    const orgTypeCode = org.org_type.slice(0, 3).toUpperCase(); 
    const locationCode = org.location.slice(0, 3).toUpperCase(); 
    
    const createdDate = new Date(org.created_at);
    const day = String(createdDate.getDate()).padStart(2, '0');  
    const month = String(createdDate.getMonth() + 1).padStart(2, '0'); 
    const year = createdDate.getFullYear();
    const formattedDate = `${day}${month}${year}`;  // Format to dd/mm/yyyy
    
    return `${orgNameCode}-${orgTypeCode}-${locationCode}-${formattedDate}`;
  }
  
  OrganizationSchema.pre('save', function (next) {
    if (this.isNew) {
      this.org_id = generateOrgId(this);
    }
    next();
  });


const Organization = mongoose.model('Organization', OrganizationSchema);
module.exports = Organization