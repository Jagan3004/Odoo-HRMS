import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../api/client';
import {
  UserCheck, Mail, Phone, Building, Briefcase, Calendar, MapPin,
  Save, Key, Shield, CreditCard, User, AlertCircle, CheckCircle2,
  Edit3, X, Lock, Fingerprint
} from 'lucide-react';

export const Profile: React.FC = () => {
  const { user, employee, refreshProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form states for all fields
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    emergencyContact: '',
    department: '',
    designation: '',
    managerName: '',
    joiningDate: '',
    basic: 0,
    hra: 0,
    specialAllowance: 0,
    conveyance: 0,
    pfDeduction: 0,
    taxDeduction: 0,
  });

  // Password update form
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const initFormData = () => {
    if (employee) {
      setFormData({
        name: employee.name || '',
        email: employee.email || '',
        phone: employee.phone || '',
        address: employee.address || '',
        emergencyContact: employee.emergencyContact || '',
        department: employee.department || '',
        designation: employee.designation || '',
        managerName: employee.managerName || '',
        joiningDate: employee.joiningDate || '',
        basic: employee.salaryStructure?.basic || 0,
        hra: employee.salaryStructure?.hra || 0,
        specialAllowance: employee.salaryStructure?.specialAllowance || 0,
        conveyance: employee.salaryStructure?.conveyance || 0,
        pfDeduction: employee.salaryStructure?.pfDeduction || 0,
        taxDeduction: employee.salaryStructure?.taxDeduction || 0,
      });
    }
  };

  useEffect(() => {
    initFormData();
  }, [employee]);

  const handleStartEdit = () => {
    initFormData();
    setEditing(true);
    setSaveSuccess(false);
  };

  const handleCancelEdit = () => {
    initFormData();
    setEditing(false);
  };

  const handleFieldChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);
    try {
      await apiRequest(`/employees/${employee?.id || employee?.employeeId}`, 'PUT', {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        emergencyContact: formData.emergencyContact,
        department: formData.department,
        designation: formData.designation,
        managerName: formData.managerName,
        joiningDate: formData.joiningDate,
        salaryStructure: {
          basic: Number(formData.basic) || 0,
          hra: Number(formData.hra) || 0,
          specialAllowance: Number(formData.specialAllowance) || 0,
          conveyance: Number(formData.conveyance) || 0,
          pfDeduction: Number(formData.pfDeduction) || 0,
          taxDeduction: Number(formData.taxDeduction) || 0,
        },
      });

      await refreshProfile();
      setEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);
    try {
      await apiRequest('/auth/change-password', 'PUT', { currentPassword, newPassword });
      setPasswordMsg({ type: 'success', text: 'Password updated successfully!' });
      setCurrentPassword('');
      setNewPassword('');
      setTimeout(() => {
        setShowPasswordForm(false);
        setPasswordMsg(null);
      }, 2500);
    } catch (err: any) {
      setPasswordMsg({ type: 'error', text: err.message || 'Failed to update password' });
    }
  };

  if (!employee) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-200 border-t-indigo-600" />
      </div>
    );
  }

  const sal = employee.salaryStructure || {
    basic: 0, hra: 0, specialAllowance: 0, conveyance: 0,
    grossSalary: 0, pfDeduction: 0, taxDeduction: 0, netSalary: 0
  };

  const computedGross = Number(formData.basic || 0) + Number(formData.hra || 0) + Number(formData.specialAllowance || 0) + Number(formData.conveyance || 0);
  const computedDeductions = Number(formData.pfDeduction || 0) + Number(formData.taxDeduction || 0);
  const computedNet = computedGross - computedDeductions;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-indigo-600" /> Employee Profile
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {editing ? 'Editing your personal, employment, and compensation details.' : 'View and manage all employee records and settings.'}
          </p>
        </div>

        {!editing ? (
          <button
            onClick={handleStartEdit}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center space-x-2 transition-all"
            style={{ background: 'linear-gradient(135deg, #3d1a47 0%, #7b3a8a 50%, #F4A261 100%)' }}>
            <Edit3 className="w-4 h-4" />
            <span>Edit Information</span>
          </button>
        ) : (
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleCancelEdit}
              disabled={saving}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs rounded-xl border border-gray-200 flex items-center space-x-1.5 transition-all">
              <X className="w-3.5 h-3.5" />
              <span>Cancel</span>
            </button>
            <button
              type="button"
              onClick={() => handleSave()}
              disabled={saving}
              className="px-5 py-2 text-white font-bold text-xs rounded-xl shadow-sm flex items-center space-x-1.5 disabled:opacity-50 transition-all"
              style={{ background: 'linear-gradient(135deg, #3d1a47 0%, #7b3a8a 50%, #F4A261 100%)' }}>
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Success Notification */}
      {saveSuccess && (
        <div className="p-4 rounded-xl flex items-center space-x-3 text-xs font-semibold"
          style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d' }}>
          <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
          <span>Profile information successfully updated and synchronized!</span>
        </div>
      )}

      {/* Profile Overview Card */}
      <div className="panel-elevated rounded-xl p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div className="w-16 h-16 rounded-xl flex items-center justify-center font-bold text-2xl text-white brand-gradient glow-apricot shrink-0 shadow-sm">
            {(editing ? formData.name : employee.name).split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold text-gray-900">
                {editing ? (
                  <span className="text-indigo-600 font-bold">{formData.name || 'New Name'}</span>
                ) : (
                  employee.name
                )}
              </h2>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${user?.role === 'Admin' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-indigo-50 text-indigo-600 border-indigo-100'}`}>
                {user?.role}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-0.5">
              {editing ? formData.designation : employee.designation} · {editing ? formData.department : employee.department}
            </p>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-400 font-mono">
              <Fingerprint className="w-3.5 h-3.5 text-gray-400" />
              <span>{employee.employeeId}</span>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Personal Info Panel */}
          <div className="panel-elevated rounded-xl p-6">
            <h3 className="font-semibold text-sm text-gray-900 mb-4 flex items-center gap-2">
              <Shield className="w-4 h-4 text-indigo-500" /> Personal Information
            </h3>
            <div className="space-y-4 text-xs">
              {/* Full Name */}
              <div>
                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1">Full Name</p>
                {editing ? (
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => handleFieldChange('name', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                ) : (
                  <div className="flex items-center gap-2 text-sm text-gray-800 font-medium">
                    <User className="w-4 h-4 text-gray-400" />
                    <span>{employee.name}</span>
                  </div>
                )}
              </div>

              {/* Email */}
              <div>
                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1">Email Address</p>
                {editing ? (
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => handleFieldChange('email', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                ) : (
                  <div className="flex items-center gap-2 text-sm text-gray-800 font-medium">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span>{employee.email}</span>
                  </div>
                )}
              </div>

              {/* Phone */}
              <div>
                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1">Phone Number</p>
                {editing ? (
                  <input
                    type="text"
                    placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChange={(e) => handleFieldChange('phone', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                ) : (
                  <div className="flex items-center gap-2 text-sm text-gray-800 font-medium">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span>{employee.phone || 'Not provided'}</span>
                  </div>
                )}
              </div>

              {/* Residential Address */}
              <div>
                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1">Residential Address</p>
                {editing ? (
                  <input
                    type="text"
                    placeholder="123 Tech Park Blvd, Block A"
                    value={formData.address}
                    onChange={(e) => handleFieldChange('address', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                ) : (
                  <div className="flex items-center gap-2 text-sm text-gray-800 font-medium">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span>{employee.address || 'Not provided'}</span>
                  </div>
                )}
              </div>

              {/* Emergency Contact */}
              <div>
                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1">Emergency Contact</p>
                {editing ? (
                  <input
                    type="text"
                    placeholder="Parent / Spouse - +91 99887 76655"
                    value={formData.emergencyContact}
                    onChange={(e) => handleFieldChange('emergencyContact', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                ) : (
                  <div className="flex items-center gap-2 text-sm text-gray-800 font-medium">
                    <Shield className="w-4 h-4 text-gray-400" />
                    <span>{employee.emergencyContact || 'Not provided'}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Employment Info Panel */}
          <div className="panel-elevated rounded-xl p-6">
            <h3 className="font-semibold text-sm text-gray-900 mb-4 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-purple-500" /> Employment Details
            </h3>
            <div className="space-y-4 text-xs">
              {/* Employee ID (Disabled / Locked Field) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Employee ID</p>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 border border-gray-200 flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5 text-gray-500" />
                    <span>Non-Editable</span>
                  </span>
                </div>
                {editing ? (
                  <div className="relative">
                    <input
                      type="text"
                      disabled
                      value={employee.employeeId}
                      className="w-full pl-8 pr-3 py-2 bg-gray-100/90 border border-gray-300 rounded-lg text-sm font-mono text-gray-500 cursor-not-allowed select-none focus:outline-none"
                    />
                    <Lock className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm font-mono text-gray-700 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                    <Fingerprint className="w-4 h-4 text-gray-400" />
                    <span>{employee.employeeId}</span>
                  </div>
                )}
              </div>

              {/* Department */}
              <div>
                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1">Department</p>
                {editing ? (
                  <input
                    type="text"
                    required
                    value={formData.department}
                    onChange={(e) => handleFieldChange('department', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                ) : (
                  <div className="flex items-center gap-2 text-sm text-gray-800 font-medium">
                    <Building className="w-4 h-4 text-gray-400" />
                    <span>{employee.department}</span>
                  </div>
                )}
              </div>

              {/* Designation */}
              <div>
                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1">Designation</p>
                {editing ? (
                  <input
                    type="text"
                    required
                    value={formData.designation}
                    onChange={(e) => handleFieldChange('designation', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                ) : (
                  <div className="flex items-center gap-2 text-sm text-gray-800 font-medium">
                    <Briefcase className="w-4 h-4 text-gray-400" />
                    <span>{employee.designation}</span>
                  </div>
                )}
              </div>

              {/* Reporting Manager */}
              <div>
                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1">Reporting Manager</p>
                {editing ? (
                  <input
                    type="text"
                    placeholder="Manager Name"
                    value={formData.managerName}
                    onChange={(e) => handleFieldChange('managerName', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                ) : (
                  <div className="flex items-center gap-2 text-sm text-gray-800 font-medium">
                    <User className="w-4 h-4 text-gray-400" />
                    <span>{employee.managerName || 'Sarah Jenkins'}</span>
                  </div>
                )}
              </div>

              {/* Joining Date */}
              <div>
                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1">Joining Date</p>
                {editing ? (
                  <input
                    type="date"
                    value={formData.joiningDate}
                    onChange={(e) => handleFieldChange('joiningDate', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                ) : (
                  <div className="flex items-center gap-2 text-sm text-gray-800 font-medium">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span>{employee.joiningDate}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Compensation & Salary Structure */}
        <div className="panel-elevated rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm text-gray-900 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-green-500" /> Compensation & Salary Structure
            </h3>
            {editing && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 uppercase tracking-wider">
                Live Calculator
              </span>
            )}
          </div>

          {!editing ? (
            /* View Mode */
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Basic Salary', value: sal.basic },
                { label: 'HRA Allowance', value: sal.hra },
                { label: 'Special Allowance', value: sal.specialAllowance },
                { label: 'Conveyance', value: sal.conveyance },
                { label: 'PF Deduction', value: sal.pfDeduction, isDeduction: true },
                { label: 'Tax Deduction', value: sal.taxDeduction, isDeduction: true },
                { label: 'Gross Pay', value: sal.grossSalary, isHighlight: true },
                { label: 'Net Monthly Pay', value: sal.netSalary, isHighlight: true },
              ].map((s) => (
                <div
                  key={s.label}
                  className={`p-3.5 rounded-lg border ${
                    s.isHighlight
                      ? 'bg-indigo-50/50 border-indigo-100 text-indigo-900'
                      : s.isDeduction
                      ? 'bg-red-50/30 border-red-100 text-red-900'
                      : 'bg-gray-50 border-gray-200 text-gray-900'
                  }`}>
                  <p className="text-[11px] text-gray-500 font-medium">{s.label}</p>
                  <p className="text-base font-bold mt-1 font-mono">₹{s.value?.toLocaleString() || 0}</p>
                </div>
              ))}
            </div>
          ) : (
            /* Edit Mode */
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Basic Salary (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.basic}
                    onChange={(e) => handleFieldChange('basic', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-mono text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">HRA Allowance (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.hra}
                    onChange={(e) => handleFieldChange('hra', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-mono text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Special Allowance (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.specialAllowance}
                    onChange={(e) => handleFieldChange('specialAllowance', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-mono text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Conveyance (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.conveyance}
                    onChange={(e) => handleFieldChange('conveyance', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-mono text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-red-600 uppercase mb-1">PF Deduction (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.pfDeduction}
                    onChange={(e) => handleFieldChange('pfDeduction', e.target.value)}
                    className="w-full px-3 py-2 bg-red-50/40 border border-red-200 rounded-lg text-sm font-mono text-red-900 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-red-600 uppercase mb-1">Tax / TDS (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.taxDeduction}
                    onChange={(e) => handleFieldChange('taxDeduction', e.target.value)}
                    className="w-full px-3 py-2 bg-red-50/40 border border-red-200 rounded-lg text-sm font-mono text-red-900 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                  />
                </div>
              </div>

              {/* Calculated preview */}
              <div className="p-4 bg-indigo-50/60 rounded-xl border border-indigo-100 flex items-center justify-between flex-wrap gap-4">
                <div>
                  <p className="text-xs text-indigo-700 font-semibold">Calculated Gross Salary</p>
                  <p className="text-lg font-bold font-mono text-indigo-950">₹{computedGross.toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-indigo-700 font-semibold">Calculated Net Take-Home</p>
                  <p className="text-xl font-extrabold font-mono text-indigo-600">₹{computedNet.toLocaleString()}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action buttons at bottom if editing */}
        {editing && (
          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={handleCancelEdit}
              disabled={saving}
              className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs rounded-xl border border-gray-200 transition-all">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 text-white font-bold text-xs rounded-xl shadow-md flex items-center space-x-2 disabled:opacity-50 transition-all"
              style={{ background: 'linear-gradient(135deg, #3d1a47 0%, #7b3a8a 50%, #F4A261 100%)' }}>
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving Changes...' : 'Save All Information'}</span>
            </button>
          </div>
        )}
      </form>

      {/* Change Password & Security */}
      <div className="panel-elevated rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-sm text-gray-900 flex items-center gap-2">
            <Key className="w-4 h-4 text-amber-500" /> Security & Access Credentials
          </h3>
          {!showPasswordForm && (
            <button
              onClick={() => setShowPasswordForm(true)}
              className="px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg border border-gray-200 transition-colors">
              Change Password
            </button>
          )}
        </div>

        {passwordMsg && (
          <div
            className={`mb-4 p-3.5 rounded-xl text-xs font-semibold flex items-center space-x-2 ${
              passwordMsg.type === 'success'
                ? 'bg-green-50 border border-green-200 text-green-700'
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}>
            {passwordMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <span>{passwordMsg.text}</span>
          </div>
        )}

        {showPasswordForm && (
          <form onSubmit={handlePasswordChange} className="space-y-3.5 text-xs max-w-sm">
            <div>
              <label className="block text-gray-700 font-semibold mb-1">Current Password</label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-800 focus:outline-none focus:border-indigo-400 transition-all"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-semibold mb-1">New Password</label>
              <input
                type="password"
                required
                minLength={4}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-800 focus:outline-none focus:border-indigo-400 transition-all"
              />
            </div>
            <div className="flex items-center space-x-2 pt-1">
              <button
                type="button"
                onClick={() => setShowPasswordForm(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg font-semibold">
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-white font-bold rounded-lg shadow-sm"
                style={{ background: 'linear-gradient(135deg, #3d1a47 0%, #7b3a8a 50%, #F4A261 100%)' }}>
                Update Password
              </button>
            </div>
          </form>
        )}

        {!showPasswordForm && !passwordMsg && (
          <p className="text-xs text-gray-400">
            Manage your login password and account credentials.
          </p>
        )}
      </div>
    </div>
  );
};
