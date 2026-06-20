import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AuthFooter } from "@/components/layout/AuthFooter";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (session?.user?.id) {
    redirect("/dashboard");
  }
  return (
    <div className="flex min-h-screen flex-col bg-zinc-950">
      <div className="flex-1">{children}</div>
      <AuthFooter />
    </div>
  );
}
