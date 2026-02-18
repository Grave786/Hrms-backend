const express = require('express');
const { isSuperAdmin } = require('../middleware/verifyToken');
const { createRole, updateRole, getAllRoles, deleteRole, createDepartment, updateDepartment, getAllDepartments, deleteDepartment, addEmployee, updateEmployee, getAllEmployees, deleteEmployee, getAdminsByAdmin, addAdmin, updateAdmin, getAdminsBySuperAdmin, deleteAdmin, createOrganization, updateOrganization, getAllOrganizations, deleteOrganization } = require('../controllers/controllers');

const SuperAdminRoutes = express.Router();

//superAdmin routes
SuperAdminRoutes.post('/addadmin', isSuperAdmin, addAdmin)
SuperAdminRoutes.put('/updateadmin/:id', isSuperAdmin, updateAdmin)
SuperAdminRoutes.get('/getadmins', isSuperAdmin, getAdminsBySuperAdmin)
SuperAdminRoutes.delete('/deleteadmin/:id', isSuperAdmin, deleteAdmin)
SuperAdminRoutes.post('/createorganization', isSuperAdmin, createOrganization)
SuperAdminRoutes.put('/updateorganization/:id', isSuperAdmin, updateOrganization)
SuperAdminRoutes.get('/getallorganizations', isSuperAdmin, getAllOrganizations)
SuperAdminRoutes.delete('/deleteorganization/:id', isSuperAdmin, deleteOrganization)


//admin routes
SuperAdminRoutes.get('/getadmins', isSuperAdmin, getAdminsByAdmin)
SuperAdminRoutes.post('/createrole', isSuperAdmin, createRole)
SuperAdminRoutes.put('/updaterole/:id', isSuperAdmin, updateRole)
SuperAdminRoutes.get('/getallroles', isSuperAdmin, getAllRoles)
SuperAdminRoutes.delete('/deleterole/:id', isSuperAdmin, deleteRole)
SuperAdminRoutes.post('/createdepartment', isSuperAdmin, createDepartment)
SuperAdminRoutes.put('/updatedepartment/:id', isSuperAdmin, updateDepartment)
SuperAdminRoutes.get('/getalldepartments', isSuperAdmin, getAllDepartments)
SuperAdminRoutes.delete('/deletedepartment/:id', isSuperAdmin, deleteDepartment)
SuperAdminRoutes.post('/addemployee', isSuperAdmin, addEmployee)
SuperAdminRoutes.put('/updateemployee/:id', isSuperAdmin, updateEmployee)
SuperAdminRoutes.get('/getallemployees', isSuperAdmin, getAllEmployees)
SuperAdminRoutes.delete('/deleteemployee/:id', isSuperAdmin, deleteEmployee)


module.exports = SuperAdminRoutes
