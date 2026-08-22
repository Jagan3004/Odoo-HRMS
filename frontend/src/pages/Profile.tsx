import React, { useEffect, useState } from 'react';
import { BriefcaseBusiness, CalendarDays, FileText, KeyRound, Mail, MapPin, Pencil, Phone, Save, ShieldCheck, Trash2, Upload, UserRound } from 'lucide-react';
import { apiRequest } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Employee } from '../types';
import { Avatar, SectionCard, StatusBadge } from '../components/UiPrimitives';
import { PageInsights } from '../components/PageInsights';

interface ProfileForm {
  name: string;
  designation: string;
  department: string;
  phone: string;
  address: string;
  emergencyContact: string;
  managerName: string;
}

const emptyForm: ProfileForm = {
  name: '', designation: '', department: '', phone: '', address: '', emergencyContact: '', managerName: '',
};

const formatDate = (value: string) => value ? new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Not provided';
const money = (value: number) => `Rs. ${value.toLocaleString('en-IN')}`;

export const Profile: React.FC = () => {
  const { user, employee, refreshProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<ProfileForm>(emptyForm);
  const [uploading, setUploading] = useState(false);
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '' });
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);

  useEffect(() => {
    if (employee) {
      setForm({
        name: employee.name,
        designation: employee.designation,
        department: employee.department,
        phone: employee.phone || '',
        address: employee.address || '',
        emergencyContact: employee.emergencyContact || '',
        managerName: employee.managerName || '',
      });
    }
  }, [employee]);

  if (!employee) return <div className="surface-card p-8 text-sm text-slate-500">Profile details are not available.</div>;

  const isAdmin = user?.role === 'Admin';
  const updateField = (field: keyof ProfileForm, value: string) => setForm((current) => ({ ...current, [field]: value }));
  const profileCompleteness = [
    employee.email,
    employee.phone,
    employee.address,
    employee.emergencyContact,
    employee.managerName,
    employee.avatarUrl,
    employee.documents.length > 0 ? 'docs' : '',
  ].filter(Boolean).length;
  const profileScore = Math.min(100, Math.round((profileCompleteness / 7) * 100));

  const saveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      await apiRequest<Employee>(`/employees/${employee.employeeId}`, 'PUT', form);
      await refreshProfile();
      setIsEditing(false);
      setMessage('Profile updated successfully.');
    } catch (err: any) {
      setError(err.message || 'Unable to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const uploadAvatar = async (file: File) => {
    setUploading(true); setError(null);
    try { const data = new FormData(); data.append('avatar', file); await apiRequest('/uploads/avatar', 'POST', data); await refreshProfile(); setMessage('Profile picture updated.'); } catch (err: any) { setError(err.message || 'Unable to upload profile picture.'); } finally { setUploading(false); }
  };

  const uploadDocument = async (file: File) => {
    setUploading(true); setError(null);
    try { const data = new FormData(); data.append('document', file); data.append('docName', file.name); data.append('docType', 'HR document'); await apiRequest('/uploads/document', 'POST', data); await refreshProfile(); setMessage('Document uploaded.'); } catch (err: any) { setError(err.message || 'Unable to upload document.'); } finally { setUploading(false); }
  };

  const deleteDocument = async (id: string) => {
    try { await apiRequest(`/uploads/document/${id}`, 'DELETE'); await refreshProfile(); setMessage('Document removed.'); } catch (err: any) { setError(err.message || 'Unable to remove document.'); }
  };

  const changePassword = async (event: React.FormEvent) => {
    event.preventDefault(); setPasswordMessage(null); setError(null);
    try { const response = await apiRequest<{ message: string }>('/auth/change-password', 'PUT', passwords); setPasswordMessage(response.message); setPasswords({ currentPassword: '', newPassword: '' }); } catch (err: any) { setError(err.message || 'Unable to change password.'); }
  };

  const field = (label: string, value: string, key: keyof ProfileForm, editable = true) => (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.1em] text-slate-400">{label}</span>
      {isEditing && editable ? (
        <input value={value} onChange={(event) => updateField(key, event.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10" />
      ) : <span className="block min-h-[20px] text-sm font-semibold text-slate-800">{value || 'Not provided'}</span>}
    </label>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-100 bg-cyan-50 text-cyan-700 shadow-sm">
            <UserRound className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-cyan-700">People / My workspace</p>
            <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-950 sm:text-[38px]">My profile</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-[15px]">
              Keep your employee details current and easy for your HR team to trust.
            </p>
          </div>
        </div>

        {isEditing ? (
          <button
            onClick={() => { setIsEditing(false); setError(null); }}
            className="inline-flex items-center gap-2 self-start rounded-full bg-slate-950 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800"
          >
            Cancel
          </button>
        ) : (
          <button
            onClick={() => { setIsEditing(true); setMessage(null); }}
            className="inline-flex items-center gap-2 self-start rounded-full bg-slate-950 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-cyan-700"
          >
            <Pencil className="h-4 w-4" /> Edit profile
          </button>
        )}
      </div>

      {(message || error) && <div className={`rounded-xl border px-4 py-3 text-sm font-medium ${error ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>{error || message}</div>}

      <PageInsights
        eyebrow="Profile insights"
        title="Your workspace readiness"
        description="A quick check on profile completeness, contact coverage, and document readiness."
        icon={UserRound}
        cards={[
          { label: 'Profile completeness', value: `${profileScore}%`, note: 'Based on contact, avatar, and document coverage', icon: UserRound, tone: 'indigo' },
          { label: 'Uploaded documents', value: String(employee.documents.length), note: 'HR records stored on your profile', icon: FileText, tone: 'cyan' },
          { label: 'Emergency contact', value: employee.emergencyContact ? 'Set' : 'Missing', note: employee.emergencyContact ? 'An alternate contact is available' : 'Add one for safety', icon: Phone, tone: employee.emergencyContact ? 'emerald' : 'amber' },
          { label: 'Account status', value: 'Active', note: 'Your profile is live in the system', icon: ShieldCheck, tone: 'violet' },
        ]}
      />

      <div className="space-y-6">
        <SectionCard className="overflow-hidden">
          <div className="overflow-hidden rounded-2xl border border-cyan-100">
            <div className="bg-gradient-to-r from-cyan-50 via-white to-blue-50 px-5 py-6 sm:px-6 sm:py-8">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex min-w-0 items-center gap-4">
                  <div className="relative">
                    <Avatar name={employee.name} src={employee.avatarUrl} size="lg" />
                    <label className="absolute -bottom-2 -right-2 flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl bg-slate-950 text-white shadow-lg transition hover:bg-cyan-700">
                      <Upload className="h-4 w-4" />
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={uploading}
                        onChange={(event) => event.target.files?.[0] && uploadAvatar(event.target.files[0])}
                      />
                    </label>
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="truncate text-2xl font-black tracking-tight text-slate-950 sm:text-[30px]">{employee.name}</h2>
                      <StatusBadge label={employee.role} tone={isAdmin ? 'warning' : 'brand'} />
                    </div>
                    <p className="mt-2 text-sm text-slate-500 sm:text-[15px]">
                      {employee.designation} <span className="px-2 text-slate-300">/</span> {employee.department}
                    </p>
                    <p className="mt-3 text-sm font-semibold text-slate-400">Employee ID: {employee.employeeId}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start rounded-full border border-emerald-100 bg-white/80 px-4 py-2 text-sm font-bold text-emerald-700 shadow-sm">
                  <ShieldCheck className="h-4 w-4" />
                  Active account
                </div>
              </div>
            </div>

            <div className="grid gap-6 px-5 py-6 sm:grid-cols-2 sm:px-6">
              <div className="space-y-5">
                {field('Email address', employee.email, 'name', false)}
                {field('Phone number', form.phone, 'phone')}
                {field('Address', form.address, 'address')}
              </div>
              <div className="space-y-5">
                {field('Joining date', formatDate(employee.joiningDate), 'name', false)}
                {field('Emergency contact', form.emergencyContact, 'emergencyContact')}
                {field('Manager', form.managerName, 'managerName')}
              </div>
            </div>
          </div>
        </SectionCard>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <SectionCard title="Job information" description={isAdmin ? 'Admin access allows editing organisational details.' : 'These details are managed by your HR administrator.'}>
            <div className="grid gap-5 px-5 py-6 sm:grid-cols-2 sm:px-6">{field('Full name', form.name, 'name', isAdmin)}{field('Designation', form.designation, 'designation', isAdmin)}{field('Department', form.department, 'department', isAdmin)}{field('Reports to', form.managerName, 'managerName', isAdmin)}</div>
          </SectionCard>

          <SectionCard title="Salary overview" description="Payroll information is read-only from your profile.">
            <div className="space-y-4 px-5 py-6 sm:px-6"><div className="flex items-center gap-3"><div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-700"><BriefcaseBusiness className="h-4 w-4" /></div><div><p className="text-xs text-slate-500">Monthly gross salary</p><p className="text-lg font-extrabold text-slate-950">{money(employee.salaryStructure.grossSalary)}</p></div></div><div className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-4"><div><p className="text-[11px] text-slate-400">Basic</p><p className="mt-1 text-sm font-bold text-slate-700">{money(employee.salaryStructure.basic)}</p></div><div><p className="text-[11px] text-slate-400">Net pay</p><p className="mt-1 text-sm font-bold text-slate-700">{money(employee.salaryStructure.netSalary)}</p></div></div></div>
          </SectionCard>
        </div>

        <SectionCard title="Documents & contact" description="Your uploaded HR records and primary contact details.">
          <div className="grid gap-4 px-5 py-6 sm:grid-cols-2 sm:px-6">{employee.documents.length ? employee.documents.map((document) => <div key={document.id} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3"><FileText className="h-5 w-5 text-cyan-700" /><a href={document.url} target="_blank" rel="noreferrer" className="min-w-0 flex-1"><span className="block truncate text-sm font-bold text-slate-800">{document.name}</span><span className="text-[11px] text-slate-400">{document.type} / {formatDate(document.uploadDate)}</span></a><button type="button" onClick={() => deleteDocument(document.id)} className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"><Trash2 className="h-4 w-4" /></button></div>) : <p className="text-sm text-slate-500">No documents uploaded yet.</p>}<label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-cyan-200 bg-cyan-50/50 px-4 py-3 text-xs font-bold text-cyan-800 hover:bg-cyan-50"><Upload className="h-4 w-4" /> Upload document<input type="file" className="hidden" disabled={uploading} onChange={(event) => event.target.files?.[0] && uploadDocument(event.target.files[0])} /></label><div className="grid gap-4 sm:col-span-2 sm:grid-cols-2"><div className="flex items-center gap-3 text-sm text-slate-600"><Mail className="h-4 w-4 text-slate-400" /> {employee.email}</div><div className="flex items-center gap-3 text-sm text-slate-600"><Phone className="h-4 w-4 text-slate-400" /> {employee.phone || 'No phone number'}</div><div className="flex items-center gap-3 text-sm text-slate-600"><MapPin className="h-4 w-4 text-slate-400" /> {employee.address || 'No address'}</div><div className="flex items-center gap-3 text-sm text-slate-600"><CalendarDays className="h-4 w-4 text-slate-400" /> Joined {formatDate(employee.joiningDate)}</div></div></div>
        </SectionCard>

        <SectionCard title="Account security" description="Change your password without leaving Dayflow."><form onSubmit={changePassword} className="grid gap-4 px-5 py-6 sm:grid-cols-3 sm:px-6"><input required type="password" placeholder="Current password" value={passwords.currentPassword} onChange={(event) => setPasswords({ ...passwords, currentPassword: event.target.value })} className="input-field" /><input required minLength={8} type="password" placeholder="New password" value={passwords.newPassword} onChange={(event) => setPasswords({ ...passwords, newPassword: event.target.value })} className="input-field" /><button type="submit" className="primary-button"><KeyRound className="h-3.5 w-3.5" /> Update password</button>{passwordMessage && <p className="text-xs font-semibold text-emerald-700 sm:col-span-3">{passwordMessage}</p>}</form></SectionCard>

        {isEditing && <div className="flex justify-end"><button type="button" onClick={() => saveProfile({ preventDefault: () => {} } as React.FormEvent)} disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-cyan-700 px-5 py-3 text-xs font-bold text-white transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:opacity-60">{saving ? 'Saving...' : <><Save className="h-4 w-4" /> Save changes</>}</button></div>}
      </div>
    </div>
  );
};
