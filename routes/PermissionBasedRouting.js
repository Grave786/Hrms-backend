const express = require('express');
const moment = require('moment');
const { isSuperAdmin, isAdmin, checkPermission, authenticateToken } = require('../middleware/verifyToken');
const { addAdmin, updateAdmin, getAdminsBySuperAdmin, getAdmin, deleteAdmin, createOrganization, getAttendanceRecordsForAllEmployees, updateOrganization, getAllOrganizations, getOrganization, deleteOrganization, decryptPassword, getAdminsByAdmin, createPermission, updatePermission, getAllPermissions, getPermission, deletePermission, createRole, updateRole, getAllRoles, getRole, deleteRole, createDepartment, updateDepartment, getAllDepartments, getDepartment, deleteDepartment, addEmployee, updateEmployee, getAllEmployees, deleteEmployee, assignAsset, updateAsset, getAllAssets, getAsset, handleResignationRequest, createPayrollRecord, getPayrollRecord, CreatePolicy, UpdatePolicy, DeletePolicy, createProject, updateProject, getAllProjects, deleteProject, createTask, updateTask, getAllTasks, deleteTask, approveOrRejectLeaveRequest, getLeaveRequestsByManager, PersonalDetails, updatePersonalDetails, getEmployees, createLeaveRequest, updateLeaveRequest, deleteLeaveRequest, getLeaveRequestsForLoggedInEmployee, applyForResignation, markCheckIn, markCheckOut, getAttendanceRecords, getPolicies, getEmployee, getAllResignationRequests, GetPolicy, getProject, getTask, getLeave, getPayrollRecords, getAttendanceRecordsForEmployee, getLeaveRequestsForemployee, getAssetsForEmployee, updateEmployeeDeductions, CreateAnnouncement, UpdateAnnouncement, getAllAnnouncements, getAnnouncement, DeleteAnnouncement, createHoliday, updateHoliday, getAllHolidays, getHoliday, deleteHoliday, getOrganizationForLoggedInUser } = require('../controllers/controllers');
const SuperAdmin = require('../models/SuperAdmin');
const Employee = require('../models/Employee');
const Role = require('../models/Role');
const Organization = require('../models/Organization');
const Permission = require('../models/Permission');
const Department = require('../models/Department');
const Project = require('../models/Project');
const Task = require('../models/Task');
const Leave = require('../models/Leave');
const Payroll = require('../models/Payroll');
const PermissionBasedRouting = express.Router();
const jwt = require('jsonwebtoken');
const ParentAttendance = require('../models/ParentAttendance');

//SuperAdmin routes
PermissionBasedRouting.post('/addadmin', isSuperAdmin, addAdmin);
PermissionBasedRouting.put('/updateadmin/:id', isSuperAdmin, updateAdmin)
PermissionBasedRouting.get('/getsuperadminsandadmins', isSuperAdmin, getAdminsBySuperAdmin)
PermissionBasedRouting.get('/getadmin/:id', isSuperAdmin, getAdmin)
PermissionBasedRouting.delete('/deleteadmin/:id', isSuperAdmin, deleteAdmin)
PermissionBasedRouting.post('/createorganization', isSuperAdmin, createOrganization)
PermissionBasedRouting.put('/updateorganization/:id', isSuperAdmin, updateOrganization)
PermissionBasedRouting.get('/getallorganizations', isSuperAdmin, getAllOrganizations)
PermissionBasedRouting.get('/getorganization/:id', isSuperAdmin, getOrganization)
PermissionBasedRouting.get('/getorganizationforloggedinuser', isAdmin, getOrganizationForLoggedInUser)
PermissionBasedRouting.delete('/deleteorganization/:id', isSuperAdmin, deleteOrganization)
PermissionBasedRouting.get('/decryptpassword', checkPermission("DecryptPassword"), decryptPassword)

//Admin routes
PermissionBasedRouting.get('/getadmins', isAdmin, getAdminsByAdmin)
PermissionBasedRouting.post('/createpermission', isAdmin, createPermission)
PermissionBasedRouting.put('/updatepermission/:permissionId', isAdmin, updatePermission)
PermissionBasedRouting.get('/getallpermissions', isAdmin, getAllPermissions)
PermissionBasedRouting.get('/getpermission/:permissionId', isAdmin, getPermission)
PermissionBasedRouting.delete('/deletepermission/:permissionId', isAdmin, deletePermission)
PermissionBasedRouting.post('/createrole', isAdmin, createRole)
PermissionBasedRouting.put('/updaterole/:id', isAdmin, updateRole)
PermissionBasedRouting.get('/getallroles', checkPermission("ManageRole"), getAllRoles)
PermissionBasedRouting.get('/getrole/:id', isAdmin, getRole)
PermissionBasedRouting.delete('/deleterole/:id', isAdmin, deleteRole)
PermissionBasedRouting.post('/createdepartment', isAdmin, createDepartment)
PermissionBasedRouting.put('/updatedepartment/:id', isAdmin, updateDepartment)
PermissionBasedRouting.get('/getalldepartments', isAdmin, getAllDepartments)
PermissionBasedRouting.get('/getdepartment/:id', isAdmin, getDepartment)
PermissionBasedRouting.delete('/deletedepartment/:id', isAdmin, deleteDepartment)

//HR routes
PermissionBasedRouting.post('/addemployee', checkPermission("add-user"), addEmployee)
// PermissionBasedRouting.post('/addemployee', checkPermission("AddEmployee"), addEmployee)
PermissionBasedRouting.put('/updateemployee/:id', checkPermission("update-user"), updateEmployee)
// PermissionBasedRouting.put('/updateemployee/:id', checkPermission("UpdateEmployee"), updateEmployee)
PermissionBasedRouting.get('/getallemployees', checkPermission("see-users"), getAllEmployees)
PermissionBasedRouting.get('/getemployee/:id', checkPermission("see-users"), getEmployee)
// PermissionBasedRouting.get('/getallemployees', checkPermission("GetEmployee"), getAllEmployees)
// PermissionBasedRouting.get('/getemployee/:id', checkPermission("GetEmployee"), getEmployee)
PermissionBasedRouting.delete('/deleteemployee/:id', checkPermission("remove-users"), deleteEmployee)
// PermissionBasedRouting.delete('/deleteemployee/:id', checkPermission("DeleteEmployee"), deleteEmployee)
PermissionBasedRouting.post('/assignasset', checkPermission("AssignAsset"), assignAsset)
PermissionBasedRouting.put('/updateasset/:asset_id', checkPermission("UpdateAsset"), updateAsset)
PermissionBasedRouting.get('/getallassets', checkPermission("GetAllAssets"), getAllAssets)
PermissionBasedRouting.get('/getassetsforemployee/:id', checkPermission("GetAllAssets"), getAssetsForEmployee)
PermissionBasedRouting.get('/getasset/:asset_id', checkPermission("GetAsset"), getAsset)
PermissionBasedRouting.get('/getresignationrequests', checkPermission("HandleResignationRequest"), getAllResignationRequests)
PermissionBasedRouting.patch('/resignationrequest/:resignationId', checkPermission("HandleResignationRequest"), handleResignationRequest);
PermissionBasedRouting.post('/createpayrollrecord', checkPermission("CreatePayrollRecord"), createPayrollRecord)
PermissionBasedRouting.patch('/remove-deductions', async (req, res) => {
  const { employeeId, deductionsToRemove } = req.body;

  try {
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Remove the selected deductions
    employee.deductions = employee.deductions.filter(deduction =>
      !deductionsToRemove.some(d => d.description === deduction.description && d.amount === deduction.amount)
    );

    await employee.save();

    res.status(200).json({ message: 'Deductions removed', updatedDeductions: employee.deductions });
  } catch (error) {
    res.status(500).json({ message: 'Failed to remove deductions', error });
  }
});
PermissionBasedRouting.post('/add-deductions', async (req, res) => {
  const { employees, deductions } = req.body;

  if (!employees || !employees.length) {
    return res.status(400).json({ error: 'No employees selected.' });
  }

  if (!deductions || !deductions.length) {
    return res.status(400).json({ error: 'No deductions provided.' });
  }

  try {
    const updatePromises = employees.map(async (employeeId) => {
      const employee = await Employee.findById(employeeId);

      if (!employee) {
        throw new Error(`Employee with ID ${employeeId} not found.`);
      }

      employee.deductions = [...employee.deductions, ...deductions];

      return employee.save();
    });

    await Promise.all(updatePromises);

    res.status(200).json({ message: 'Deductions added successfully!' });
  } catch (error) {
    console.error('Error adding deductions:', error);
    res.status(500).json({ error: 'Failed to add deductions.' });
  }
});
PermissionBasedRouting.get('/getpayrollrecords', checkPermission("GetPayrollRecord"), getPayrollRecords)
PermissionBasedRouting.get('/getpayrollrecord/:employeeId', checkPermission("GetPayrollRecord"), getPayrollRecord)
PermissionBasedRouting.post('/createpolicy', checkPermission("CreatePolicy"), CreatePolicy)
PermissionBasedRouting.put('/updatepolicy/:policyId', checkPermission("UpdatePolicy"), UpdatePolicy)
PermissionBasedRouting.delete('/deletepolicy/:policyId', checkPermission("DeletePolicy"), DeletePolicy)
PermissionBasedRouting.get('/getpolicy/:policyId', checkPermission("GetPolicies"), GetPolicy)
PermissionBasedRouting.post('/createannouncement', checkPermission("CreateAnnouncement"), CreateAnnouncement)
PermissionBasedRouting.put('/updateannouncement/:announcementId', checkPermission("UpdateAnnouncement"), UpdateAnnouncement)
PermissionBasedRouting.get('/getallannouncements', checkPermission("GetAllAnnouncements"), getAllAnnouncements)
PermissionBasedRouting.get('/getannouncement/:announcementId', checkPermission("GetAnnouncement"), getAnnouncement)
PermissionBasedRouting.delete('/deleteannouncement/:announcementId', checkPermission("DeleteAnnouncement"), DeleteAnnouncement)
PermissionBasedRouting.post('/createholiday', checkPermission("CreateHoliday"), createHoliday)
PermissionBasedRouting.put('/updateholiday/:holidayId', checkPermission("UpdateHoliday"), updateHoliday)
PermissionBasedRouting.get('/getallholidays', checkPermission("GetAllHolidays"), getAllHolidays)
PermissionBasedRouting.get('/getholiday/:holidayId', checkPermission("GetHoliday"), getHoliday)
PermissionBasedRouting.delete('/deleteholiday/:holidayId', checkPermission("DeleteHoliday"), deleteHoliday)

//Manager routes
PermissionBasedRouting.post('/createproject', checkPermission("CreateProject"), createProject)
PermissionBasedRouting.put('/updateproject/:project_id', checkPermission("UpdateProject"), updateProject)
PermissionBasedRouting.get('/getallprojects', checkPermission("GetAllProjects"), getAllProjects)
PermissionBasedRouting.get('/getproject/:projectId', checkPermission("GetProject"), getProject)
PermissionBasedRouting.delete('/deleteproject/:project_id', checkPermission("DeleteProject"), deleteProject)

//TL routes
PermissionBasedRouting.post('/createtask', checkPermission("CreateTask"), createTask)
PermissionBasedRouting.put('/updatetask/:task_id', checkPermission("UpdateTask"), updateTask)
PermissionBasedRouting.get('/getalltasks', checkPermission("GetAllTasks"), getAllTasks)
PermissionBasedRouting.get('/gettask/:task_id', checkPermission("GetTask"), getTask)
PermissionBasedRouting.delete('/deletetask/:task_id', checkPermission("DeleteTask"), deleteTask)
PermissionBasedRouting.put('/handleleave/:leave_id', checkPermission("ApproveOrRejectLeaveRequest"), approveOrRejectLeaveRequest);
PermissionBasedRouting.get('/getleaves', checkPermission("GetLeaveRequestsByManager"), getLeaveRequestsByManager);

//Employee routes
PermissionBasedRouting.get('/personaldetails', authenticateToken, PersonalDetails)
PermissionBasedRouting.put('/updatepersonaldetails/:employeeId', authenticateToken, updatePersonalDetails)
PermissionBasedRouting.post('/createleaverequest', authenticateToken, checkPermission("CreateLeaveRequest"), createLeaveRequest)
PermissionBasedRouting.put('/updateleaverequest/:leave_id', checkPermission("UpdateLeaveRequest"), updateLeaveRequest)
PermissionBasedRouting.delete('/deleteleaverequest/:leave_id', checkPermission("DeleteLeaveRequest"), deleteLeaveRequest)
PermissionBasedRouting.get('/getleaverequests', authenticateToken, checkPermission("GetLeaveRequest"), getLeaveRequestsForLoggedInEmployee)
PermissionBasedRouting.get('/getleaverequests/:employee_id', authenticateToken, checkPermission("GetLeaveRequest"), getLeaveRequestsForemployee)
PermissionBasedRouting.get('/getleave/:leave_id', authenticateToken, checkPermission("GetLeave"), getLeave)
PermissionBasedRouting.post('/applyforresignation', authenticateToken, checkPermission("ApplyForResignation"), applyForResignation)
PermissionBasedRouting.post('/markcheckin', authenticateToken, markCheckIn)
PermissionBasedRouting.put('/markcheckout', authenticateToken, checkPermission("MarkCheckOut"), markCheckOut)
PermissionBasedRouting.get('/getattendancerecords', authenticateToken, getAttendanceRecords)
PermissionBasedRouting.get('/getattendancerecords/:employee_id', authenticateToken, checkPermission("GetAttendanceRecord"), getAttendanceRecordsForEmployee)
PermissionBasedRouting.get('/getpolicies', authenticateToken, getPolicies)
PermissionBasedRouting.get('/getallattendancerecords', authenticateToken, checkPermission("GetAttendanceRecord"), getAttendanceRecordsForAllEmployees)






//fetch
PermissionBasedRouting.get('/employees', authenticateToken, async (req, res) => {
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

    const { role, org_id } = user;

    let employees;

    if (role == 'superadmin') {
      employees = await Employee.find();
    } else {
      employees = await Employee.find({ org_id: org_id });
    }

    res.status(200).json({ employees });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch employee names' });
  }
});

PermissionBasedRouting.get('/employeesandadmins', authenticateToken, async (req, res) => {
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

    const { role, org_id } = user;

    let employees;

    if (role == 'superadmin') {
      const emp = await Employee.find();
      const admin = await SuperAdmin.find();
      employees = [...emp, ...admin];

    } else {
      employees = await Employee.find({ org_id: org_id });
    }

    res.status(200).json({ employees });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch employee names' });
  }
});

PermissionBasedRouting.get('/roles', authenticateToken, async (req, res) => {
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

    const { role, org_id } = user;

    let roles;

    if (role == 'superadmin') {
      roles = await Role.find();
    } else {
      roles = await Role.find({ org_id: org_id });

    }
    res.status(200).json({ roles });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch roles' });
  }
});

PermissionBasedRouting.get('/getalladmins', authenticateToken, async (req, res) => {
  try {
    const admins = await SuperAdmin.find();
    res.status(200).json({ admins });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch admins' });
  }
});

PermissionBasedRouting.get('/organizations', async (req, res) => {
  try {
    const organizations = await Organization.find();
    res.status(200).json({ organizations });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch organizations' });
  }
});

PermissionBasedRouting.get('/departments', async (req, res) => {
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

    const { role, org_id } = user;

    let departments;

    if (role == 'superadmin') {
      departments = await Department.find();
    } else {
      departments = await Department.find({ org_id: org_id });
    }
    res.status(200).json({ departments });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch departments' });
  }
})

PermissionBasedRouting.get('/projects', authenticateToken, async (req, res) => {
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
  let projects;
  try {
    if (role == 'superadmin') {
      projects = await Project.find();
    } else {
      projects = await Project.find({ org_id: org_id });
    }
    res.status(200).json({ projects });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
})

PermissionBasedRouting.get('/tasks', authenticateToken, async (req, res) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized: No token provided',
    })
  } else {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await SuperAdmin.findById(decoded.userId) || await Employee.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: User not found',
      })
    }
    const { role, org_id } = user;
    let tasks;
    try {
      if (role == 'superadmin') {
        tasks = await Task.find();
      } else {
        tasks = await Task.find({ org_id: org_id });
      }
      res.status(200).json({ tasks });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch tasks' });
    }
  }
})

PermissionBasedRouting.get('/payroll/:emp_id', authenticateToken, async (req, res) => {
  const { emp_id } = req.params;

  try {
    const user = await Employee.findById(emp_id);

    const payroll = await Payroll.findOne({ employee_id: user._id }).sort({ payment_date: -1 }).limit(1);;


    return res.status(200).json(payroll);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch payroll' });

  }
});

PermissionBasedRouting.get('/permissions', async (req, res) => {
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
      });
    }

    let permissions = await Permission.find();

    // if (role === 'superadmin') {
    //   permissions = await Permission.find(); // Fetch all permissions
    // } else {
    //   permissions = await Permission.find({ org_id: org_id }); // Fetch permissions from the user's org
    // }

    return res.status(200).json({ success: true, permissions });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch permissions' });
  }
});

PermissionBasedRouting.get('/tasksandprojects/:emp_id', authenticateToken, async (req, res) => {
  try {
    const { emp_id } = req.params;
    const user = await Employee.findById(emp_id) || await SuperAdmin.findById(emp_id);
    const tasks = await Task.find({ assigned_to: user.emp_id });
    return res.status(200).json({ tasks });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch tasks' });
  }
})

PermissionBasedRouting.get('/current', authenticateToken, (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized: No user found' });
  }
  res.status(200).json(req.user);
});

PermissionBasedRouting.get('/getrole', authenticateToken, async (req, res) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({ message: 'Unauthorized: No token found' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // const user = await SuperAdmin.findById(decoded.userId) || await Employee.findById(decoded.userId);
    let user = await SuperAdmin.findById(decoded.userId);
    if (!user) {
      user = await Employee.findById(decoded.userId);
    }
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    const userRoleId = user.role || user.role_id;  // Assuming the user's role_id is available in req.user
    // Fetch the role document by role_id
    if (user.role_id) {
      const userRole = await Role.findOne(userRoleId);
      if (!userRole) {
        return res.status(403).json({ message: 'Role not found' });
      }

      // Check if the required permission exists in the user's role permissions
      const hasPermission = userRole.permissions.includes(permissionKey);

      if (hasPermission || userRoleId === 'admin' || userRoleId === 'superadmin') {
        return res.status(200).json({ role: userRole });
      } else {
        return res.status(403).json({ message: 'Access Denied: Insufficient Permissions' });
      }
    } else {
      if (userRoleId === 'admin' || userRoleId === 'superadmin') {
        return res.status(200).json({ role: userRoleId });
      } else {
        return res.status(403).json({ message: 'Access Denied: Insufficient Permissions' });
      }
    }
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user role', error });
  }
});

PermissionBasedRouting.put('/updatelastseen/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const user = await SuperAdmin.findById(id) || await Employee.findById(id);

    if (!user) {
      return res.status(401).json({ success: false, message: 'Unauthorized: User not found' });
    }
    user.lastSeenAnnouncement = Date.now();
    await user.save();
    return res.status(200).json({ success: true, message: 'Last seen announcement updated successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error updating last seen announcement' });
  }
});

PermissionBasedRouting.get('/orgattendance', async (req, res) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({ message: 'Unauthorized: No token found' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await SuperAdmin.findById(decoded.userId) || await Employee.findById(decoded.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const yesterday = moment().startOf('day');
    const today = moment().add(1, 'days').startOf('day');

    let matchQuery = {
      "attendance.date": {
        $gte: yesterday.toDate(),
        $lt: today.toDate()
      }
    };

    if (user.role !== 'superadmin') {
      const orgEmployees = await Employee.find({ org_id: user.org_id }).select('_id');
      const employeeIds = orgEmployees.map(emp => emp._id);
      matchQuery["userId"] = { $in: employeeIds };
    }

    const attendances = await ParentAttendance.aggregate([
      { $match: matchQuery }, // Match userId and date
      { $unwind: "$attendance" }, // Unwind attendance array
      {
        $match: {
          "attendance.date": {
            $gte: yesterday.toDate(),
            $lt: today.toDate()
          }
        }
      },
      {
        $group: {
          _id: null,
          presentCount: {
            $sum: {
              $cond: [
                {
                  $or: [
                    { $eq: ["$attendance.status", "Full-Day"] },
                    { $eq: ["$attendance.status", "Half-Day"] },
                    { $eq: ["$attendance.status", "Pending"] }
                  ]
                },
                1, 0
              ]
            }
          },
          absentCount: {
            $sum: {
              $cond: [
                { $eq: ["$attendance.status", "Absent"] }, 1, 0
              ]
            }
          },
          pendingCount: {
            $sum: {
              $cond: [
                { $eq: ["$attendance.status", "Pending"] }, 1, 0
              ]
            }
          }
        }
      }
    ]);

    const attendanceData = attendances.length > 0 ? attendances[0] : {
      presentCount: 0,
      absentCount: 0,
      pendingCount: 0
    };

    res.status(200).json({
      presentCount: attendanceData.presentCount,
      absentCount: attendanceData.absentCount,
      pendingCount: attendanceData.pendingCount
    });
  } catch (error) {
    console.error("Error fetching attendance data:", error);
    res.status(500).json({ message: 'Server error' });
  }
});

PermissionBasedRouting.get('/leaves', async (req, res) => {
  try {
    const leaves = await Leave.find();
    res.json(leaves);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
})

PermissionBasedRouting.get('/attendance-last-week', async (req, res) => {
  try {
    const today = moment().endOf('day');
    const sevenDaysAgo = moment().startOf('month');

    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ message: 'Unauthorized: No token found' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await SuperAdmin.findById(decoded.userId) || await Employee.findById(decoded.userId);
    const { role, org_id } = user;

    // Match query for filtering by org_id if user is not a superadmin
    const employeeIds = role !== 'superadmin'
      ? (await Employee.find({ org_id }).select('_id')).map(emp => emp._id)
      : null;

    const attendanceData = await ParentAttendance.aggregate([
      { $unwind: "$attendance" }, // Unwind attendance array
      {
        $match: {
          "attendance.date": { $gte: sevenDaysAgo.toDate(), $lte: today.toDate() },
          ...(role !== 'superadmin' && { userId: { $in: employeeIds } }) // Filter by org_id for non-superadmins
        }
      },
      {
        $addFields: {
          formattedDate: {
            $dateToString: { format: "%Y-%m-%d", date: "$attendance.date" } // Extract date only
          }
        }
      },
      {
        $group: {
          _id: "$formattedDate", // Group by formatted date
          // presentCount: {
          //   $sum: {
          //     $cond: [
          //       {
          //         $or: [
          //           { $eq: ["$attendance.status", "Full-Day"] },
          //           { $eq: ["$attendance.status", "Half-Day"] }
          //         ]
          //       },
          //       1, 0
          //     ]
          //   }
          // },
          presentCount: {
            $sum: {
              $cond: [{ $eq: ["$attendance.status", "Full-Day"] }, 1, 0]
            }
          },
          halfDayCount: {
            $sum: {
              $cond: [{ $eq: ["$attendance.status", "Half-Day"] }, 1, 0]
            }
          },
          absentCount: {
            $sum: {
              $cond: [{ $eq: ["$attendance.status", "Absent"] }, 1, 0]
            }
          },
          pendingCount: {
            $sum: {
              $cond: [{ $eq: ["$attendance.status", "Pending"] }, 1, 0]
            }
          }
        }
      },
      {
        $sort: { "_id": 1 } // Sort by date
      }
    ]);

    res.json({ attendanceData });
  } catch (error) {
    console.error("Error fetching attendance data:", error);
    res.status(500).json({ message: 'Server error' });
  }
});


PermissionBasedRouting.put('/taskstatus', async (req, res) => {
  try {
    const { TASK } = req.body;
    const { task_id, status, remark } = TASK;
    const task = await Task.findOne({ task_id: task_id });
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    task.status = status;
    // remark && (task.remark = remark);
    task.remark = remark === undefined ? remark : "";
    await task.save();
    res.status(200).json({ message: 'Task status updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
})

PermissionBasedRouting.get('/managers', authenticateToken, async (req, res) => {
  try {
    const managers = await Employee.find();
    res.json({ managers });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
})

module.exports = PermissionBasedRouting
