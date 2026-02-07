import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "../api/auth/[...nextauth]/route";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  const session = await getServerSession(authOptions);

  // ✅ Only admin allowed
  if (!session || session.user.role !== "admin") {
    redirect("/login");
  }

  return (
    <div>
      {children}
    </div>
  );
}
