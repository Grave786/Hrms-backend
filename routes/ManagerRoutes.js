const express = require('express');
const {createProject, updateProject, getAllProjects, deleteProject} = require('../controllers/controllers');
const {isManager} = require('../middleware/verifyToken');

const ManagerRoutes = express.Router();

//manager routes
ManagerRoutes.post('/createproject', isManager, createProject)
ManagerRoutes.put('/updateproject/:project_id', isManager, updateProject)
ManagerRoutes.get('/getallprojects', isManager, getAllProjects)
ManagerRoutes.delete('/deleteproject/:project_id', isManager, deleteProject)

module.exports = ManagerRoutes
