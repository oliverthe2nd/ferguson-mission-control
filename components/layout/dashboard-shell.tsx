import { Sidebar, TopBar } from "./app-shell";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen overflow-hidden">
      <div className="pointer-events-none fixed -left-28 top-16 h-80 w-80 rounded-full bg-emerald-300/25 blur-3xl" />
      <div className="pointer-events-none fixed right-[-8rem] top-56 h-96 w-96 rounded-full bg-orange-200/25 blur-3xl" />
      <div className="pointer-events-none fixed bottom-[-10rem] left-1/3 h-96 w-96 rounded-full bg-slate-300/25 blur-3xl" />

      <Sidebar />
      <div className="relative flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main className="relative flex-1 space-y-8 px-5 py-8 sm:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
