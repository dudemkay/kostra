import { redirect } from 'next/navigation';

/**
 * Backward-compatible admin entry point.
 * The actual admin dashboard lives under /app/admin.
 */
export default function AdminPage() {
  redirect('/app/admin');
}
