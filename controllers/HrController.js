const Employee = require('../models/Employee');
const RoleModel = require('../models/Role');
const Asset = require('../models/Assets');
const Resignation = require('../models/Resignation');
const Policy = require('../models/Policy');
const Payroll = require('../models/Payroll');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const SuperAdmin = require('../models/SuperAdmin');
const Organization = require('../models/Organization');
const Role = require('../models/Role');
const Announcement = require('../models/Announcements');
const Holiday = require('../models/Holidays');

const addEmployee = async (req, res) => {
    const {
        first_name,
        last_name,
        email,
        password,
        phone,
        org_id,
        dept_id,
        role_id,
        salary,
        deductions,
        manager_id,
        status,
        JoiningDate,
        address
    } = req.body;

    const token = req.cookies.token;
    if (!token) {
        console.error("No token provided");
        return res.status(401).json({
            success: false,
            message: 'Unauthorized: No token provided',
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await SuperAdmin.findById(decoded.userId) || await Employee.findById(decoded.userId);
        if (!user) {
            console.error("User not found with ID:", decoded.userId);
            return res.status(401).json({
                success: false,
                message: 'Unauthorized: User not found',
            });
        }

        let roleId = user.role || user.role_id;
        if (user.role_id) {
            const role = await Role.findById(roleId);
            roleId = role.role_name;
        }

        const orgId = user.org_id || org_id;

        // Check if the email already exists
        const mail = await Employee.findOne({ email });
        if (mail) {
            console.error(`Email ${email} already exists`);
            return res.status(400).json({ message: 'Email already exists' });
        }

        const role = await RoleModel.findById({ _id: role_id });
        if (!role) {
            console.error(`Role with role_id "${role_id}" not found`);
            return res.status(400).json({ message: `Role with role_id "${role_id}" not found` });
        }

        // Hash the password before saving
        const hashedPassword = await bcrypt.hash(password, 10);

        let managerId = manager_id;
        if (manager_id == "") {
            managerId = null;
        }

        // Generate a new employee ID
        const lastEmployee = await Employee.aggregate([
            {
                $addFields: {
                    lastThreeDigits: {
                        $substr: [
                            "$emp_id", // Field to extract from
                            { $subtract: [{ $strLenCP: "$emp_id" }, 3] }, // Start from 3 characters from the end
                            3 // Take 3 characters
                        ]
                    }
                }
            },
            { $sort: { lastThreeDigits: -1 } }, // Sort by the last 3 digits in descending order
            { $limit: 1 } // Get only the last (most recent) employee
        ]);
        const serialNumber = lastEmployee.length > 0
            ? parseInt(lastEmployee[0].lastThreeDigits) + 1
            : 1; // If no employee, start from 1
        const paddedSerialNumber = serialNumber.toString().padStart(3, '0');
        const NewEmp_id = `${orgId.slice(0, 3).toUpperCase()}${paddedSerialNumber}`;

        const newEmployee = new Employee({
            emp_id: NewEmp_id,
            name: `${first_name} ${last_name}`,
            first_name,
            last_name,
            email: email.toLowerCase(),
            password: hashedPassword, // Store the hashed password
            previewPassword: password,
            phone,
            org_id: orgId,
            dept_id,
            role_id,
            manager_id: managerId,
            salary,
            deductions,
            status: status || 'Active',
            JoiningDate,
            address
        });

        const savedEmployee = await newEmployee.save();
        res.status(201).json({
            message: 'Employee added successfully',
            employee: savedEmployee
        });
    } catch (error) {
        console.error("Error adding employee:", error.message);
        console.error("Stack trace:", error.stack);
        res.status(500).json({
            message: 'Error adding employee',
            error: error.message
        });
    }
};

const updateEmployee = async (req, res) => {
    const { id } = req.params;
    const {
        first_name,
        last_name,
        email,
        password,
        previewPassword,
        phone,
        org_id,
        dept_id,
        salary,
        deductions,
        additional_permissions,
        blocked_permissions,
        role_id,
        manager_id,
        status,
        JoiningDate,
        address
    } = req.body;

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

    const orgId = user.org_id;

    try {
        let employee = await Employee.findById(id);
        if (!employee) {
            return res.status(404).json({ success: false, message: "Employee not found" });
        }
        if (roleId != 'superadmin') {
            if (orgId != employee.org_id) {
                return res.status(401).json({
                    success: false,
                    message: 'Unauthorized: User not authorized to update this employee',
                });
            }
        }

        // If password is being updated, hash it
        if (previewPassword && previewPassword != '') {
            const hashedPassword = await bcrypt.hash(previewPassword, 10);
            employee.password = hashedPassword || employee.password;
            employee.previewPassword = previewPassword;
        }

        employee.first_name = first_name || employee.first_name;
        employee.last_name = last_name || employee.last_name;
        employee.email = email.toLowerCase() || employee.email;
        employee.phone = phone || employee.phone;
        employee.org_id = org_id || employee.org_id;
        employee.dept_id = dept_id || employee.dept_id;
        employee.role_id = role_id || employee.role_id;
        employee.manager_id = manager_id || employee.manager_id;
        employee.additional_permissions = additional_permissions || employee.additional_permissions;
        employee.blocked_permissions = blocked_permissions || employee.blocked_permissions;
        employee.status = status || employee.status;
        employee.salary = salary || employee.salary;
        employee.deductions = deductions || employee.deductions;
        employee.JoiningDate = JoiningDate || employee.JoiningDate;
        employee.address = address || employee.address;

        const updatedEmployee = await employee.save();

        res.status(200).json({
            message: "Employee updated successfully",
            employee: updatedEmployee
        });
    } catch (error) {
        res.status(500).json({
            message: "Error updating employee",
            error: error.message
        });
    }
};

const getAllEmployees = async (req, res) => {
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
    let role;

    let roleId = user.role || user.role_id;
    if (user.role_id) {
        role = await Role.findById(roleId);
        roleId = role.role_name;
    }
    const { org_id, dept_id } = user;

    try {
        let employees;
        if (roleId === 'superadmin') {
            employees = await Employee.find();
        } else if (roleId === 'admin' || role.permissions.includes('GetAllEmployees')) {
            employees = await Employee.find({ org_id });
        } else if (roleId) {
            employees = await Employee.find({ dept_id });
        } else {
            return res.status(403).json({
                success: false,
                message: 'You do not have access to view permissions.',
            });
        }

        res.status(200).json({
            success: true,
            employees
        });
    } catch (error) {
        res.status(500).json({
            message: "Error fetching employees",
            error: error.message
        });
    }
};

const getEmployee = async (req, res) => {
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
        const employee = await Employee.findById(id) || await SuperAdmin.findById(id);
        if (!employee) {
            return res.status(404).json({ success: false, message: "Employee not found" });
        }

        if (roleId !== 'superadmin' && org_id != employee.org_id) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized: User not authorized to view this employee',
            });
        }

        res.status(200).json({
            success: true,
            employee
        });
    } catch (error) {
        res.status(500).json({
            message: "Error fetching employee",
            error: error.message
        });
    }
};

const deleteEmployee = async (req, res) => {
    const { id } = req.params;

    try {
        const employee = await Employee.findByIdAndDelete(id);
        if (!employee) {
            return res.status(404).json({ success: false, message: "Employee not found" });
        }

        res.status(200).json({
            success: true,
            message: "Employee deleted successfully"
        });
    } catch (error) {
        res.status(500).json({
            message: "Error deleting employee",
            error: error.message
        });
    }
};

const assignAsset = async (req, res) => {
    const { asset_id, employee_id, org_id, asset_type, asset_details, assigned_date, purchased_date, status, returned_date } = req.body;
    const token = req.cookies.token;

    if (!token) {
        return res.status(401).json({ success: false, message: "Unauthorized: No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await SuperAdmin.findById(decoded.userId) || await Employee.findById(decoded.userId);
    if (!user) {
        return res.status(401).json({ success: false, message: "Unauthorized: User not found" });
    }

    const orgId = user.org_id;

    try {
        const newAssetAssignment = new Asset({
            asset_id,
            employee_id,
            org_id: org_id || orgId,
            asset_type,
            asset_details,
            assigned_date,
            purchased_date,
            status,
            returned_date: returned_date || null,
        });

        await newAssetAssignment.save();

        res.status(201).json({
            message: 'Asset assigned successfully',
            asset: newAssetAssignment,
        });
    } catch (error) {
        res.status(400).json({
            message: 'Error assigning asset',
            error: error.message,
        });
    }
};

const updateAsset = async (req, res) => {
    const { asset_id } = req.params;
    const { employee_id, org_id, asset_type, asset_details, assigned_date, status, returned_date, remarks } = req.body;

    try {
        let asset = await Asset.findOne({ asset_id: asset_id });
        if (!asset) {
            return res.status(404).json({ success: false, message: "Asset not found" });
        }

        asset.employee_id = employee_id || asset.employee_id;
        asset.org_id = org_id || asset.org_id;
        asset.asset_type = asset_type || asset.asset_type;
        asset.asset_details = asset_details || asset.asset_details;
        asset.assigned_date = assigned_date || asset.assigned_date;
        asset.status = status || asset.status;
        asset.returned_date = returned_date || asset.returned_date;
        asset.remarks = remarks || asset.remarks;

        const updatedAsset = await asset.save();

        res.status(200).json({
            message: "Asset updated successfully",
            asset: updatedAsset,
        });
    } catch (error) {
        res.status(500).json({
            message: "Error updating asset",
            error: error.message,
        });
    }
};

const getAllAssets = async (req, res) => {
    const token = req.cookies.token;

    if (!token) {
        return res.status(401).json({ success: false, message: "Unauthorized: No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await SuperAdmin.findById(decoded.userId) || await Employee.findById(decoded.userId);
    if (!user) {
        return res.status(401).json({ success: false, message: "Unauthorized: User not found" });
    }

    const role = user.role || user.role_id;

    try {
        if (role !== "superadmin") {
            const assets = await Asset.find({ org_id: user.org_id });
            return res.status(200).json({
                success: true,
                assets: assets
            });
        } else {
            const assets = await Asset.find();
            return res.status(200).json({
                success: true,
                assets: assets
            });
        }

    } catch (error) {
        res.status(500).json({
            message: "Error fetching assets",
            error: error.message
        });
    }
};

const getAssetsForEmployee = async (req, res) => {
    const id = req.params.id;

    const employee = await Employee.findOne({ _id: id });

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
        if (roleId !== "superadmin" && employee.org_id !== org_id) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized: User does not have access to this employee\'s assets',
            })
        }
        const assets = await Asset.find({ employee_id: employee.emp_id });
        if (assets) {
            return res.status(200).json({
                success: true,
                assets: assets
            });
        } else {
            return res.status(200).json({
                success: true,
                assets: []
            })
        }
    } catch (error) {
        res.status(500).json({
            message: "Error fetching assets",
            error: error.message
        });
    }
};

const getAsset = async (req, res) => {
    const { asset_id } = req.params;

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
        const asset = await Asset.findOne({ asset_id });
        if (!asset) {
            return res.status(404).json({ success: false, message: "Asset not found" });
        }

        if (roleId !== "superadmin" && asset.org_id !== org_id) {
            return res.status(403).json({ success: false, message: "Unauthorized: Access denied" });
        }

        res.status(200).json({
            success: true,
            asset: asset,
        });
    } catch (error) {
        res.status(500).json({
            message: "Error fetching asset",
            error: error.message,
        });
    }
};

const getAllResignationRequests = async (req, res) => {
    const token = req.cookies.token;

    if (!token) {
        return res.status(401).json({ success: false, message: "Unauthorized: No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await SuperAdmin.findById(decoded.userId) || await Employee.findById(decoded.userId);
    if (!user) {
        return res.status(401).json({ success: false, message: "Unauthorized: User not found" });
    }

    const role = user.role || user.role_id;

    try {
        if (role !== "superadmin") {
            const resignationRequests = await Resignation.find({ org_id: user.org_id });
            return res.status(200).json({
                success: true,
                resignationRequests: resignationRequests,
            });
        } else {
            const resignationRequests = await Resignation.find();
            return res.status(200).json({
                success: true,
                resignationRequests: resignationRequests,
            });
        }
    } catch (error) {
        res.status(500).json({
            message: "Error fetching resignation requests",
            error: error.message,
        });
    }
};

const handleResignationRequest = async (req, res) => {
    const resignationId = req.params.resignationId;
    const { status, last_working_day } = req.body;

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
        const resignationRequest = await Resignation.findById(resignationId);

        if (!resignationRequest) {
            return res.status(404).json({
                success: false,
                message: 'Resignation request not found',
            });
        }

        if (roleId !== "superadmin" && resignationRequest.org_id !== org_id) {
            return res.status(403).json({ success: false, message: "Unauthorized: Access denied" });
        }

        if (status === 'Accepted') {
            if (last_working_day) {
                resignationRequest.last_working_day = last_working_day;
                resignationRequest.resignation_date = last_working_day;
            } else {
                return res.status(400).json({
                    success: false,
                    message: 'Last working day is required for accepted requests',
                });
            }
            resignationRequest.status = 'Accepted';

            const employee = await Employee.findOne({ emp_id: resignationRequest.employee_id });
            if (!employee) {
                return res.status(404).json({
                    success: false,
                    message: 'Employee not found',
                });
            }
            employee.resignation_date = last_working_day;
            employee.status = 'On Notice Period'; // Update employee status to "On Notice Period"
            await employee.save();
        } else if (status === 'Rejected') {
            resignationRequest.status = 'Rejected';
        } else {
            return res.status(400).json({
                success: false,
                message: 'Invalid status provided',
            });
        }

        await resignationRequest.save();
        res.status(200).json({
            message: 'Resignation request processed successfully',
            resignation: resignationRequest,
        });
    } catch (error) {
        res.status(400).json({
            message: 'Error processing resignation request',
            error: error.message,
        });
    }
};

const calculateNetPay = (salary, bonuses, deductions) => {
    const numericSalary = parseFloat(salary) || 0;
    const numericBonuses = parseFloat(bonuses) || 0;
    const totalDeductions = (Array.isArray(deductions) ? deductions : []).reduce((acc, curr) => acc + curr.amount, 0);
    return numericSalary + numericBonuses - totalDeductions;
};

const createPayrollRecord = async (req, res) => {
    const { employee_id, salary, bonuses, deductions, salary_month, salary_year } = req.body;
    const org_id = await Employee.findById(employee_id).select('org_id');

    try {
        const existingRecord = await Payroll.findOne({ employee_id, salary_month, salary_year });
        if (existingRecord) {
            return res.status(400).json({
                success: false,
                message: 'Payroll record already exists for this employee for the specified month and year.',
            });
        }

        const netPay = calculateNetPay(salary, bonuses, deductions);
        const newPayrollRecord = new Payroll({
            employee_id,
            org_id: org_id.org_id,
            salary,
            bonuses,
            deductions,
            payment_date: new Date(), // Set current date as payment date
            net_pay: netPay,
            salary_month,
            salary_year
        });

        await newPayrollRecord.save();

        res.status(201).json({
            success: true,
            message: 'Payroll record created successfully',
            payroll: newPayrollRecord,
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error creating payroll record',
            error: error.message,
        });
    }
};

const updateEmployeeDeductions = async (req, res) => {
    const employee_id = req.params.employeeId;
    const { deduction_amount, deduction_description } = req.body;

    try {
        const employee = await Employee.findById(employee_id);
        if (!employee) {
            return res.status(404).json({ success: false, message: 'Employee not found' });
        }
        await employee.save();
        res.status(200).json({ success: true, message: 'Deduction updated successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
}

const getPayrollRecords = async (req, res) => {
    const token = req.cookies.token;

    if (!token) {
        return res.status(401).json({ success: false, message: "Unauthorized: No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await SuperAdmin.findById(decoded.userId) || await Employee.findById(decoded.userId);
    if (!user) {
        return res.status(401).json({ success: false, message: "Unauthorized: User not found" });
    }

    const role = user.role || user.role_id;

    try {
        if (role == 'superadmin') {
            const payrollRecords = await Payroll.find();
            res.status(200).json({
                success: true,
                payrollRecords
            });
        } else {
            const payrollRecords = await Payroll.find({ org_id: user.org_id });
            res.status(200).json({
                success: true,
                payrollRecords
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching payroll records',
            error: error.message,
        });
    }
};

const getPayrollRecord = async (req, res) => {
    const { employeeId } = req.params;

    try {
        const payrollRecords = await Payroll.find({ employee_id: employeeId });

        if (payrollRecords.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No payroll records found for this employee'
            });
        }

        res.status(200).json({
            success: true,
            payrollRecords
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching payroll records',
            error: error.message,
        });
    }
};

const CreatePolicy = async (req, res) => {
    const token = req.cookies.token;

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Unauthorized',
        });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded) {
        return res.status(401).json({
            success: false,
            message: 'Unauthorized',
        });
    }

    const user = await SuperAdmin.findById(decoded.userId) || await Employee.findById(decoded.userId);

    if (!user) {
        return res.status(401).json({ message: "User not found" });
    }

    const { title, description } = req.body;

    const policyExists = await Policy.findOne({ title });
    if (policyExists) {
        return res.status(400).json({
            success: false,
            message: 'Policy with the same title already exists.',
        });
    }

    try {
        const policy = new Policy({
            title,
            description,
            org_id: user.org_id || "NA",
            createdBy: user.emp_id || user.role,
        });

        await policy.save();

        res.status(201).json({
            success: true,
            message: 'Policy created successfully.',
            policy,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error creating policy.',
            error: error.message,
        });
    }
};

const UpdatePolicy = async (req, res) => {
    const { policyId } = req.params;
    const { title, description } = req.body;

    try {
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

        if (role !== 'superadmin' && orgId !== policy.org_id) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized: Permission denied',
            });
        }
        const policy = await Policy.findByIdAndUpdate(policyId, { title, description }, { new: true });

        if (!policy) {
            return res.status(404).json({
                success: false,
                message: 'Policy not found.',
            });
        }

        res.status(200).json({
            success: true,
            message: 'Policy updated successfully.',
            policy,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating policy.',
            error: error.message,
        });
    }
};

const DeletePolicy = async (req, res) => {
    const { policyId } = req.params;

    try {
        const policy = await Policy.findByIdAndDelete(policyId);

        if (!policy) {
            return res.status(404).json({
                success: false,
                message: 'Policy not found.',
            });
        }

        res.status(200).json({
            success: true,
            message: 'Policy deleted successfully.',
            policy,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting policy.',
            error: error.message,
        });
    }
};

const GetPolicy = async (req, res) => {
    const { policyId } = req.params;

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
        const policy = await Policy.findById(policyId);

        if (!policy) {
            return res.status(404).json({
                success: false,
                message: 'Policy not found.',
            });
        }

        if (roleId !== "superadmin" && policy.org_id !== org_id) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to view this policy.',
            });
        }

        res.status(200).json({
            success: true,
            message: 'Policy fetched successfully.',
            policy,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching policy.',
            error: error.message,
        });
    }
};

const CreateAnnouncement = async (req, res) => {
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
        role = await Role.findById(roleId);
        roleId = role.role_name;
    }
    const { org_id } = user;

    try {
        const announcement = new Announcement({
            title: req.body.title,
            description: req.body.description,
            org_id: org_id || 'N/A',
        });

        await announcement.save();

        res.status(200).json({
            success: true,
            message: 'Announcement created successfully.',
            announcement,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error creating announcement.',
            error: error.message,
        });
    }
}

const UpdateAnnouncement = async (req, res) => {
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
        role = await Role.findById(roleId);
        roleId = role.role_name;
    }
    const { org_id } = user;

    try {
        const announcement = await Announcement.findById(req.params.announcementId);

        if (!announcement) {
            return res.status(404).json({
                success: false,
                message: 'Announcement not found.',
            });
        }

        if (roleId !== "superadmin" && announcement.org_id !== org_id) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to update this announcement.',
            });
        }

        announcement.title = req.body.title;
        announcement.description = req.body.description;

        await announcement.save();

        res.status(200).json({
            success: true,
            message: 'Announcement updated successfully.',
            announcement,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating announcement.',
            error: error.message,
        });
    }
}

const DeleteAnnouncement = async (req, res) => {
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
        role = await Role.findById(roleId);
        roleId = role.role_name;
    }
    const { org_id } = user;

    try {
        const announcement = await Announcement.findByIdAndDelete(req.params.announcementId);

        if (!announcement) {
            return res.status(404).json({
                success: false,
                message: 'Announcement not found.',
            });
        }

        if (roleId !== "superadmin" && announcement.org_id !== org_id) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to delete this announcement.',
            });
        }

        res.status(200).json({
            success: true,
            message: 'Announcement deleted successfully.',
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting announcement.',
            error: error.message,
        });
    }
}

const getAllAnnouncements = async (req, res) => {
    const token = req.cookies.token;

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Unauthorized: No token provided',
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await SuperAdmin.findById(decoded.userId) || await Employee.findById(decoded.userId);

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized: User not found',
            });
        }
        let roleId = user.role || user.role_id;
        if (user.role_id) {
            role = await Role.findById(roleId);
            roleId = role.role_name;
        }
        const { org_id } = user;

        let announcements;
        if (roleId !== "superadmin") {
            announcements = await Announcement.find({ $or: [{ org_id: "N/A" }, { org_id: org_id }] });
        } else {
            announcements = await Announcement.find();
        }


        res.status(200).json({
            success: true,
            message: 'Announcements retrieved successfully.',
            announcements,
        });
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Unauthorized: Invalid token',
        });
    }
};

const getAnnouncement = async (req, res) => {
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
        const announcement = await Announcement.findById(req.params.announcementId);

        if (!announcement) {
            return res.status(404).json({
                success: false,
                message: 'Announcement not found.',
            });
        }

        if (roleId !== "superadmin" && announcement.org_id !== org_id) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to view this announcement.',
            })
        }

        res.status(200).json({
            success: true,
            message: 'Announcement retrieved successfully.',
            announcement,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving announcement.',
            error: error.message,
        });
    }
}

const createHoliday = async (req, res) => {
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
    const { org_id } = user;
    try {
        let newHoliday = {};
        if (user.role != "superadmin") {
            newHoliday = new Holiday({
                ...req.body,
                org_id
            })
        } else {
            newHoliday = new Holiday({
                ...req.body
            });
        }
        await newHoliday.save();
        res.status(200).json({
            success: true,
            message: 'Holiday created successfully.',
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error creating holiday.',
            error: error.message,
        });
    }
}

const updateHoliday = async (req, res) => {
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
    const { org_id } = user;
    try {
        const holiday = await Holiday.findById(req.params.holidayId);
        if (!holiday) {
            return res.status(404).json({
                success: false,
                message: 'Holiday not found.',
            });
        }
        if (user.role !== "superadmin") {
            if (holiday.org_id !== org_id) {
                return res.status(403).json({
                    success: false,
                    message: 'You do not have permission to update this holiday.',
                })
            }
        }
        await Holiday.findByIdAndUpdate(req.params.holidayId, req.body, { new: true });
        res.status(200).json({
            success: true,
            message: 'Holiday updated successfully.',
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating holiday.',
            error: error.message,
        });
    }
}

const getAllHolidays = async (req, res) => {
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
    const { org_id } = user;
    try {
        let holidays = {};
        if (user.role !== "superadmin") {
            holidays = await Holiday.find({ org_id });
        } else {
            holidays = await Holiday.find();
        }
        res.status(200).json({
            success: true,
            message: 'Holidays retrieved successfully.',
            holidays,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving holidays.',
            error: error.message,
        });
    }
}

const getHoliday = async (req, res) => {
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
    const { org_id } = user;
    try {
        const holiday = await Holiday.findById(req.params.holidayId);
        if (!holiday) {
            return res.status(404).json({
                success: false,
                message: 'Holiday not found.',
            });
        }
        if (user.role !== "superadmin") {
            if (holiday.org_id !== org_id) {
                return res.status(403).json({
                    success: false,
                    message: 'You do not have permission to view this holiday.',
                })
            }
        }
        res.status(200).json({
            success: true,
            message: 'Holiday retrieved successfully.',
            holiday,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving holiday.',
            error: error.message,
        });
    }
}

const deleteHoliday = async (req, res) => {
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
        await Holiday.findByIdAndDelete(req.params.holidayId);
        res.status(200).json({
            success: true,
            message: 'Holiday deleted successfully.',
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting holiday.',
            error: error.message,
        });
    }
}


module.exports = { addEmployee, updateEmployee, getAllEmployees, getEmployee, deleteEmployee, assignAsset, updateAsset, getAllAssets, getAssetsForEmployee, getAsset, getAllResignationRequests, handleResignationRequest, createPayrollRecord, updateEmployeeDeductions, getPayrollRecords, getPayrollRecord, CreatePolicy, UpdatePolicy, DeletePolicy, GetPolicy, CreateAnnouncement, UpdateAnnouncement, DeleteAnnouncement, getAllAnnouncements, getAnnouncement, createHoliday, updateHoliday, getAllHolidays, getHoliday, deleteHoliday };
