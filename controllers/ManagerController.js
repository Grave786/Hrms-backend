const Employee = require('../models/Employee');
const SuperAdmin = require('../models/SuperAdmin');
const Project = require('../models/Project');
const jwt = require('jsonwebtoken');

const createProject = async (req, res) => {
    const { project_id, name, org_id, description, department_id, start_date, end_date, status } = req.body;
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

        const organization = user.org_id;

        const lastDepartment = await Project.findOne().sort({ project_id: -1 });
        const serialNumber = lastDepartment ? parseInt(lastDepartment.project_id.slice(1)) + 1 : 1;
        const paddedSerialNumber = serialNumber.toString().padStart(3, '0');
        const NewProject_id = `P${paddedSerialNumber}`;


        const newProject = new Project({
            project_id: NewProject_id,
            name,
            description,
            org_id: org_id || organization,
            department_id,
            start_date,
            end_date,
            status,
        });

        await newProject.save();

        res.status(201).json({
            message: 'Project created successfully',
            project: newProject,
        });
    } catch (error) {
        res.status(400).json({
            message: 'Error creating project',
            error: error.message,
        });
    }
}

const updateProject = async (req, res) => {

    const { project_id } = req.params;

    const { name, description, department_id, org_id, start_date, end_date, status } = req.body;

    try {
        let project = await Project.findOne({ project_id });

        if (!project) {
            return res.status(404).json({ success: false, message: "Project not found" });
        }

        project.name = name || project.name;
        project.description = description || project.description;
        project.department_id = department_id || project.department_id;
        project.org_id = org_id || project.org_id;
        project.start_date = start_date || project.start_date;
        project.end_date = end_date || project.end_date;
        project.status = status || project.status;
        project.updated_at = new Date();

        const updatedProject = await project.save();

        res.status(200).json({
            message: "Project updated successfully",
            project: updatedProject,
        });
    } catch (error) {
        res.status(500).json({
            message: "Error updating project",
            error: error.message,
        });
    }
};

const getAllProjects = async (req, res) => {
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
            const projects = await Project.find({ org_id });
            res.status(200).json({
                message: 'Projects retrieved successfully',
                projects,
            });
        } else {
            const projects = await Project.find();
            res.status(200).json({
                message: 'Projects retrieved successfully',
                projects,
            });
        }


    } catch (error) {
        res.status(500).json({
            message: 'Error retrieving projects',
            error: error.message,
        });
    }
};

const getProject = async (req, res) => {
    const { projectId } = req.params;

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

        const project = await Project.findOne({ project_id: projectId });

        if (!project) {
            return res.status(404).json({ success: false, message: "Project not found" });
        }

        if (roleId !== 'superadmin' && project.org_id !== org_id) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized: User not authorized',
            });
        }

        res.status(200).json({
            success: true,
            project
        });
    } catch (error) {
        res.status(500).json({
            message: "Error fetching project",
            error: error.message,
        });
    }
};

const deleteProject = async (req, res) => {
    const { project_id } = req.params;

    try {
        const project = await Project.findOneAndDelete({ project_id });

        if (!project) {
            return res.status(404).json({ success: false, message: "Project not found" });
        }

        res.status(200).json({
            success: true,
            message: "Project deleted successfully"
        });
    } catch (error) {
        res.status(500).json({
            message: "Error deleting project",
            error: error.message,
        });
    }
};


module.exports = { createProject, updateProject, getAllProjects, getProject, deleteProject }
