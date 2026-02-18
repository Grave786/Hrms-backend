const jwt = require('jsonwebtoken');
const SuperAdmin = require('../models/SuperAdmin');
const Employee = require('../models/Employee');
const Role = require('../models/Role');
const Organization = require('../models/Organization');
const cookieParser = require('cookie-parser');
const express = require('express');
const app = express();
app.use(cookieParser());


const isSuperAdmin = async (req, res, next) => {
    try {
        const token = req.cookies.token;
        if (!token) {
            return res.status(401).json({ message: "Unauthorized: No token provided MIDDLEWARE" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await SuperAdmin.findById(decoded.userId);
        if (!user) {
            return res.status(401).json({ message: "User not found" });
        }

        if (user.role !== 'superadmin') {
            return res.status(403).json({ message: 'Unauthorized: User is not a super admin' });
        }
        req.user = user;
        next();
    } catch (error) {
        return res.status(500).json({ message: "Internal server error" });
    }
}

const isAdmin = async (req, res, next) => {
    try {
        const token = req.cookies.token;
        if (!token) {
            return res.status(401).json({ message: "Unauthorized: No token provided" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await SuperAdmin.findById(decoded.userId);
        if (!user) {
            return res.status(401).json({ message: "User not found" });
        }

        if (user.role !== 'superadmin') {

            if (user.role !== 'admin') {
                return res.status(403).json({ message: 'Unauthorized: User is not an admin' });
            }

            const { org_id } = req.body;
            if (org_id) {
                const organization = await Organization.findOne({ org_id: org_id });
                if (!organization) {
                    return res.status(404).json({ message: "Organization not found" });
                }

                if (organization.admin_id.toString() !== user._id.toString()) {
                    return res.status(403).json({ message: 'Unauthorized: You are not the admin of this organization' });
                }
            }

        }

        req.user = user;
        next();

    } catch (error) {
        return res.status(500).json({ message: "Internal server error" });
    }
};

const isHR = async (req, res, next) => {
    try {
        const token = req.cookies.token;

        if (!token) {
            return res.status(401).json({ message: "Unauthorized: No token provided" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await Employee.findById(decoded.userId)


        if (!user) {
            return res.status(401).json({ message: "User not found" });
        }

        const roles = await Role.findOne(user.role_id);

        if (roles.role_name !== 'HR') {
            return res.status(403).json({ message: 'Unauthorized: User is not an HR' });
        }

        req.user = user;
        next();
    } catch (error) {
        return res.status(500).json({ message: "Internal server error" });
    }
};

const isManager = async (req, res, next) => {
    try {
        const token = req.cookies.token;
        if (!token) {
            return res.status(401).json({ message: "Unauthorized: No token provided" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await Employee.findById(decoded.userId);
        if (!user) {
            return res.status(401).json({ message: "User not found" });
        }

        const role = await Role.findOne(user.role_id);

        if (role.role_name !== 'Manager') {
            return res.status(403).json({ message: 'Unauthorized: User is not a manager' });
        }
        req.user = user;
        next();
    } catch (error) {
        return res.status(500).json({ message: "Internal server error" });
    }
}

const isTL = async (req, res, next) => {
    try {
        const token = req.cookies.token;
        if (!token) {
            return res.status(401).json({ message: "Unauthorized: No token provided" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await Employee.findById(decoded.userId);
        if (!user) {
            return res.status(401).json({ message: "User not found" });
        }

        const role = await Role.findOne(user.role_id);

        if (role.role_name !== 'TL') {
            return res.status(403).json({ message: 'Unauthorized: User is not a TL' });
        }
        req.user = user;
        next();
    } catch (error) {
        return res.status(500).json({ message: "Internal server error" });
    }
}

const authenticateToken = (req, res, next) => {
    try {
        const token = req.cookies.token;
        if (!token) {
            return res.status(401).json({ success: false, message: "Unauthorized: No token provided" });
        }
        jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
            if (err) {
                return res.status(403).json({ success: false, message: "Unauthorized: Invalid token" });
            }
            req.user = user;
            next();
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

const checkPermission = (permissionKey) => {
    return async (req, res, next) => {
        try {
            const token = req.cookies.token;
            if (!token) {
                return res.status(401).json({ message: "Unauthorized: No token provided" });
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            let user = await SuperAdmin.findById(decoded.userId);
            if (!user) {
                user = await Employee.findById(decoded.userId);
            }
            if (!user) {
                return res.status(401).json({ message: "User not found" });
            }

            const userRoleId = user.role || user.role_id;
            const additionalPermissions = user.additional_permissions || [];
            const blockedPermissions = user.blocked_permissions || [];

            if (user.role_id) {
                const role = await Role.findOne(userRoleId);
                if (!role) {
                    return res.status(403).json({ message: 'Role not found' });
                }
                const rolePermissions = role.permissions || [];
                const allPermissions = [
                    ...new Set([...rolePermissions, ...additionalPermissions].filter(p => !blockedPermissions.includes(p)))
                ];

                const hasPermission = allPermissions.includes(permissionKey);
                if (hasPermission || userRoleId === 'admin' || userRoleId === 'superadmin') {
                    return next();
                } else {
                    return res.status(403).json({ message: 'Access Denied: Insufficient Permissions' });
                }
            } else {
                if (userRoleId === 'admin' || userRoleId === 'superadmin') {
                    return next();
                } else {
                    return res.status(403).json({ message: 'Access Denied: Insufficient Permissions' });
                }
            }
        } catch (error) {
            return res.status(500).json({ message: 'Internal Server Error' });
        }
    };
};


module.exports = { isSuperAdmin, isAdmin, isHR, isManager, isTL, authenticateToken, checkPermission };