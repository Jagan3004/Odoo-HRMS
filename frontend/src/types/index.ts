export type Role = 'Admin' | 'HR' | 'Employee';

export interface User {
  id: string;
  employeeId: string;
  email: string;
  role: Role;
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
  employeeId: string;
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
    paidLeave: number;
    sickLeave: number;
    unpaidLeave: number;
  };
}

export type AttendanceStatus = 'Present' | 'Absent' | 'Half-day' | 'Leave';

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName?: string;
  department?: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
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
  startDate: string;
  endDate: string;
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
  month: string;
  monthCode: string;
  paidDays: number;
  salaryStructure: SalaryStructure;
  issuedDate: string;
  status: 'Paid' | 'Processing';
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  createdAt: string;
  read: boolean;
}

export interface AdminStats {
  totalEmployees: number;
  presentToday: number;
  activeLeavesToday: number;
  pendingLeaveRequests: number;
  totalMonthlyPayroll: number;
  departmentBreakdown: { name: string; count: number }[];
  attendanceTrend: { date: string; fullDate: string; Present: number; Leave: number; Absent: number }[];
}

export interface EmployeeStats {
  employee: Employee;
  todayAttendance: AttendanceRecord | null;
  leaveBalance: { paidLeave: number; sickLeave: number; unpaidLeave: number };
  pendingLeavesCount: number;
}
