const express = require('express');
const {PersonalDetails, getEmployees, createLeaveRequest, updateLeaveRequest , deleteLeaveRequest, getLeaveRequestsForLoggedInEmployee, applyForResignation, markAttendance, markCheckIn, markCheckOut, getAttendanceRecords, getPolicies} = require('../controllers/controllers');
const { authenticateToken } = require('../middleware/verifyToken');

const EmployeeRoutes = express.Router();

EmployeeRoutes.get('/personaldetails', authenticateToken, PersonalDetails)
EmployeeRoutes.get('/getallemployees', getEmployees)
EmployeeRoutes.post('/createrequest', authenticateToken, createLeaveRequest)
EmployeeRoutes.put('/updaterequest/:leave_id', updateLeaveRequest)
EmployeeRoutes.delete('/deleterequest/:leave_id', deleteLeaveRequest)
EmployeeRoutes.get('/getleaverequests/:employee_id', authenticateToken, getLeaveRequestsForLoggedInEmployee)
EmployeeRoutes.post('/applyforresignation', authenticateToken, applyForResignation)
EmployeeRoutes.post('/markattendance', authenticateToken, markAttendance)
EmployeeRoutes.post('/markcheckin', authenticateToken, markCheckIn)
EmployeeRoutes.put('/markcheckout', authenticateToken, markCheckOut)
EmployeeRoutes.get('/getattendancerecords', authenticateToken, getAttendanceRecords)
EmployeeRoutes.get('/getpolicies', authenticateToken, getPolicies)


module.exports = EmployeeRoutes