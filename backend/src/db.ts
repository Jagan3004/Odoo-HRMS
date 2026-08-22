import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

export const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'dayflow_hrms',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL pool error:', err);
});

/**
 * Test the database connection. Call on server startup.
 */
export async function testConnection(): Promise<void> {
  const client = await pool.connect();
  try {
    const res = await client.query('SELECT NOW() AS server_time');
    console.log(`✅ PostgreSQL connected — Server time: ${res.rows[0].server_time}`);
  } finally {
    client.release();
  }
}

// ====================================================================
// Row → App Object Mappers
// ====================================================================

/** Map an employees row to the frontend Employee shape */
export function mapEmployee(row: any) {
  return {
    id: row.id,
    employeeId: row.employee_id,
    name: row.name,
    email: row.email,
    role: row.role,
    designation: row.designation,
    department: row.department,
    joiningDate: row.joining_date instanceof Date ? row.joining_date.toISOString().split('T')[0] : row.joining_date,
    phone: row.phone || '',
    address: row.address || '',
    emergencyContact: row.emergency_contact || '',
    avatarUrl: row.avatar_url || '',
    managerName: row.manager_name || '',
    salaryStructure: {
      basic: Number(row.salary_basic),
      hra: Number(row.salary_hra),
      specialAllowance: Number(row.salary_special_allowance),
      conveyance: Number(row.salary_conveyance),
      pfDeduction: Number(row.salary_pf_deduction),
      taxDeduction: Number(row.salary_tax_deduction),
      grossSalary: Number(row.salary_gross),
      netSalary: Number(row.salary_net),
    },
    documents: Array.isArray(row.documents_json)
      ? row.documents_json.map((document: any) => ({
        id: document.id,
        name: document.name,
        type: document.type,
        url: document.file_url,
        uploadDate: document.upload_date instanceof Date ? document.upload_date.toISOString().split('T')[0] : document.upload_date,
      }))
      : [],
    leaveBalance: {
      paidLeave: row.leave_paid,
      sickLeave: row.leave_sick,
      unpaidLeave: row.leave_unpaid,
    },
  };
}

/** Map an attendance row */
export function mapAttendance(row: any) {
  return {
    id: row.id,
    employeeId: row.employee_id,
    date: row.date instanceof Date ? row.date.toISOString().split('T')[0] : row.date,
    checkIn: row.check_in || undefined,
    checkOut: row.check_out || undefined,
    totalHours: row.total_hours ? Number(row.total_hours) : undefined,
    status: row.status,
    notes: row.notes || '',
    employeeName: row.employee_name || row.emp_name || undefined,
    department: row.emp_department || undefined,
  };
}

/** Map a leave request row */
export function mapLeave(row: any) {
  return {
    id: row.id,
    employeeId: row.employee_id,
    employeeName: row.employee_name,
    department: row.department,
    leaveType: row.leave_type,
    startDate: row.start_date instanceof Date ? row.start_date.toISOString().split('T')[0] : row.start_date,
    endDate: row.end_date instanceof Date ? row.end_date.toISOString().split('T')[0] : row.end_date,
    totalDays: row.total_days,
    reason: row.reason,
    status: row.status,
    appliedDate: row.applied_date instanceof Date ? row.applied_date.toISOString().split('T')[0] : row.applied_date,
    adminComment: row.admin_comment || '',
    reviewedBy: row.reviewed_by || undefined,
    reviewedAt: row.reviewed_at || undefined,
  };
}

/** Map a payslip row */
export function mapPayslip(row: any) {
  return {
    id: row.id,
    employeeId: row.employee_id,
    month: row.month,
    monthCode: row.month_code,
    paidDays: row.paid_days,
    salaryStructure: {
      basic: Number(row.salary_basic),
      hra: Number(row.salary_hra),
      specialAllowance: Number(row.salary_special_allowance),
      conveyance: Number(row.salary_conveyance),
      pfDeduction: Number(row.salary_pf_deduction),
      taxDeduction: Number(row.salary_tax_deduction),
      grossSalary: Number(row.salary_gross),
      netSalary: Number(row.salary_net),
    },
    issuedDate: row.issued_date instanceof Date ? row.issued_date.toISOString().split('T')[0] : row.issued_date,
    status: row.status,
  };
}

/** Map a notification row */
export function mapNotification(row: any) {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    message: row.message,
    type: row.type,
    createdAt: row.created_at,
    read: row.read,
  };
}
