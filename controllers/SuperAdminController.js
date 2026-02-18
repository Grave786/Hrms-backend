const SuperAdmin = require('../models/SuperAdmin');
const Organization = require('../models/Organization');
const bcrypt = require('bcryptjs');

const addAdmin = async (req, res) => {
    const { first_name, last_name, email, password, org_id, role, phone } = req.body;
    try {
        const exists = await SuperAdmin.findOne({ email });
        if (exists) {
            return res.status(400).json({ msg: 'User already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);
        const superAdmin = new SuperAdmin({ name: `${first_name} ${last_name}`, first_name, last_name, email, org_id, role, password: hash, previewPassword: password, phone });
        await superAdmin.save();
        res.status(201).json(superAdmin);
    } catch (err) {
        res.status(500).json({ msg: 'Server Error' });
    }
};

const updateAdmin = async (req, res) => {
    const { id } = req.params;
    const { first_name, last_name, email, password, previewPassword, role, phone, org_id } = req.body;

    try {
        let admin = await SuperAdmin.findById(id);
        if (!admin) {
            return res.status(404).json({ msg: 'Admin not found' });
        }

        // Check if email already exists for another user
        if (email && email !== admin.email) {
            const emailExists = await SuperAdmin.findOne({ email });
            if (emailExists) {
                return res.status(400).json({ msg: 'Email already taken by another user' });
            }
        }

        if (first_name) admin.first_name = first_name;
        if (last_name) admin.last_name = last_name;
        if (email) admin.email = email;
        if (role) admin.role = role;
        if (phone) admin.phone = phone;
        if (org_id) admin.org_id = org_id;
        if (org_id == '') admin.org_id = null;

        if (previewPassword && previewPassword != ''){
            admin.previewPassword = previewPassword;
            admin.password = await bcrypt.hash(previewPassword, 10) || admin.password;
        }
        admin.updatedAt = new Date();
        await admin.save();

        res.status(200).json({ msg: 'Admin updated successfully', admin });
    } catch (err) {
        res.status(500).json({ msg: 'Server Error' });
    }
};

const getAdminsBySuperAdmin = async (req, res) => {
    try {
        const users = await SuperAdmin.find();
        res.status(200).json(users);
        
    } catch (error) {
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}

const getAdmin = async (req, res) => {
    try {
        const user = await SuperAdmin.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        res.status(200).json({ success: true, user });
    } catch (error) {
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}

const deleteAdmin = async (req, res) => {
    try {
        const userId = req.params.id;
        
        //check if user is trying to delete self
        if(userId === req.user.id) {
            return res.status(400).json({ success: false, message: "Cannot delete yourself" });
        }
        
        //check if user is trying to delete super admin
        const checkSuperAdmin = await SuperAdmin.findById(userId);
        if(checkSuperAdmin.role === 'SuperAdmin') {
            return res.status(400).json({ success: false, message: "Cannot delete super admin" });
        }
        
        const user = await SuperAdmin.findByIdAndDelete(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        res.status(200).json({ success: true, message: "User deleted successfully" });
        
    } catch (error) {
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}

const createOrganization = async (req, res) => {
    const { org_name, location, org_type, admin_id } = req.body;
    try {
        const organization = new Organization({ org_name, location, org_type, admin_id });
        await organization.save();
        res.status(200).json({ success: true, message: "Organization created successfully", organization });
    } catch (error) {
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}

const updateOrganization = async (req, res) => {
    const { id } = req.params;
    const { org_name, location, org_type, admin_id } = req.body;

    try {
        let organization = await Organization.findById(id);
        if (!organization) {
            return res.status(404).json({ success: false, message: "Organization not found" });
        }
        
        if (org_name) organization.org_name = org_name;
        if (location) organization.location = location;
        if (org_type) organization.org_type = org_type;
        if (admin_id) organization.admin_id = admin_id;
        
        organization.updated_at = Date.now();
        
        await organization.save();
        
        res.status(200).json({ success: true, message: "Organization updated successfully", organization });
    } catch (error) {
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

const getAllOrganizations = async (req, res) => {
    try {
        const organizations = await Organization.find();
        res.status(200).json({ success: true, organizations });
    } catch (error) {
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

const getOrganization = async (req, res) => {
    try {
        const organization = await Organization.findById(req.params.id);
        if (!organization) {
            return res.status(404).json({ success: false, message: "Organization not found" });
        }
        res.status(200).json({ success: true, organization });
    } catch (error) {
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}

const getOrganizationForLoggedInUser = async (req, res) => {
    try {        
        const organization = await Organization.findOne({ org_id: req.user.org_id });
        
        if (!organization) {
            return res.status(404).json({ success: false, message: "Organization not found" });
        }
        res.status(200).json({ success: true, organization });
    } catch (error) {
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}

const deleteOrganization = async (req, res) => {
    try {
        const { id } = req.params;

        const organization = await Organization.findByIdAndDelete(id);
        if (!organization) {
            return res.status(404).json({ success: false, message: "Organization not found" });
        }
        res.status(200).json({ success: true, message: "Organization deleted successfully" });
        
    } catch (error) {
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

const decryptPassword = async (password) => {
    const salt = await bcrypt.genSalt(10);
    const hash = bcrypt.decodeBase64(password, salt);
    return hash;
}


module.exports = { addAdmin, updateAdmin, getAdminsBySuperAdmin, getAdmin, deleteAdmin, createOrganization, updateOrganization, getAllOrganizations, getOrganization, getOrganizationForLoggedInUser, deleteOrganization, decryptPassword };