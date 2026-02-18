const Employee = require('../models/Employee');
const SuperAdmin = require('../models/SuperAdmin');
const Leave = require('../models/Leave');
const Resignation = require('../models/Resignation');
const Attendance = require('../models/Attendance');
const Policy = require('../models/Policy');
const Role = require('../models/Role');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const ParentAttendance = require('../models/ParentAttendance');

const PersonalDetails = async (req, res) => {
    try {
        const token = req.cookies.token;
        if (!token) {
            return res.status(401).json({ message: 'Authentication token is missing' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const employee_id = decoded.userId;


        let user = await Employee.findById(employee_id)
            .populate('dept_id', 'dept_name')
            .populate('role_id', 'role_name')
            .exec();

        if (!user) {
            user = await SuperAdmin.findById(employee_id).exec();
        }

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updatePersonalDetails = async (req, res) => {
    const employeeId = req.params.employeeId;
    const { first_name, last_name, email, password, previewPassword, phone, address } = req.body;
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

        if (user._id !== employeeId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized: You are not authorized to update this employee',
            });
        }

        const employee = await Employee.findById(employeeId) || await SuperAdmin.findById(employeeId);

        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }
        employee.first_name = first_name || employee.first_name;
        employee.last_name = last_name || employee.last_name;
        employee.email = email || employee.email;
        employee.phone = phone || employee.phone;
        employee.address = address || employee.address;

        if (previewPassword && previewPassword != '') {
            employee.password = await bcrypt.hash(previewPassword, 10) || employee.password;
            employee.previewPassword = previewPassword;
        }
        await employee.save();
        res.status(200).json(employee);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getEmployees = async (req, res) => {
    try {
        const employees = await Employee.find();
        res.status(200).json(employees);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const createLeaveRequest = async (req, res) => {
    const { leave_type, start_date, end_date, reason, medical_certificate } = req.body;

    try {
        const employee_id = req.user.userId;
        const employee = await Employee.findById(employee_id) || await SuperAdmin.findById(employee_id);
        const manager = await Employee.findById(employee.manager_id) || await SuperAdmin.findById(employee_id);

        if (new Date(start_date) < new Date()) {
            return res.status(400).json({ success: false, message: 'Start date cannot be in the past' });
        }

        if (new Date(start_date) > new Date(end_date)) {
            return res.status(400).json({ success: false, message: 'Start date cannot be greater than end date' });
        }

        const existingLeave = await Leave.findOne({ employee_id, start_date: { $lte: start_date }, end_date: { $gte: start_date } });
        if (existingLeave) {
            return res.status(400).json({ success: false, message: 'Leave already exists for that employee between the start and end dates' });
        }

        const existingLeaves = await Leave.find({ start_date: { $lte: start_date }, end_date: { $gte: start_date } });
        if (existingLeaves.length > 5) {
            return res.status(400).json({ success: false, message: 'Too many leaves for that date' });
        }

        const leaveDuration = (new Date(end_date) - new Date(start_date)) / (1000 * 60 * 60 * 24) + 1;

        if (leave_type === 'Sick' && leaveDuration > 1) {
            if (!medical_certificate) {
                return res.status(400).json({
                    success: false,
                    message: 'Medical certificate is required for sick leave longer than 2 days',
                });
            }
        }

        const lastLeave = await Leave.findOne({ employee_id }).sort({ end_date: -1 });

        let Status = 'Pending';

        if (lastLeave) {
            const gapSinceLastLeave = (new Date(start_date) - new Date(lastLeave.end_date)) / (1000 * 60 * 60 * 24);
            if (gapSinceLastLeave >= 30 && leaveDuration === 1) {
                Status = 'Approved'; // Auto-approve if the gap between leaves is more than 30 days
            }
        }

        const latestLeaveRequest = await Leave.findOne({}, { leave_id: 1 }).sort({ leave_id: -1 });

        const serialNumber = latestLeaveRequest ? parseInt(latestLeaveRequest.leave_id.slice(1)) + 1 : 1;
        const paddedSerialNumber = serialNumber.toString().padStart(3, '0');
        const leave_id = `L${paddedSerialNumber}`;

        const newLeaveRequest = new Leave({
            leave_id,
            employee_id,
            leave_type,
            start_date,
            end_date,
            status: Status,
            manager_id: manager ? manager._id : null,
            approval_by: null,
            reason,
            medical_certificate: leave_type === 'Sick' && leaveDuration > 2 ? medical_certificate : null,
        });

        await newLeaveRequest.save();

        res.status(201).json({
            message: 'Leave request created successfully',
            leave: newLeaveRequest,
        });
    } catch (error) {
        res.status(400).json({
            message: 'Error creating leave request',
            error: error.message,
        });
    }
};

const updateLeaveRequest = async (req, res) => {
    const { leave_id } = req.params;
    const { leave_type, start_date, end_date, reason, status, approval_by } = req.body;

    try {
        let leaveRequest = await Leave.findOne({ leave_id });
        if (!leaveRequest) {
            return res.status(404).json({ success: false, message: "Leave request not found" });
        }

        leaveRequest.leave_type = leave_type || leaveRequest.leave_type;
        leaveRequest.start_date = start_date || leaveRequest.start_date;
        leaveRequest.end_date = end_date || leaveRequest.end_date;
        leaveRequest.reason = reason || leaveRequest.reason;
        leaveRequest.status = status || leaveRequest.status;
        leaveRequest.approval_by = approval_by || leaveRequest.approval_by;
        leaveRequest.updated_at = new Date();

        const updatedLeaveRequest = await leaveRequest.save();

        res.status(200).json({
            message: "Leave request updated successfully",
            leave: updatedLeaveRequest,
        });
    } catch (error) {
        res.status(500).json({
            message: "Error updating leave request",
            error: error.message,
        });
    }
};

const deleteLeaveRequest = async (req, res) => {
    const { leave_id } = req.params;

    try {
        const deletedLeaveRequest = await Leave.findOneAndDelete({ leave_id });
        if (!deletedLeaveRequest) {
            return res.status(404).json({ success: false, message: "Leave request not found" });
        }

        res.status(200).json({
            success: true,
            message: "Leave request deleted successfully",
        });
    } catch (error) {
        res.status(500).json({
            message: "Error deleting leave request",
            error: error.message,
        });
    }
};

const getLeaveRequestsForLoggedInEmployee = async (req, res) => {
    const employee_id = req.user.userId;
    try {
        const leaveRequests = await Leave.find({ employee_id });
        res.status(200).json({ success: true, leaveRequests });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error fetching leave requests", error: error.message });
    }
};

const getLeaveRequestsForemployee = async (req, res) => {
    const { employee_id } = req.params;
    try {
        const leaveRequests = await Leave.find({ employee_id: employee_id });
        if (leaveRequests.length === 0) {
            return res.status(200).json({ success: true, message: "No leave requests found for this employee" });
        }
        res.status(200).json({ success: true, leaveRequests });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error fetching leave requests", error: error.message });
    }
}

const getLeave = async (req, res) => {
    const { leave_id } = req.params;

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
        const leave = await Leave.findOne({ leave_id });
        const employee = await Employee.findOne({ _id: leave.employee_id });

        if (!employee) {
            return res.status(404).json({ success: false, message: "Employee not found" });
        }

        if (roleId !== "superadmin" && employee.org_id !== org_id) {
            return res.status(403).json({ success: false, message: "You are not authorized to access this resource" });
        }

        if (!leave) {
            return res.status(404).json({ success: true, message: "Leave request not found" });
        }
        res.status(200).json({ success: true, leave });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error fetching leave", error: error.message });
    }
}

const applyForResignation = async (req, res) => {
    const { last_working_day, reason } = req.body;

    try {
        const employee = await Employee.findOne({ _id: req.user.userId });

        if (!employee) {
            const superAdmin = await SuperAdmin.findOne({ _id: req.user.userId });
            if (superAdmin) {
                return res.status(400).json({
                    message: 'You cannot apply for resignation as a SuperAdmin/Admin.',
                });
            }
            return res.status(404).json({ message: 'Employee not found' });
        }

        const employee_id = employee.emp_id;
        const org_id = employee.org_id;

        // Calculate the date range (7 days ago up to today)
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const today = new Date();

        // Check for existing resignation requests from the employee within the last 7 days
        const lastResignationRequest = await Resignation.findOne({
            employee_id,
            created_at: { $gte: sevenDaysAgo, $lte: today }
        });


        if (lastResignationRequest) {
            return res.status(400).json({
                message: 'You cannot apply for resignation again within 7 days of your last request.',
            });
        }

        const resignationRequest = new Resignation({
            employee_id,
            org_id,
            last_working_day,
            reason,
        });

        await resignationRequest.save();

        res.status(201).json({
            message: 'Resignation request submitted successfully',
            resignation: resignationRequest,
        });
    } catch (error) {
        res.status(400).json({
            message: 'Error submitting resignation request',
            error: error.message,
        });
    }
};

const markAttendance = async (req, res) => {
    const employee_id = req.user.userId;
    const today = new Date().setHours(0, 0, 0, 0);
    const { status = 'Present' } = req.body;

    try {
        const leaveToday = await Leave.findOne({
            employee_id,
            start_date: { $lte: today },
            end_date: { $gte: today },
            status: 'Approved'
        });

        if (leaveToday) {
            return res.status(400).json({
                success: false,
                message: 'Attendance cannot be marked as you are on leave today.'
            });
        }

        const existingAttendance = await Attendance.findOne({ employee_id, date: today });

        if (existingAttendance) {
            return res.status(400).json({
                success: false,
                message: 'Attendance for today has already been marked.'
            });
        }

        const attendanceRecord = new Attendance({
            employee_id,
            status,
            checkInTime: new Date(),
        });

        await attendanceRecord.save();

        res.status(201).json({
            success: true,
            message: 'Attendance marked successfully',
            attendance: attendanceRecord
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error marking attendance',
            error: error.message,
        });
    }
};

const markCheckIn = async (req, res) => {
    const employee_id = req.user.userId;
    const user = await Employee.findById(employee_id) || await SuperAdmin.findById(employee_id);
    const org_id = user.org_id;


    const today = new Date().toISOString().split('T')[0];
    try {
        const leaveToday = await Leave.findOne({
            employee_id,
            start_date: { $lte: today },
            end_date: { $gte: today },
            status: 'Approved'
        });

        if (leaveToday) {
            return res.status(400).json({
                success: false,
                message: 'Check-in cannot be marked as you are on leave today.'
            });
        }

        const isattendanceRecord = await Attendance.findOne({ employee_id, date: today });

        if (isattendanceRecord) {
            return res.status(400).json({
                success: false,
                message: 'attendance already marked for today.'
            });
        }

        // check if user is late ( if check in time is 5 min after 10:00 AM indian time), if yes mark status as Half Day
        const checkInTime = new Date();

        // Late check-in condition (after 10:10 AM IST)
        const isLateCheckIn = (checkInTime.toTimeString() >= process.env.ATTENDANCE_LATE_CHECKIN_TIME);

        // Check if the user is late
        if (isLateCheckIn) {
            const attendanceRecord = new Attendance({
                employee_id,
                date: today,
                org_id: user.role == 'admin' ? null : org_id,
                status: 'Half Day Late Check-in',
                checkInTime: new Date().toTimeString(),
            });

            await attendanceRecord.save();
            return res.status(201).json({
                success: true,
                message: 'Late Check-in marked successfully',
                attendance: attendanceRecord
            });
        }

        const attendanceRecord = new Attendance({
            employee_id,
            date: today,
            org_id: user.role == 'admin' ? null : org_id,
            status: 'Present',
            checkInTime: new Date().toTimeString(),
        });

        await attendanceRecord.save();

        res.status(201).json({
            success: true,
            message: 'Check-in marked successfully',
            attendance: attendanceRecord
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error marking check-in',
            error: error.message,
        });

    }
};

const markCheckOut = async (req, res) => {
    const employee_id = req.user.userId;
    const today = new Date().toISOString().split('T')[0];
    const efforts = req.body.efforts;

    try {
        // Find the attendance record for today
        const attendanceRecord = await Attendance.findOne({ employee_id, date: today });

        if (!attendanceRecord) {
            return res.status(400).json({
                success: false,
                message: 'Check-in must be marked before check-out.'
            });
        }

        // Check if check-out time is already set
        if (attendanceRecord.checkOutTime) {
            return res.status(400).json({
                success: false,
                message: 'Check-out has already been marked for today.'
            });
        }

        // Set the current time as check-out time
        attendanceRecord.checkOutTime = new Date().toTimeString();
        attendanceRecord.efforts = efforts;

        // Now we have the checkInTime from the attendanceRecord
        const checkInTime = attendanceRecord.checkInTime;

        // if check out time is 5 min before 19:00 AM indian time, mark status as Half Day and if status is already Half Day, mark status as Absent
        const checkOutTime = new Date();

        // Late check-in condition (after 10:10 AM IST)
        const isLateCheckIn = (checkInTime >= process.env.ATTENDANCE_LATE_CHECKIN_TIME);
        // Early check-out condition (before 6:50 PM IST)
        const isEarlyCheckOut = (checkOutTime.toTimeString() < process.env.ATTENDANCE_EARLY_CHECKOUT_TIME);

        // Update status based on both conditions
        if (isLateCheckIn && isEarlyCheckOut) {
            attendanceRecord.status = 'Absent Late Check-in and Early Check-out';
        } else if (isLateCheckIn) {
            attendanceRecord.status = 'Half Day Late Check-in';
        } else if (isEarlyCheckOut) {
            attendanceRecord.status = 'Half Day Early Check-out';
        }

        await attendanceRecord.save();

        return res.status(201).json({
            success: true,
            message: 'Attendance updated successfully',
            attendance: attendanceRecord
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error marking check-out',
            error: error.message,
        });
    }
};

const getAttendanceRecords = async (req, res) => {
    const employee_id = req.user.userId;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
        return res.status(400).json({
            success: false,
            message: 'Missing required date parameters',
        });
    }

    try {
        const startOfMonth = new Date(startDate);
        const endOfMonth = new Date(endDate);

        // Fetch attendance records for the employee for the current month
        const attendanceRecords = await ParentAttendance.findOne(
            { userId: employee_id },
            {
                attendance: {
                    $filter: {
                        input: '$attendance',
                        as: 'record',
                        cond: {
                            $and: [
                                { $gte: ['$$record.date', startOfMonth] },
                                { $lte: ['$$record.date', endOfMonth] },
                            ],
                        },
                    },
                },
            }
        );

        const daysPresent = attendanceRecords?.attendance?.length || 0;

        // Fetch leave records for the employee for the current month
        const leaveRecords = await Leave.find({
            employee_id,
            start_date: { $gte: startOfMonth, $lte: endOfMonth },
            status: 'Approved', // Only count approved leaves
        });

        const leaveDays = leaveRecords.length;

        res.status(200).json({
            success: true,
            attendanceRecords: attendanceRecords?.attendance || [],
            daysPresent,
            leaveDays,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching attendance records',
            error: error.message,
        });
    }
};

const getAttendanceRecordsForAllEmployees = async (req, res) => {
    try {
        // Get the current date and the start of last month
        const currentDate = new Date();
        const startOfLastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1); // 1st day of last month
        const endDate = currentDate;

        const parentAttendanceRecords = await ParentAttendance.find();

        // Filter attendance records based on the date range
        const filteredAttendanceRecords = parentAttendanceRecords.map(record => {
            // Filter attendance array within each record by date range
            const filteredAttendance = record.attendance.filter(att => {
                const attendanceDate = new Date(att.date);
                return attendanceDate >= startOfLastMonth && attendanceDate <= endDate;
            });

            // Return the record only if it has attendance in the given date range
            if (filteredAttendance.length > 0) {
                return {
                    ...record.toObject(),
                    attendance: filteredAttendance, // Only include the filtered attendance
                };
            }
        }).filter(Boolean); // Remove undefined records (if any)

        res.status(200).json({
            success: true,
            attendanceRecords: filteredAttendanceRecords,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching attendance records',
            error: error.message,
        });
    }
};

const getAttendanceRecordsForEmployee = async (req, res) => {
    const { employee_id } = req.params; // Get the logged-in employee ID from the token
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    try {
        const attendanceRecords = await ParentAttendance.findOne(
            { userId: employee_id },
            {
                attendance: {
                    $filter: {
                        input: '$attendance',
                        as: 'record',
                        cond: {
                            $and: [
                                { $gte: ['$$record.date', startOfMonth] },
                                { $lte: ['$$record.date', endOfMonth] },
                            ],
                        },
                    },
                },
            }
        );

        const daysPresent = attendanceRecords.attendance.length;

        const leaveRecords = await Leave.find({
            employee_id: employee_id,
            start_date: { $gte: startOfMonth, $lte: endOfMonth },
            status: 'Approved'
        });

        const leaveDays = leaveRecords.length;

        res.status(200).json({
            success: true,
            attendanceRecords: attendanceRecords?.attendance || [],
            daysPresent,
            leaveDays
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching attendance records',
            error: error.message,
        });
    }
};

const getPolicies = async (req, res) => {
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
            const policies = await Policy.find({
                $or: [
                    { org_id: user.org_id },
                    { org_id: "NA" }
                ]
            });
            res.status(200).json(policies);
        } else {
            const policies = await Policy.find();
            res.status(200).json(policies);
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


module.exports = { PersonalDetails, updatePersonalDetails, getEmployees, createLeaveRequest, updateLeaveRequest, deleteLeaveRequest, getLeaveRequestsForLoggedInEmployee, getAttendanceRecordsForAllEmployees, getLeaveRequestsForemployee, getLeave, applyForResignation, markAttendance, markCheckIn, markCheckOut, getAttendanceRecords, getAttendanceRecordsForEmployee, getPolicies };