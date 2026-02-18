const express = require('express');
const {getAdminsByAdmin, createPermission, createRole, updateRole, getAllRoles, deleteRole, createDepartment, updateDepartment, getAllDepartments, deleteDepartment, addEmployee, updateEmployee, getAllEmployees, deleteEmployee} = require('../controllers/controllers');
const {isAdmin} = require('../middleware/verifyToken');

const AdminRoutes = express.Router();

//admin routes
AdminRoutes.get('/getadmins', isAdmin, getAdminsByAdmin)
AdminRoutes.post('/createpermission', isAdmin, createPermission)
AdminRoutes.post('/createrole', isAdmin, createRole)
AdminRoutes.put('/updaterole/:id', isAdmin, updateRole)
AdminRoutes.get('/getallroles', isAdmin, getAllRoles)
AdminRoutes.delete('/deleterole/:id', isAdmin, deleteRole)
AdminRoutes.post('/createdepartment', isAdmin, createDepartment)
AdminRoutes.put('/updatedepartment/:id', isAdmin, updateDepartment)
AdminRoutes.get('/getalldepartments', isAdmin, getAllDepartments)
AdminRoutes.delete('/deletedepartment/:id', isAdmin, deleteDepartment)

//HR routes
AdminRoutes.post('/addemployee', isAdmin, addEmployee)
AdminRoutes.put('/updateemployee/:id', isAdmin, updateEmployee)
AdminRoutes.get('/getallemployees', isAdmin, getAllEmployees)
AdminRoutes.delete('/deleteemployee/:id', isAdmin, deleteEmployee)

module.exports = AdminRoutes
