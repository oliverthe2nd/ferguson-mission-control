import { SignIn } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { isClerkConfigured } from "@/lib/clerk-config";

export default function SignInPage() {
  if (!isClerkConfigured()) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <SignIn />
    </div>
  );
}
