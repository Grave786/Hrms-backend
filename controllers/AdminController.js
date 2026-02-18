const SuperAdmin = require("../models/SuperAdmin");
const Role = require("../models/Role");
const Department = require("../models/Department");
const Employee = require("../models/Employee");
const Permission = require("../models/Permission");
const Organization = require("../models/Organization");
const jwt = require("jsonwebtoken");

const getAdminsByAdmin = async (req, res) => {
    const token = req.cookies.token;
    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Unauthorized: No token provided',
        });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await SuperAdmin.findById(decoded.userId) || await Employee.findById(decoded.userId);
    if (!user) {
        return res.status(401).json({

            success: false,
            message: 'Unauthorized: User not found',
        })
    }

    try {
        const users = await SuperAdmin.find({
            role: 'admin'
        });

        res.status(200).json(users);

    } catch (error) {
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

const createPermission = async (req, res) => {
    const token = req.cookies.token;
    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Unauthorized: No token provided',
        });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await SuperAdmin.findById(decoded.userId) || await Employee.findById(decoded.userId);
    if (!user) {
        return res.status(401).json({

            success: false,
            message: 'Unauthorized: User not found',
        })
    }

    const role = user.role;
    const orgId = user.org_id;
    const { permission_name, org_id } = req.body;

    try {
        let permission
        if (role == 'superadmin') {
            permission = new Permission({
                permission_name,
                org_id 
            });

        } else {
            permission = new Permission({
                permission_name,
                org_id: orgId 
            });

        }

        const existingPermission = await Permission.findOne({ permission_name, org_id });
        if (existingPermission) {
            return res.status(400).json({
                success: false,
                message: 'Permission with this name already exists for the organization',
            });
        }

        const organization = await Organization.find({ org_id });
        if (!organization) {
            return res.status(400).json({
                success: false,
                message: 'Organization not found',
            });
        }


        await permission.save();

        res.status(201).json({
            success: true,
            message: 'Permission created successfully',
            permission,
        });
    } catch (error) {
        if (error.code === 11000) {
            res.status(400).json({
                success: false,
                message: 'Permission with this name already exists for the organization',
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Error creating permission',
                error: error.message,
            });
        }
    }
};

const updatePermission = async (req, res) => {
    const { permissionId } = req.params;
    const { permission_name, org_id } = req.body;

    try {
        const updatedPermission = await Permission.findByIdAndUpdate(
            permissionId,
            { permission_name, org_id, updated_at: Date.now() },
            { new: true, runValidators: true }
        );

        if (!updatedPermission) {
            return res.status(404).json({
                success: false,
                message: 'Permission not found',
            });
        }

        res.status(200).json({
            success: true,
            message: 'Permission updated successfully',
            permission: updatedPermission,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating permission',
            error: error.message,
        });
    }
};

const getAllPermissions = async (req, res) => {
    const token = req.cookies.token;
    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Unauthorized: No token provided',
        });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await SuperAdmin.findById(decoded.userId) || await Employee.findById(decoded.userId);
    if (!user) {
        return res.status(401).json({
            success: false,
            message: 'Unauthorized: User not found',
        })
    }

    const { role, org_id } = user;

    try {
        let permissions;
        if (role === 'superadmin') {
            permissions = await Permission.find({});
        } else if (role === 'admin') {
            permissions = await Permission.find({ org_id });
        } else {
            return res.status(403).json({
                success: false,
                message: 'You do not have access to view permissions.',
            });
        }

        res.status(200).json({
            success: true,
            permissions,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching permissions',
            error: error.message,
        });
    }
};

const getPermission = async (req, res) => {
    const { permissionId } = req.params;

    const token = req.cookies.token;
    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Unauthorized: No token provided',
        });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await SuperAdmin.findById(decoded.userId) || await Employee.findById(decoded.userId);
    if (!user) {
        return res.status(401).json({
            success: false,
            message: 'Unauthorized: User not found',
        })
    }

    let roleId = user.role || user.role_id;
    if (user.role_id) {
        const role = await Role.findById(roleId);
        roleId = role.role_name;
    }
    const { org_id } = user;

    try {
        const permission = await Permission.findById(permissionId);
        if (!permission) {
            return res.status(404).json({
                success: false,
                message: 'Permission not found',
            });
        }

        if (roleId !== 'superadmin' && permission.org_id !== org_id) {
            return res.status(403).json({
                success: false,
                message: 'You do not have access to view this permission.',
            });
        }

        res.status(200).json({
            success: true,
            permission,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching permission',
            error: error.message,
        });
    }
};

const deletePermission = async (req, res) => {
    const { permissionId } = req.params;

    const token = req.cookies.token;
    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Unauthorized: No token provided',
        });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await SuperAdmin.findById(decoded.userId) || await Employee.findById(decoded.userId);
    if (!user) {
        return res.status(401).json({

            success: false,
            message: 'Unauthorized: User not found',
        })
    }

    const role = user.role;
    const orgId = user.org_id;

    try {
        const deletedPermission = await Permission.findByIdAndDelete(permissionId);

        if (!deletedPermission) {
            return res.status(404).json({
                success: false,
                message: 'Permission not found',
            });
        }

        if (role !== 'superadmin' && deletedPermission.org_id !== orgId) {
            return res.status(403).json({
                success: false,
                message: 'You do not have access to delete this permission.',
            });
        }

        res.status(200).json({
            success: true,
            message: 'Permission deleted successfully',
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting permission',
            error: error.message,
        });
    }
};

const createRole = async (req, res) => {
    const { role_name, org_id, permissions, vacancies } = req.body;

    if (role_name.toLowerCase() == "admin" || role_name.toLowerCase() == "superadmin") {
        return res.status(400).json({ success: false, message: "Role name cannot be Admin or SuperAdmin" });
    }

    const token = req.cookies.token;

    if (!token) {
        return res.status(401).json({ success: false, message: "Unauthorized: No token provided" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await SuperAdmin.findById(decoded.userId) || await Employee.findById(decoded.userId);
        if (!user) {
            return res.status(401).json({ success: false, message: "Unauthorized: User not found" });
        }

        const organization = user.org_id || req.user.org_id || org_id;

        const newRole = new Role({
            role_name, org_id: organization, permissions: [
                "CreateLeaveRequest",
                "UpdateLeaveRequest",
                "DeleteLeaveRequest",
                "GetLeaveRequest",
                "ApplyForResignation",
                "GetAttendanceRecord",
                "update-profile", "mark-attendance", "update-efforts", "view-profile"
            ], vacancies
        });

        const existingRole = await Role.find({ role_name, org_id: organization });

        if (existingRole.length != 0) {
            return res.status(400).json({ success: false, message: "Role already exists" });
        }

        // Handle permissions
        if (permissions && permissions.length > 0 && permissions != []) {
            const validPermissions = await Permission.find({ permission_name: { $in: permissions } });
            const validPermissionNames = validPermissions.map(p => p.permission_name);
            const newValidPermissions = permissions.filter(permission => validPermissionNames.includes(permission));

            if (newValidPermissions.length !== permissions.length) {
                return res.status(400).json({ success: false, message: "One or more permissions are invalid." });
            }

            newRole.permissions = [...new Set([...newRole.permissions, ...newValidPermissions])];
        }

        await newRole.save();
        res.status(200).json({ success: true, message: "Role created successfully", role: newRole });

    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: "Role already exists" });
        }
        res.status(500).json({ success: false, message: "Internal server error: " + error.message || "Something went wrong" });
    }
}

const updateRole = async (req, res) => {
    const { id } = req.params;
    const { role_name, org_id, permissions, vacancies } = req.body;

    if (role_name.toLowerCase() == "admin" || role_name.toLowerCase() == "superadmin") {
        return res.status(400).json({ success: false, message: "Role name cannot be Admin or SuperAdmin" });
    }

    try {
        let role = await Role.findById(id);

        if (!role) {
            return res.status(404).json({ success: false, message: "Role not found" });
        }

        if (role_name) role.role_name = role_name;
        if (org_id) role.org_id = org_id;
        if (vacancies) role.vacancies = vacancies;

        if (permissions && permissions.length > 0) {
            const validPermissions = await Permission.find({ permission_name: { $in: permissions } });
            const validPermissionNames = validPermissions.map(p => p.permission_name);
            const newValidPermissions = permissions.filter(permission => validPermissionNames.includes(permission));

            role.permissions = newValidPermissions;
        }

        role.updated_at = Date.now();
        await role.save();

        res.status(200).json({ success: true, message: "Role updated successfully", role });
    } catch (error) {
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

const getAllRoles = async (req, res) => {
    const token = req.cookies.token;
    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Unauthorized: No token provided',
        });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await SuperAdmin.findById(decoded.userId) || await Employee.findById(decoded.userId);
    if (!user) {
        return res.status(401).json({
            success: false,
            message: 'Unauthorized: User not found',
        });
    }

    const { role, org_id } = user;

    let roles;
    try {
        if (role === 'superadmin') {
            roles = await Role.find().populate('_id', 'org_id');
        } else {
            roles = await Role.find({ org_id: org_id }).populate('_id', 'org_id');
        }

        roles = roles.map(role => ({
            ...role.toObject(),
            permissions: role.permissions ? role.permissions.sort() : []
        }));

        res.status(200).json({ success: true, roles });
    } catch (error) {
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

const getRole = async (req, res) => {
    const { id } = req.params;

    const token = req.cookies.token;
    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Unauthorized: No token provided',
        });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await SuperAdmin.findById(decoded.userId) || await Employee.findById(decoded.userId);
    if (!user) {
        return res.status(401).json({

            success: false,
            message: 'Unauthorized: User not found',
        })
    }

    let roleId = user.role || user.role_id;
    if (user.role_id) {
        const role = await Role.findById(roleId);
        roleId = role.role_name;
    }
    const { org_id } = user;

    try {
        const role = await Role.findById(id).populate('permissions');

        if (!role) {
            return res.status(404).json({ success: false, message: "Role not found" });
        }

        if (roleId !== 'superadmin' && role.org_id !== org_id) {
            return res.status(403).json({ success: false, message: "Unauthorized: User not authorized" });
        }

        res.status(200).json({ success: true, role });
    } catch (error) {
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

const deleteRole = async (req, res) => {
    const { id } = req.params;

    const token = req.cookies.token;
    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Unauthorized: No token provided',
        });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await SuperAdmin.findById(decoded.userId) || await Employee.findById(decoded.userId);
    if (!user) {
        return res.status(401).json({

            success: false,
            message: 'Unauthorized: User not found',
        })
    }

    const orgId = user.org_id;

    try {
        const ROLE = await Role.findById(id);
        if (!ROLE) {
            return res.status(404).json({ success: false, message: "Role not found" });
        }
        if (user.role !== 'superadmin' && ROLE.org_id !== orgId) {
            return res.status(403).json({ success: false, message: "Unauthorized: User not authorized" });
        }
        const role = await Role.findByIdAndDelete(id);
        if (!role) {
            return res.status(404).json({ success: false, message: "Role not found" });
        }

        res.status(200).json({ success: true, message: "Role deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

const createDepartment = async (req, res) => {
    const token = req.cookies.token;
    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Unauthorized: No token provided',
        });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await SuperAdmin.findById(decoded.userId) || await Employee.findById(decoded.userId);
    if (!user) {
        return res.status(401).json({
            success: false,
            message: 'Unauthorized: User not found',
        })
    }

    const role = user.role;
    const orgId = user.org_id;
    const { dept_id, dept_name, org_id } = req.body;
    try {
        const lastDepartment = await Department.findOne().sort({ dept_id: -1 });
        const serialNumber = lastDepartment ? parseInt(lastDepartment.dept_id.slice(4)) + 1 : 1;
        const paddedSerialNumber = serialNumber.toString().padStart(3, '0');
        const NewDept_id = `DEPT${paddedSerialNumber}`;

        if (role == 'superadmin') {
            const department = new Department({ dept_id: NewDept_id, dept_name, org_id });
            await department.save();
            res.status(200).json({ success: true, message: "Department created successfully", department });
        } else {
            const department = new Department({ dept_id, dept_name, org_id: orgId });
            await department.save();
            res.status(200).json({ success: true, message: "Department created successfully", department });
        }
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: "Department ID already exists for this organization." });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

const updateDepartment = async (req, res) => {
    const { id } = req.params;
    const { dept_name, org_id } = req.body;

    try {
        let department = await Department.findById(id);
        if (!department) {
            return res.status(404).json({ success: false, message: "Department not found" });
        }

        if (dept_name) department.dept_name = dept_name;
        if (org_id) department.org_id = org_id;

        department.updated_at = new Date();

        await department.save();

        res.status(200).json({ success: true, message: "Department updated successfully", department });
    } catch (error) {
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

const getAllDepartments = async (req, res) => {
    const token = req.cookies.token;
    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Unauthorized: No token provided',
        });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await SuperAdmin.findById(decoded.userId) || await Employee.findById(decoded.userId);
    if (!user) {
        return res.status(401).json({

            success: false,
            message: 'Unauthorized: User not found',
        })
    }

    const { role, org_id } = user;
    try {
        if (role !== 'superadmin') {
            const departments = await Department.find({ org_id });
            res.status(200).json({ success: true, departments });
            return;
        } else {
            const departments = await Department.find();
            res.status(200).json({ success: true, departments });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

const getDepartment = async (req, res) => {
    const { id } = req.params;

    const token = req.cookies.token;
    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Unauthorized: No token provided',
        });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await SuperAdmin.findById(decoded.userId) || await Employee.findById(decoded.userId);
    if (!user) {
        return res.status(401).json({
            success: false,
            message: 'Unauthorized: User not found',
        })
    }

    let roleId = user.role || user.role_id;
    if (user.role_id) {
        const role = await Role.findById(roleId);
        roleId = role.role_name;
    }
    const { org_id } = user;

    try {
        const department = await Department.findById(id);
        if (!department) {
            return res.status(404).json({ success: false, message: "Department not found" });
        }

        if (roleId !== 'superadmin' && department.org_id !== org_id) {
            return res.status(403).json({ success: false, message: "Unauthorized access" });
        }

        res.status(200).json({ success: true, department });
    } catch (error) {
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

const deleteDepartment = async (req, res) => {
    const { id } = req.params;
    const token = req.cookies.token;
    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Unauthorized: No token provided',
        });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await SuperAdmin.findById(decoded.userId) || await Employee.findById(decoded.userId);
    if (!user) {
        return res.status(401).json({

            success: false,
            message: 'Unauthorized: User not found',
        })
    }

    const role = user.role;
    const orgId = user.org_id;

    try {
        const department = await Department.findByIdAndDelete(id);

        if (role !== 'superadmin' && department.org_id !== orgId) {
            return res.status(403).json({ success: false, message: "Unauthorized access" });
        }

        if (!department) {
            return res.status(404).json({ success: false, message: "Department not found" });
        }

        res.status(200).json({ success: true, message: "Department deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};


module.exports = { getAdminsByAdmin, createPermission, updatePermission, getAllPermissions, getPermission, deletePermission, createRole, updateRole, getAllRoles, getRole, deleteRole, createDepartment, updateDepartment, getAllDepartments, getDepartment, deleteDepartment, };   
