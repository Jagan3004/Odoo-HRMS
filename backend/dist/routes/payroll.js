"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../db");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// GET CURRENT EMPLOYEE PAYSLIPS
router.get('/my', auth_1.authenticateToken, async (req, res) => {
    try {
        const empResult = await db_1.pool.query('SELECT * FROM employees WHERE employee_id = $1', [req.user?.employeeId]);
        const payslipResult = await db_1.pool.query('SELECT * FROM payslips WHERE employee_id = $1 ORDER BY month_code DESC', [req.user?.employeeId]);
        const emp = empResult.rows.length > 0 ? (0, db_1.mapEmployee)(empResult.rows[0]) : null;
        return res.json({
            currentSalaryStructure: emp?.salaryStructure || null,
            payslips: payslipResult.rows.map(db_1.mapPayslip),
        });
    }
    catch (err) {
        console.error('Get my payroll error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
});
// ADMIN: GET ALL PAYROLL RECORDS
router.get('/all', auth_1.authenticateToken, (0, auth_1.requireRole)('Admin'), async (req, res) => {
    try {
        const empResult = await db_1.pool.query('SELECT * FROM employees ORDER BY name');
        const overview = await Promise.all(empResult.rows.map(async (emp) => {
            const payslipResult = await db_1.pool.query('SELECT * FROM payslips WHERE employee_id = $1 ORDER BY month_code DESC LIMIT 1', [emp.employee_id]);
            const mapped = (0, db_1.mapEmployee)(emp);
            return {
                employeeId: mapped.employeeId,
                id: mapped.id,
                name: mapped.name,
                department: mapped.department,
                designation: mapped.designation,
                salaryStructure: mapped.salaryStructure,
                latestPayslip: payslipResult.rows.length > 0 ? (0, db_1.mapPayslip)(payslipResult.rows[0]) : null,
                totalPayslips: payslipResult.rowCount || 0,
            };
        }));
        return res.json(overview);
    }
    catch (err) {
        console.error('Get all payroll error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
});
// ADMIN: UPDATE SALARY STRUCTURE
router.put('/salary-structure/:employeeId', auth_1.authenticateToken, (0, auth_1.requireRole)('Admin'), async (req, res) => {
    const { basic, hra, specialAllowance, conveyance, pfDeduction, taxDeduction } = req.body;
    try {
        const empResult = await db_1.pool.query('SELECT * FROM employees WHERE employee_id = $1 OR id::text = $1', [req.params.employeeId]);
        if (empResult.rows.length === 0) {
            return res.status(404).json({ message: 'Employee not found' });
        }
        const emp = empResult.rows[0];
        const newBasic = Number(basic) || Number(emp.salary_basic);
        const newHra = Number(hra) || Number(emp.salary_hra);
        const newSpecial = Number(specialAllowance) || Number(emp.salary_special_allowance);
        const newConveyance = Number(conveyance) || Number(emp.salary_conveyance);
        const newPf = Number(pfDeduction) || Number(emp.salary_pf_deduction);
        const newTax = Number(taxDeduction) || Number(emp.salary_tax_deduction);
        // salary_gross and salary_net are GENERATED columns — just update the input columns
        await db_1.pool.query(`UPDATE employees SET
        salary_basic = $1, salary_hra = $2, salary_special_allowance = $3,
        salary_conveyance = $4, salary_pf_deduction = $5, salary_tax_deduction = $6
       WHERE employee_id = $7`, [newBasic, newHra, newSpecial, newConveyance, newPf, newTax, emp.employee_id]);
        const updated = await db_1.pool.query('SELECT * FROM employees WHERE employee_id = $1', [emp.employee_id]);
        const mapped = (0, db_1.mapEmployee)(updated.rows[0]);
        return res.json({ message: 'Salary structure updated successfully', salaryStructure: mapped.salaryStructure });
    }
    catch (err) {
        console.error('Update salary error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
});
// ADMIN: GENERATE MONTHLY PAYSLIPS
router.post('/generate', auth_1.authenticateToken, (0, auth_1.requireRole)('Admin'), async (req, res) => {
    const { month, monthCode } = req.body;
    if (!month || !monthCode) {
        return res.status(400).json({ message: 'Month label and month code are required' });
    }
    try {
        // Insert payslips for all employees who don't already have one for this month
        const result = await db_1.pool.query(`INSERT INTO payslips (employee_id, month, month_code, paid_days,
        salary_basic, salary_hra, salary_special_allowance, salary_conveyance,
        salary_pf_deduction, salary_tax_deduction, salary_gross, salary_net, status)
       SELECT e.employee_id, $1, $2, 22,
        e.salary_basic, e.salary_hra, e.salary_special_allowance, e.salary_conveyance,
        e.salary_pf_deduction, e.salary_tax_deduction, e.salary_gross, e.salary_net, 'Paid'
       FROM employees e
       WHERE NOT EXISTS (
         SELECT 1 FROM payslips p WHERE p.employee_id = e.employee_id AND p.month_code = $2
       )`, [month, monthCode]);
        return res.json({
            message: `Payslips generated for ${result.rowCount} employees for ${month}`,
            count: result.rowCount,
        });
    }
    catch (err) {
        console.error('Generate payslips error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
});
exports.default = router;
