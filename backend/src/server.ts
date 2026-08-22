import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { testConnection } from './db';
import authRoutes from './routes/auth';
import employeeRoutes from './routes/employees';
import attendanceRoutes from './routes/attendance';
import leaveRoutes from './routes/leaves';
import payrollRoutes from './routes/payroll';
import statsRoutes from './routes/stats';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/stats', statsRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'Dayflow HRMS Backend', database: 'PostgreSQL' });
});

// Start server with DB connection test
async function start() {
  try {
    await testConnection();
    app.listen(PORT, () => {
      console.log(`=================================================`);
      console.log(`🚀 Dayflow HRMS Backend running on port ${PORT}`);
      console.log(`🔗 Health Check: http://localhost:${PORT}/api/health`);
      console.log(`💾 Database: PostgreSQL (${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME || 'dayflow_hrms'})`);
      console.log(`=================================================`);
    });
  } catch (err) {
    console.error('❌ Failed to connect to PostgreSQL:', err);
    console.error('   Make sure PostgreSQL is running and the database "dayflow_hrms" exists.');
    console.error('   Run the schema.sql script in pgAdmin first.');
    process.exit(1);
  }
}

start();
