import type { Metadata } from 'next';
import AdminPanel from '@/components/admin/AdminPanel';

export const metadata: Metadata = {
  title: 'Administración | XpertDiagnostic',
};

/**
 * Ruta /admin: panel de administración (ESP-007). Solo administradores: proxy.ts redirige a los demás
 * y el backend exige el rol en cada petición. La vista vive en components/admin/.
 */
export default function AdminPage() {
  return <AdminPanel />;
}
