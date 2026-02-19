const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const AuthRoutes = require('./routes/Auth');
const cookieParser = require('cookie-parser');
const PermissionBasedRouting = require('./routes/PermissionBasedRouting');
const RoleRoutes = require('./routes/RoleRoutes');

const app = express();
const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);
dotenv.config();

connectDB();

app.use(express.json());
app.use(cookieParser());
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://master.d1oxiphkrlrdlz.amplifyapp.com',
    'https://hrms-backend-tau.vercel.app',
    'https://requin.in',
    process.env.WEB_API // Production env
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use('/api/auth', AuthRoutes);

app.use('/api/user', PermissionBasedRouting);
app.use('/api', RoleRoutes);

app.use('/api/get-role', (req, res) => {
    const token = req.cookies.token;
    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Unauthorized: No token provided',
        });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const role = decoded.role;
        res.status(200).json({ role });
    } catch (error) {
        res.status(401).json({
            success: false,
            message: 'Unauthorized: Invalid token',
        });
    }
});


app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.listen(process.env.PORT, () => console.log(`Server started on port ${process.env.PORT}`));
