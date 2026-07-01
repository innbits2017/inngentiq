export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex">

      <aside className="w-64 min-h-screen border-r p-4">
        <h2 className="font-bold">
          Inngentiq
        </h2>

        <nav className="mt-6 flex flex-col gap-4">
          <a href="/dashboard">
            Dashboard
          </a>

          <a href="/dashboard/agents">
            Agents
          </a>

          <a href="/dashboard/leads">
            Leads
          </a>

          <a href="/dashboard/chats">
            Chats
          </a>

          <a href="/dashboard/knowledge-base">
            Knowledge Base
          </a>

          <a href="/dashboard/settings">
            Settings
          </a>
        </nav>
      </aside>

      <main className="flex-1">
        {children}
      </main>

    </div>
  );
}