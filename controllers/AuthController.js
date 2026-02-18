const SuperAdmin = require('../models/SuperAdmin');
const Employee = require('../models/Employee');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        let user = await SuperAdmin.findOne({ email });

        if (!user) {
            user = await Employee.findOne({ email }).populate('role_id', 'role_name');

            if (user.status === 'Inactive') {
                return res.status(200).json({ message: 'User is inactive' });
            }

            //if user is on notice period and there resignation date is passed then don't login and change status to inactive
            if (user.status === 'On Notice Period' && new Date() >= user.resignation_date) {
                user.status = 'Inactive';
                await user.save();
                return res.status(401).json({ message: 'User is inactive' });
            }

            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }

            if (!user.role_id || !user.role_id.role_name) {
                return res.status(500).json({ message: "Employee role not found" });
            }
        }

        // Compare the password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(500).json({ message: "Invalid credentials" });
        }

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.WEB_API,
            sameSite: 'none',
            maxAge: 1000 * 60 * 30
        });


        let roleName = user.role || user.role_id.role_name;
        if (user.role_id && user.role_id.role_name) {
            roleName = user.role_id.role_name;
        }

        const org_id = user.org_id;

        res.status(200).json({
            success: true,
            message: "Login successful",
            role: roleName,
            role_id: user.role_id,
            org_id: org_id,
            token
        });

    } catch (error) {
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

const logout = async (req, res) => {
    try {
        res.clearCookie('token');
        res.status(200).json({ success: true, message: "Logout successful" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}

module.exports = { login, logout };
