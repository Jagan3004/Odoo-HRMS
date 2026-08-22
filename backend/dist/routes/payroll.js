"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("../database");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// GET CURRENT EMPLOYEE PAYSLIPS
router.get('/my', auth_1.authenticateToken, (req, res) => {
    const employeeId = req.user?.employeeId;
    const data = database_1.db.getData();
    const emp = data.employees.find((e) => e.employeeId === employeeId);
    const employeePayslips = data.payslips.filter((p) => p.employeeId === employeeId);
    return res.json({
        currentSalaryStructure: emp?.salaryStructure || null,
        payslips: employeePayslips,
    });
});
// ADMIN: GET ALL PAYROLL RECORDS
router.get('/all', auth_1.authenticateToken, (0, auth_1.requireRole)('Admin'), (req, res) => {
    const data = database_1.db.getData();
    const payrollOverview = data.employees.map((emp) => {
        const payslips = data.payslips.filter((p) => p.employeeId === emp.employeeId);
        return {
            employeeId: emp.employeeId,
            id: emp.id,
            name: emp.name,
            department: emp.department,
            designation: emp.designation,
            salaryStructure: emp.salaryStructure,
            latestPayslip: payslips[0] || null,
            totalPayslips: payslips.length,
        };
    });
    return res.json(payrollOverview);
});
// ADMIN: UPDATE SALARY STRUCTURE FOR AN EMPLOYEE
router.put('/salary-structure/:employeeId', auth_1.authenticateToken, (0, auth_1.requireRole)('Admin'), (req, res) => {
    const { basic, hra, specialAllowance, conveyance, pfDeduction, taxDeduction } = req.body;
    const data = database_1.db.getData();
    const emp = data.employees.find((e) => e.employeeId === req.params.employeeId || e.id === req.params.employeeId);
    if (!emp) {
        return res.status(404).json({ message: 'Employee not found' });
    }
    const newBasic = Number(basic) || emp.salaryStructure.basic;
    const newHra = Number(hra) || emp.salaryStructure.hra;
    const newSpecial = Number(specialAllowance) || emp.salaryStructure.specialAllowance;
    const newConveyance = Number(conveyance) || emp.salaryStructure.conveyance;
    const newPf = Number(pfDeduction) || emp.salaryStructure.pfDeduction;
    const newTax = Number(taxDeduction) || emp.salaryStructure.taxDeduction;
    const grossSalary = newBasic + newHra + newSpecial + newConveyance;
    const totalDeductions = newPf + newTax;
    const netSalary = grossSalary - totalDeductions;
    const updatedStructure = {
        basic: newBasic,
        hra: newHra,
        specialAllowance: newSpecial,
        conveyance: newConveyance,
        pfDeduction: newPf,
        taxDeduction: newTax,
        grossSalary,
        netSalary,
    };
    emp.salaryStructure = updatedStructure;
    database_1.db.saveData(data);
    return res.json({ message: 'Salary structure updated successfully', salaryStructure: updatedStructure });
});
// ADMIN: GENERATE MONTHLY PAYSLIPS
router.post('/generate', auth_1.authenticateToken, (0, auth_1.requireRole)('Admin'), (req, res) => {
    const { month, monthCode } = req.body; // e.g. month: "August 2026", monthCode: "2026-08"
    if (!month || !monthCode) {
        return res.status(400).json({ message: 'Month label and month code are required' });
    }
    const data = database_1.db.getData();
    let generatedCount = 0;
    data.employees.forEach((emp) => {
        const existing = data.payslips.find((p) => p.employeeId === emp.employeeId && p.monthCode === monthCode);
        if (!existing) {
            data.payslips.unshift({
                id: `pay-${monthCode}-${emp.employeeId}`,
                employeeId: emp.employeeId,
                month,
                monthCode,
                paidDays: 22,
                salaryStructure: emp.salaryStructure,
                issuedDate: new Date().toISOString().split('T')[0],
                status: 'Paid',
            });
            generatedCount++;
        }
    });
    database_1.db.saveData(data);
    return res.json({ message: `Payslips generated for ${generatedCount} employees for ${month}`, count: generatedCount });
});
exports.default = router;
