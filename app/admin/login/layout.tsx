import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/auth";

export default async function AdminLoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await getCurrentAdmin();
  if (admin) {
    redirect("/admin");
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#0A0E1A]">
      {children}
    </div>
  );
}
