const express = require('express');
const router = express.Router();
const Role = require('../models/Role');

// Ensure this matches the URL you're requesting in the frontend: /api/roles/:role/permissions
router.get('/roles/:role/permissions', async (req, res) => {
    const { role } = req.params;
    
    try {
        const roleWithPermissions = await Role.findOne({ role_name: role });
        if (!roleWithPermissions) {
            return res.status(404).json({ message: 'Role not found' });
        }

        res.json(roleWithPermissions.permissions);
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;
