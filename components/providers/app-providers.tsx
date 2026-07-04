import { ClerkProvider } from "@clerk/nextjs";
import type { ReactNode } from "react";
import { isClerkConfigured } from "@/lib/clerk-config";

export function AppProviders({ children }: { children: ReactNode }) {
  if (!isClerkConfigured()) {
    return children;
  }

  return <ClerkProvider>{children}</ClerkProvider>;
}
