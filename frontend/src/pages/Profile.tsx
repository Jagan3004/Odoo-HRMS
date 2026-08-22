import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../api/client';
import { UserCheck, Mail, Phone, Building, Briefcase, Calendar, MapPin, Save, Key, Shield, CreditCard, Camera, FileText, Upload, Trash2, Download } from 'lucide-react';

const API_BASE = 'http://localhost:5000';

interface Doc {
  id: string;
  name: string;
  type: string;
  url: string;
  uploadDate: string;
}

export const Profile: React.FC = () => {
  const { user, employee, token, refreshProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [phone, setPhone] = useState(employee?.phone || '');
  const [address, setAddress] = useState(employee?.address || '');
  const [saving, setSaving] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState<string | null>(null);

  // Avatar
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);

  // Documents
  const [documents, setDocuments] = useState<Doc[]>([]);
  const [docUploading, setDocUploading] = useState(false);
  const [docName, setDocName] = useState('');
  const [docType, setDocType] = useState('ID Proof');
  const docInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const res = await apiRequest<Doc[]>('/uploads/documents');
      setDocuments(res);
    } catch (err) { console.error(err); }
  };

  const handleSave = async () => {
    setSaving(true);
    try { await apiRequest(`/employees/${employee?.id}`, 'PUT', { phone, address }); await refreshProfile(); setEditing(false); } catch (err: any) { alert(err.message); }
    finally { setSaving(false); }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault(); setPasswordMsg(null);
    try { await apiRequest('/auth/change-password', 'PUT', { currentPassword, newPassword }); setPasswordMsg('Password updated successfully.'); setCurrentPassword(''); setNewPassword(''); setShowPasswordForm(false); } catch (err: any) { setPasswordMsg(err.message); }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      const res = await fetch(`${API_BASE}/api/uploads/avatar`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.message); }
      await refreshProfile();
    } catch (err: any) { alert(err.message || 'Upload failed'); }
    finally { setAvatarUploading(false); if (fileInputRef.current) fileInputRef.current.value = ''; }
  };

  const handleDocUpload = async () => {
    const file = docInputRef.current?.files?.[0];
    if (!file) return;
    setDocUploading(true);
    try {
      const formData = new FormData();
      formData.append('document', file);
      formData.append('docName', docName || file.name);
      formData.append('docType', docType);
      const res = await fetch(`${API_BASE}/api/uploads/document`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.message); }
      await fetchDocuments();
      setDocName('');
      if (docInputRef.current) docInputRef.current.value = '';
    } catch (err: any) { alert(err.message || 'Upload failed'); }
    finally { setDocUploading(false); }
  };

  const handleDocDelete = async (id: string) => {
    if (!confirm('Delete this document?')) return;
    try { await apiRequest(`/uploads/document/${id}`, 'DELETE'); await fetchDocuments(); } catch (err: any) { alert(err.message); }
  };

  if (!employee) return <div className="flex items-center justify-center min-h-[400px]"><div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-200 border-t-indigo-600" /></div>;

  const sal = employee.salaryStructure;
  const avatarSrc = employee.avatarUrl ? `${API_BASE}${employee.avatarUrl}` : null;

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><UserCheck className="w-6 h-6 text-indigo-600" /> My Profile</h1>
        <p className="text-sm text-gray-500 mt-1">View and update your personal information.</p>
      </div>

      {/* Profile Card */}
      <div className="panel-elevated rounded-xl p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          {/* Avatar */}
          <div className="relative group shrink-0">
            {avatarSrc ? (
              <img src={avatarSrc} alt={employee.name} className="w-16 h-16 rounded-xl object-cover border-2 border-indigo-100" />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-2xl border border-indigo-200">
                {employee.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={avatarUploading}
              className="absolute -bottom-1 -right-1 w-7 h-7 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center justify-center shadow-md transition-all opacity-0 group-hover:opacity-100"
              title="Change photo"
            >
              {avatarUploading ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold text-gray-900">{employee.name}</h2>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${user?.role === 'Admin' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-indigo-50 text-indigo-600 border-indigo-100'}`}>
                {user?.role}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-0.5">{employee.designation} · {employee.department}</p>
            <p className="text-xs text-gray-400 font-mono mt-0.5">{employee.employeeId}</p>
          </div>
          {!editing ? (
            <button onClick={() => { setEditing(true); setPhone(employee.phone); setAddress(employee.address); }}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs rounded-lg transition-all border border-gray-200">
              Edit Profile
            </button>
          ) : (
            <div className="flex items-center space-x-2">
              <button onClick={() => setEditing(false)} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs rounded-lg border border-gray-200">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg shadow-sm flex items-center space-x-1.5 disabled:opacity-50">
                <Save className="w-3.5 h-3.5" /><span>Save</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal Info */}
        <div className="panel-elevated rounded-xl p-6">
          <h3 className="font-semibold text-sm text-gray-900 mb-4 flex items-center gap-2"><Shield className="w-4 h-4 text-indigo-500" /> Personal Information</h3>
          <div className="space-y-4 text-xs">
            <div className="flex items-start gap-3">
              <Mail className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
              <div><p className="text-[10px] text-gray-400 uppercase font-semibold">Email</p><p className="text-sm text-gray-800 mt-0.5">{employee.email}</p></div>
            </div>
            <div className="flex items-start gap-3">
              <Phone className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-[10px] text-gray-400 uppercase font-semibold">Phone</p>
                {editing ? (
                  <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-0.5 w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:border-indigo-400" />
                ) : <p className="text-sm text-gray-800 mt-0.5">{employee.phone || 'Not set'}</p>}
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-[10px] text-gray-400 uppercase font-semibold">Address</p>
                {editing ? (
                  <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className="mt-0.5 w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:border-indigo-400" />
                ) : <p className="text-sm text-gray-800 mt-0.5">{employee.address || 'Not set'}</p>}
              </div>
            </div>
          </div>
        </div>

        {/* Employment Info */}
        <div className="panel-elevated rounded-xl p-6">
          <h3 className="font-semibold text-sm text-gray-900 mb-4 flex items-center gap-2"><Briefcase className="w-4 h-4 text-purple-500" /> Employment Details</h3>
          <div className="space-y-4 text-xs">
            <div className="flex items-start gap-3"><Building className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" /><div><p className="text-[10px] text-gray-400 uppercase font-semibold">Department</p><p className="text-sm text-gray-800 mt-0.5">{employee.department}</p></div></div>
            <div className="flex items-start gap-3"><Briefcase className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" /><div><p className="text-[10px] text-gray-400 uppercase font-semibold">Designation</p><p className="text-sm text-gray-800 mt-0.5">{employee.designation}</p></div></div>
            <div className="flex items-start gap-3"><Calendar className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" /><div><p className="text-[10px] text-gray-400 uppercase font-semibold">Joining Date</p><p className="text-sm text-gray-800 mt-0.5">{employee.joiningDate}</p></div></div>
          </div>
        </div>
      </div>

      {/* Salary Overview */}
      <div className="panel-elevated rounded-xl p-6">
        <h3 className="font-semibold text-sm text-gray-900 mb-4 flex items-center gap-2"><CreditCard className="w-4 h-4 text-green-500" /> Compensation Summary</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Basic', value: sal.basic },
            { label: 'HRA', value: sal.hra },
            { label: 'Gross Pay', value: sal.grossSalary },
            { label: 'Net Pay', value: sal.netSalary },
          ].map((s) => (
            <div key={s.label} className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-xs text-gray-500">{s.label}</p>
              <p className="text-lg font-bold text-gray-900 mt-1 font-mono">₹{s.value.toLocaleString()}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Documents */}
      <div className="panel-elevated rounded-xl p-6">
        <h3 className="font-semibold text-sm text-gray-900 mb-4 flex items-center gap-2"><FileText className="w-4 h-4 text-blue-500" /> Documents</h3>

        {/* Upload Form */}
        <div className="flex flex-wrap items-end gap-3 mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex-1 min-w-[150px]">
            <label className="block text-[10px] text-gray-500 font-semibold mb-1">DOCUMENT NAME</label>
            <input type="text" placeholder="e.g. Aadhar Card" value={docName} onChange={(e) => setDocName(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs text-gray-800 focus:outline-none focus:border-indigo-400" />
          </div>
          <div className="w-32">
            <label className="block text-[10px] text-gray-500 font-semibold mb-1">TYPE</label>
            <select value={docType} onChange={(e) => setDocType(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs text-gray-800 focus:outline-none focus:border-indigo-400">
              <option>ID Proof</option>
              <option>Address Proof</option>
              <option>Offer Letter</option>
              <option>Resume</option>
              <option>Certificate</option>
              <option>Other</option>
            </select>
          </div>
          <div>
            <input ref={docInputRef} type="file" className="hidden" onChange={() => {}} />
            <button onClick={() => docInputRef.current?.click()}
              className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs text-gray-600 hover:bg-gray-100 transition-colors flex items-center gap-1.5">
              <Upload className="w-3.5 h-3.5" /> Choose File
            </button>
          </div>
          <button onClick={handleDocUpload} disabled={docUploading}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg shadow-sm flex items-center gap-1.5 disabled:opacity-50">
            {docUploading ? 'Uploading...' : <><Upload className="w-3.5 h-3.5" /> Upload</>}
          </button>
        </div>

        {/* Document List */}
        {documents.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-6">No documents uploaded yet.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {documents.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center border border-blue-100">
                    <FileText className="w-4 h-4 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{doc.name}</p>
                    <p className="text-[10px] text-gray-400">{doc.type} · Uploaded {doc.uploadDate}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <a href={`${API_BASE}${doc.url}`} target="_blank" rel="noopener noreferrer"
                    className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors" title="Download">
                    <Download className="w-4 h-4" />
                  </a>
                  <button onClick={() => handleDocDelete(doc.id)}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors" title="Delete">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Change Password */}
      <div className="panel-elevated rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-sm text-gray-900 flex items-center gap-2"><Key className="w-4 h-4 text-amber-500" /> Security</h3>
          {!showPasswordForm && (
            <button onClick={() => setShowPasswordForm(true)} className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded-lg border border-gray-200 transition-colors">
              Change Password
            </button>
          )}
        </div>
        {passwordMsg && <div className={`mb-3 p-3 rounded-lg text-xs font-medium ${passwordMsg.includes('success') ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>{passwordMsg}</div>}
        {showPasswordForm && (
          <form onSubmit={handlePasswordChange} className="space-y-3 text-xs max-w-sm">
            <div><label className="block text-gray-600 font-medium mb-1">Current Password</label><input type="password" required value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-800 focus:outline-none focus:border-indigo-400" /></div>
            <div><label className="block text-gray-600 font-medium mb-1">New Password</label><input type="password" required minLength={4} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-800 focus:outline-none focus:border-indigo-400" /></div>
            <div className="flex items-center space-x-2 pt-1">
              <button type="button" onClick={() => setShowPasswordForm(false)} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-sm">Update Password</button>
            </div>
          </form>
        )}
        {!showPasswordForm && !passwordMsg && <p className="text-xs text-gray-400">Manage your account security settings.</p>}
      </div>
    </div>
  );
};
