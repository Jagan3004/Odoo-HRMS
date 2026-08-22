"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const db_1 = require("./db");
const auth_1 = __importDefault(require("./routes/auth"));
const employees_1 = __importDefault(require("./routes/employees"));
const attendance_1 = __importDefault(require("./routes/attendance"));
const leaves_1 = __importDefault(require("./routes/leaves"));
const payroll_1 = __importDefault(require("./routes/payroll"));
const stats_1 = __importDefault(require("./routes/stats"));
const uploads_1 = __importDefault(require("./routes/uploads"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Serve uploaded files
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '../uploads')));
// API Routes
app.use('/api/auth', auth_1.default);
app.use('/api/employees', employees_1.default);
app.use('/api/attendance', attendance_1.default);
app.use('/api/leaves', leaves_1.default);
app.use('/api/payroll', payroll_1.default);
app.use('/api/stats', stats_1.default);
app.use('/api/uploads', uploads_1.default);
// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'Dayflow HRMS Backend', database: 'PostgreSQL' });
});
// Start server with DB connection test
async function start() {
    try {
        await (0, db_1.testConnection)();
        app.listen(PORT, () => {
            console.log(`=================================================`);
            console.log(`🚀 Dayflow HRMS Backend running on port ${PORT}`);
            console.log(`🔗 Health Check: http://localhost:${PORT}/api/health`);
            console.log(`💾 Database: PostgreSQL (${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME || 'dayflow_hrms'})`);
            console.log(`=================================================`);
        });
    }
    catch (err) {
        console.error('❌ Failed to connect to PostgreSQL:', err);
        console.error('   Make sure PostgreSQL is running and the database "dayflow_hrms" exists.');
        console.error('   Run the schema.sql script in pgAdmin first.');
        process.exit(1);
    }
}
start();
