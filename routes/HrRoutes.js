const express = require('express');
const {addEmployee, updateEmployee, getAllEmployees, deleteEmployee, assignAsset, updateAsset, getAllAssets, handleResignationRequest,createPayrollRecord, getPayrollRecord, CreatePolicy, UpdatePolicy, DeletePolicy} = require('../controllers/controllers');
const {isHR} = require('../middleware/verifyToken');

const HrRoutes = express.Router();

//HR routes
HrRoutes.post('/addemployee', isHR, addEmployee)
HrRoutes.put('/updateemployee/:id', isHR, updateEmployee)
HrRoutes.get('/getallemployees', isHR, getAllEmployees)
HrRoutes.delete('/deleteemployee/:id', isHR, deleteEmployee)
HrRoutes.post('/assignasset', isHR, assignAsset)
HrRoutes.put('/updateasset/:asset_id', isHR, updateAsset)
HrRoutes.get('/getallassets', isHR, getAllAssets)
HrRoutes.put('/resignationrequest/:resignationId', isHR, handleResignationRequest)
HrRoutes.post('/createpayrollrecord/:employeeId', isHR, createPayrollRecord)
HrRoutes.get('/getpayrollrecord/:employeeId', isHR, getPayrollRecord)
HrRoutes.post('/createpolicy', isHR, CreatePolicy)
HrRoutes.put('/updatepolicy/:policyId', isHR, UpdatePolicy)
HrRoutes.delete('/deletepolicy/:policyId', isHR, DeletePolicy)

module.exports = HrRoutes
