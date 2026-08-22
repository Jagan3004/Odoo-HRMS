import { Role } from '../types';

export function isAdminRole(role?: Role | null): boolean {
  return role === 'Admin' || role === 'HR';
}
