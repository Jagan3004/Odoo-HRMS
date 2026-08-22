"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = exports.Database = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const DATA_DIR = path_1.default.join(__dirname, '..', 'data');
const DB_FILE = path_1.default.join(DATA_DIR, 'db.json');
class Database {
    data;
    constructor() {
        this.ensureDirectory();
        this.data = this.loadData();
    }
    ensureDirectory() {
        if (!fs_1.default.existsSync(DATA_DIR)) {
            fs_1.default.mkdirSync(DATA_DIR, { recursive: true });
        }
    }
    loadData() {
        if (fs_1.default.existsSync(DB_FILE)) {
            try {
                const raw = fs_1.default.readFileSync(DB_FILE, 'utf-8');
                return JSON.parse(raw);
            }
            catch (err) {
                console.error('Error loading db.json, re-initializing seed data:', err);
            }
        }
        const seed = this.createSeedData();
        this.saveData(seed);
        return seed;
    }
    saveData(dataToSave) {
        if (dataToSave) {
            this.data = dataToSave;
        }
        fs_1.default.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    }
    getData() {
        return this.data;
    }
    createSeedData() {
        const passwordHashAdmin = bcryptjs_1.default.hashSync('admin123', 10);
        const passwordHashEmp = bcryptjs_1.default.hashSync('emp123', 10);
        const users = [
            {
                id: 'u-1',
                employeeId: 'HR-001',
                email: 'admin@dayflow.com',
                passwordHash: passwordHashAdmin,
                role: 'Admin',
                createdAt: new Date().toISOString(),
            },
            {
                id: 'u-2',
                employeeId: 'EMP-101',
                email: 'employee@dayflow.com',
                passwordHash: passwordHashEmp,
                role: 'Employee',
                createdAt: new Date().toISOString(),
            },
            {
                id: 'u-3',
                employeeId: 'EMP-102',
                email: 'john.doe@dayflow.com',
                passwordHash: passwordHashEmp,
                role: 'Employee',
                createdAt: new Date().toISOString(),
            },
            {
                id: 'u-4',
                employeeId: 'EMP-103',
                email: 'emily.chen@dayflow.com',
                passwordHash: passwordHashEmp,
                role: 'Employee',
                createdAt: new Date().toISOString(),
            },
            {
                id: 'u-5',
                employeeId: 'EMP-104',
                email: 'david.miller@dayflow.com',
                passwordHash: passwordHashEmp,
                role: 'Employee',
                createdAt: new Date().toISOString(),
            },
        ];
        const employees = [
            {
                id: 'e-1',
                employeeId: 'HR-001',
                name: 'Sarah Jenkins',
                email: 'admin@dayflow.com',
                role: 'Admin',
                designation: 'HR Lead & Operations Director',
                department: 'Human Resources',
                joiningDate: '2022-03-15',
                phone: '+1 (555) 234-5678',
                address: '742 Evergreen Terrace, Springfield, OR',
                emergencyContact: '+1 (555) 987-6543 (Spouse - Robert)',
                avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
                managerName: 'Board of Directors',
                salaryStructure: {
                    basic: 6500,
                    hra: 2600,
                    specialAllowance: 1900,
                    conveyance: 500,
                    pfDeduction: 780,
                    taxDeduction: 1100,
                    grossSalary: 11500,
                    netSalary: 9620,
                },
                documents: [
                    { id: 'doc-1', name: 'Employment_Contract.pdf', type: 'PDF', uploadDate: '2022-03-15', url: '#' },
                    { id: 'doc-2', name: 'Identity_Verification.pdf', type: 'PDF', uploadDate: '2022-03-15', url: '#' },
                ],
                leaveBalance: { paidLeave: 18, sickLeave: 10, unpaidLeave: 0 },
            },
            {
                id: 'e-2',
                employeeId: 'EMP-101',
                name: 'Alex Morgan',
                email: 'employee@dayflow.com',
                role: 'Employee',
                designation: 'Senior Frontend Engineer',
                department: 'Engineering',
                joiningDate: '2023-01-10',
                phone: '+1 (555) 345-6789',
                address: '100 Market St, San Francisco, CA',
                emergencyContact: '+1 (555) 876-5432 (Mother - Jane)',
                avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
                managerName: 'Sarah Jenkins',
                salaryStructure: {
                    basic: 5500,
                    hra: 2200,
                    specialAllowance: 1500,
                    conveyance: 400,
                    pfDeduction: 660,
                    taxDeduction: 840,
                    grossSalary: 9600,
                    netSalary: 8100,
                },
                documents: [
                    { id: 'doc-3', name: 'Offer_Letter.pdf', type: 'PDF', uploadDate: '2023-01-10', url: '#' },
                    { id: 'doc-4', name: 'Tax_Form_W2.pdf', type: 'PDF', uploadDate: '2024-01-20', url: '#' },
                ],
                leaveBalance: { paidLeave: 12, sickLeave: 7, unpaidLeave: 0 },
            },
            {
                id: 'e-3',
                employeeId: 'EMP-102',
                name: 'John Doe',
                email: 'john.doe@dayflow.com',
                role: 'Employee',
                designation: 'Backend Systems Architect',
                department: 'Engineering',
                joiningDate: '2022-08-01',
                phone: '+1 (555) 456-7890',
                address: '456 Mission St, San Francisco, CA',
                emergencyContact: '+1 (555) 765-4321 (Brother - Mark)',
                avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
                managerName: 'Sarah Jenkins',
                salaryStructure: {
                    basic: 6000,
                    hra: 2400,
                    specialAllowance: 1600,
                    conveyance: 400,
                    pfDeduction: 720,
                    taxDeduction: 980,
                    grossSalary: 10400,
                    netSalary: 8700,
                },
                documents: [
                    { id: 'doc-5', name: 'Joining_Agreement.pdf', type: 'PDF', uploadDate: '2022-08-01', url: '#' },
                ],
                leaveBalance: { paidLeave: 14, sickLeave: 9, unpaidLeave: 0 },
            },
            {
                id: 'e-4',
                employeeId: 'EMP-103',
                name: 'Emily Chen',
                email: 'emily.chen@dayflow.com',
                role: 'Employee',
                designation: 'UI/UX Product Designer',
                department: 'Design',
                joiningDate: '2023-05-18',
                phone: '+1 (555) 567-8901',
                address: '789 Castro St, San Francisco, CA',
                emergencyContact: '+1 (555) 654-3210 (Father - David)',
                avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
                managerName: 'Sarah Jenkins',
                salaryStructure: {
                    basic: 4800,
                    hra: 1920,
                    specialAllowance: 1280,
                    conveyance: 300,
                    pfDeduction: 576,
                    taxDeduction: 624,
                    grossSalary: 8300,
                    netSalary: 7100,
                },
                documents: [
                    { id: 'doc-6', name: 'Design_Portfolio_Cert.pdf', type: 'PDF', uploadDate: '2023-05-18', url: '#' },
                ],
                leaveBalance: { paidLeave: 15, sickLeave: 8, unpaidLeave: 0 },
            },
            {
                id: 'e-5',
                employeeId: 'EMP-104',
                name: 'David Miller',
                email: 'david.miller@dayflow.com',
                role: 'Employee',
                designation: 'Financial Analyst',
                department: 'Finance',
                joiningDate: '2023-11-01',
                phone: '+1 (555) 678-9012',
                address: '321 Pine St, San Francisco, CA',
                emergencyContact: '+1 (555) 543-2109 (Spouse - Jessica)',
                avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
                managerName: 'Sarah Jenkins',
                salaryStructure: {
                    basic: 5000,
                    hra: 2000,
                    specialAllowance: 1400,
                    conveyance: 400,
                    pfDeduction: 600,
                    taxDeduction: 700,
                    grossSalary: 8800,
                    netSalary: 7500,
                },
                documents: [],
                leaveBalance: { paidLeave: 16, sickLeave: 10, unpaidLeave: 0 },
            },
        ];
        // Seed attendance records for past 7 days
        const attendance = [];
        const today = new Date();
        for (let i = 0; i < 7; i++) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            employees.forEach((emp) => {
                if (i === 0 && emp.employeeId === 'EMP-101') {
                    // Leave open check-in for EMP-101 today
                    attendance.push({
                        id: `att-${dateStr}-${emp.employeeId}`,
                        employeeId: emp.employeeId,
                        date: dateStr,
                        checkIn: '09:05:12',
                        checkOut: undefined,
                        status: 'Present',
                        notes: 'On-time check in',
                    });
                }
                else {
                    const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                    if (!isWeekend) {
                        attendance.push({
                            id: `att-${dateStr}-${emp.employeeId}`,
                            employeeId: emp.employeeId,
                            date: dateStr,
                            checkIn: '09:00:00',
                            checkOut: '17:30:00',
                            totalHours: 8.5,
                            status: 'Present',
                        });
                    }
                }
            });
        }
        const leaves = [
            {
                id: 'l-1',
                employeeId: 'EMP-101',
                employeeName: 'Alex Morgan',
                department: 'Engineering',
                leaveType: 'Paid',
                startDate: '2026-09-01',
                endDate: '2026-09-03',
                totalDays: 3,
                reason: 'Annual family vacation',
                status: 'Pending',
                appliedDate: '2026-08-20',
            },
            {
                id: 'l-2',
                employeeId: 'EMP-102',
                employeeName: 'John Doe',
                department: 'Engineering',
                leaveType: 'Sick',
                startDate: '2026-08-18',
                endDate: '2026-08-19',
                totalDays: 2,
                reason: 'Severe flu and fever',
                status: 'Approved',
                appliedDate: '2026-08-17',
                adminComment: 'Approved. Rest well!',
                reviewedBy: 'Sarah Jenkins',
                reviewedAt: '2026-08-17 10:30',
            },
            {
                id: 'l-3',
                employeeId: 'EMP-103',
                employeeName: 'Emily Chen',
                department: 'Design',
                leaveType: 'Paid',
                startDate: '2026-08-25',
                endDate: '2026-08-26',
                totalDays: 2,
                reason: 'Personal appointments',
                status: 'Pending',
                appliedDate: '2026-08-21',
            },
        ];
        const payslips = employees.map((emp) => ({
            id: `pay-2026-07-${emp.employeeId}`,
            employeeId: emp.employeeId,
            month: 'July 2026',
            monthCode: '2026-07',
            paidDays: 22,
            salaryStructure: emp.salaryStructure,
            issuedDate: '2026-07-31',
            status: 'Paid',
        }));
        const notifications = [
            {
                id: 'notif-1',
                userId: 'ALL',
                title: 'Welcome to Dayflow HRMS',
                message: 'The new HR portal is now live! Track attendance, leaves, and payslips effortlessly.',
                type: 'info',
                createdAt: new Date().toISOString(),
                read: false,
            },
            {
                id: 'notif-2',
                userId: 'HR-001',
                title: 'New Leave Request Pending',
                message: 'Alex Morgan has submitted a 3-day Paid Leave request for review.',
                type: 'warning',
                createdAt: new Date().toISOString(),
                read: false,
            },
        ];
        return {
            users,
            employees,
            attendance,
            leaves,
            payslips,
            notifications,
        };
    }
}
exports.Database = Database;
exports.db = new Database();
