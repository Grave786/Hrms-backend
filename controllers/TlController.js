const Task = require('../models/Task');
const SuperAdmin = require('../models/SuperAdmin');
const Employee = require('../models/Employee');
const jwt = require('jsonwebtoken');
const Leave = require('../models/Leave');
const Role = require('../models/Role');
const mongoose = require('mongoose');

const createTask = async (req, res) => {
    const { task_id, project_id, assigned_by, assigned_to, description, deadline, status } = req.body;
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
        
        const organization = user.org_id || req.body.org_id;

        const lastTask = await Task.findOne().sort({ task_id: -1 });
        const serialNumber = lastTask ? parseInt(lastTask.task_id.slice(1)) + 1 : 1;
        const paddedSerialNumber = serialNumber.toString().padStart(3, '0');
        const NewTask_id = `T${paddedSerialNumber}`;

        const newTask = new Task({
            task_id: NewTask_id,
            project_id,
            org_id: organization,
            assigned_by,
            assigned_to,
            description,
            deadline,
            status,
        });

        await newTask.save();

        res.status(201).json({
            message: 'Task created successfully',
            task: newTask,
        });
    } catch (error) {
        res.status(400).json({
            message: 'Error creating task',
            error: error.message,
        });
    }
};

const updateTask = async (req, res) => {
    const { task_id } = req.params;
    const { project_id, assigned_by, assigned_to, description, deadline, status, remark } = req.body;

    try {
        const updatedTask = await Task.findOneAndUpdate(
            { task_id },
            { project_id, assigned_by, assigned_to, description, deadline, status, remark, updated_at: new Date() },
            { new: true, runValidators: true }
        );

        if (!updatedTask) {
            return res.status(404).json({
                message: 'Task not found',
            });
        }

        res.status(200).json({
            message: 'Task updated successfully',
            task: updatedTask,
        });
    } catch (error) {
        res.status(400).json({
            message: 'Error updating task',
            error: error.message,
        });
    }
};

const getAllTasks = async (req, res) => {
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
            const tasks = await Task.find({ org_id });
            res.status(200).json({
                message: 'Tasks retrieved successfully',
                tasks,
            });
        } else {
            const tasks = await Task.find();
            res.status(200).json({
                message: 'Tasks retrieved successfully',
                tasks,
            });
        }
    } catch (error) {
        res.status(500).json({
            message: 'Error retrieving tasks',
            error: error.message,
        });
    }
};

const getTask = async (req, res) => {
    const { task_id } = req.params;

    try {
        const task = await Task.findOne({ task_id });

        if (!task) {
            return res.status(404).json({
                message: 'Task not found',
            });
        }

        res.status(200).json({
            message: 'Task retrieved successfully',
            task,
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error retrieving task',
            error: error.message,
        });
    }
}

const deleteTask = async (req, res) => {
    const { task_id } = req.params;

    try {
        const deletedTask = await Task.findOneAndDelete({ task_id });

        if (!deletedTask) {
            return res.status(404).json({
                message: 'Task not found',
            });
        }

        res.status(200).json({
            message: 'Task deleted successfully',
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error deleting task',
            error: error.message,
        });
    }
};

const getLeaveRequestsByManager = async (req, res) => {
    try {
        const token = req.cookies.token;

        if (!token) {
            return res.status(401).json({ success: false, message: "Token is missing" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId;
        const user = await SuperAdmin.findById(userId) || await Employee.findById(userId);

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        if (user.role === 'superadmin') {
            const leaveRequests = await Leave.find();
            return res.status(200).json({
                success: true,
                message: "Leave requests retrieved successfully",
                leaveRequests
            });
        } else if (user.role === 'admin') {
            const leaveRequests = await Leave.aggregate([
                {
                    $lookup: {
                        from: "employees",
                        localField: "employee_id",
                        foreignField: "_id",
                        as: "employee"
                    }
                },
                {
                    $unwind: "$employee"
                },
                {
                    $match: {
                        "employee.org_id": user.org_id
                    }
                },
                {
                    $project: {
                        _id: 1,
                        employee_id: 1,
                        leave_type: 1,
                        start_date: 1,
                        end_date: 1,
                        status: 1,
                        reason: 1,
                        created_at: 1,
                        employee: { first_name: 1, last_name: 1 }
                    }
                }
            ]);

            return res.status(200).json({
                success: true,
                message: "Leave requests retrieved successfully",
                leaveRequests
            });
        } else {
            const leaveRequests = await Leave.aggregate([
                {
                    $match: {
                        manager_id: new mongoose.Types.ObjectId(userId) // Match manager_id with the logged-in user's ID
                    }
                },
                {
                    $project: {
                        _id: 1,
                        employee_id: 1,
                        leave_type: 1,
                        start_date: 1,
                        end_date: 1,
                        status: 1,
                        reason: 1,
                        created_at: 1
                    }
                }
            ]);

            return res.status(200).json({
                success: true,
                message: "Leave requests retrieved successfully",
                leaveRequests
            });
        }

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error retrieving leave requests",
            error: error.message
        });
    }
};



const approveOrRejectLeaveRequest = async (req, res) => {
    const { leave_id } = req.params;
    const { decision } = req.body;

    if (!['approve', 'reject'].includes(decision)) {
        return res.status(400).json({ success: false, message: "Invalid decision" });
    }

    try {
        const token = req.cookies.token;

        if (!token) {
            return res.status(401).json({ success: false, message: "Token is missing" });
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
        
        const leaveRequest = await Leave.findById(leave_id);
        
        const emp = leaveRequest.employee_id;
        const orgId = await Employee.findById(emp).select('org_id');
        if (!leaveRequest) {
            return res.status(404).json({ success: false, message: "Leave request not found" });
        }
        
        if(roleId !== 'superadmin' && orgId.org_id !== org_id) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized: You are not authorized to approve/reject this leave request'
            })
        }
        
        leaveRequest.status = decision === 'approve' ? 'Approved' : 'Rejected';
        leaveRequest.approval_by = decoded.userId;

        await leaveRequest.save();

        res.status(200).json({
            success: true,
            message: `Leave request ${decision} successfully`,
            leaveRequest
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error processing the leave request",
            error: error.message
        });
    }
};



module.exports = { createTask, updateTask, getAllTasks, getTask, deleteTask, approveOrRejectLeaveRequest, getLeaveRequestsByManager };
