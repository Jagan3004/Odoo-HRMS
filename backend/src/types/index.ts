export type Role = 'Admin' | 'Employee';

export interface User {
  id: string;
  employeeId: string;
  email: string;
  passwordHash: string;
  role: Role;
  createdAt: string;
}

export interface SalaryStructure {
  basic: number;
  hra: number;
  specialAllowance: number;
  conveyance: number;
  pfDeduction: number;
  taxDeduction: number;
  grossSalary: number;
  netSalary: number;
}

export interface Employee {
  id: string;
  employeeId: string; // e.g. EMP-101
  name: string;
  email: string;
  role: Role;
  designation: string;
  department: string;
  joiningDate: string;
  phone: string;
  address: string;
  emergencyContact: string;
  avatarUrl?: string;
  managerName?: string;
  salaryStructure: SalaryStructure;
  documents: { id: string; name: string; type: string; uploadDate: string; url: string }[];
  leaveBalance: {
    paidLeave: number; // default e.g. 15
    sickLeave: number; // default e.g. 10
    unpaidLeave: number; // unlimited
  };
}

export type AttendanceStatus = 'Present' | 'Absent' | 'Half-day' | 'Leave';

export interface AttendanceRecord {
  id: string;
  employeeId: string; // EMP-101
  date: string; // YYYY-MM-DD
  checkIn?: string; // HH:mm:ss
  checkOut?: string; // HH:mm:ss
  totalHours?: number;
  status: AttendanceStatus;
  notes?: string;
}

export type LeaveType = 'Paid' | 'Sick' | 'Unpaid';
export type LeaveStatus = 'Pending' | 'Approved' | 'Rejected';

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  leaveType: LeaveType;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  totalDays: number;
  reason: string;
  status: LeaveStatus;
  appliedDate: string;
  adminComment?: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

export interface Payslip {
  id: string;
  employeeId: string;
  month: string; // e.g. "August 2026"
  monthCode: string; // e.g. "2026-08"
  paidDays: number;
  salaryStructure: SalaryStructure;
  issuedDate: string;
  status: 'Paid' | 'Processing';
}

export interface AppNotification {
  id: string;
  userId: string; // or 'ALL' or 'ADMIN'
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  createdAt: string;
  read: boolean;
}
