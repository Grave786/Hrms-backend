const express = require('express');
const {createTask, updateTask, getAllTasks, deleteTask, approveOrRejectLeaveRequest, getLeaveRequestsByManager} = require('../controllers/controllers');
const {isTL, authenticateToken} = require('../middleware/verifyToken');

const TlRoutes = express.Router();

//manager routes
TlRoutes.post('/createtask', isTL, createTask)
TlRoutes.put('/updatetask/:task_id', isTL, updateTask)
TlRoutes.get('/getalltasks', isTL, getAllTasks)
TlRoutes.delete('/deletetask/:task_id', isTL, deleteTask)
TlRoutes.put('/leaves/:leave_id', authenticateToken, approveOrRejectLeaveRequest);
TlRoutes.get('/getleaves', authenticateToken, getLeaveRequestsByManager);

module.exports = TlRoutes
