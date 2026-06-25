import AdminShell from "@/components/admin/AdminShell";
import { ToastProvider } from "@/components/admin/ui";

export const metadata = { title: "Admin — RefurbishedKart", robots: { index: false, follow: false } };

export default function AdminLayout({ children }) {
  return (
    <ToastProvider>
      <AdminShell>{children}</AdminShell>
    </ToastProvider>
  );
}
