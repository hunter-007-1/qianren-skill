import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export default async function AdminLoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (user?.isAdmin) {
    redirect("/admin");
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#0A0E1A]">
      {children}
    </div>
  );
}
