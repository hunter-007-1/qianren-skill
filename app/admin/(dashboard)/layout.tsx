import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/auth";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { Toaster } from "react-hot-toast";

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await getCurrentAdmin();

  if (!admin) {
    redirect("/admin/login");
  }

  return (
    <div className="fixed inset-0 z-50 flex bg-[#0A0E1A] text-white">
      <Toaster position="top-right" />
      <AdminSidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {children}
      </div>
    </div>
  );
}
