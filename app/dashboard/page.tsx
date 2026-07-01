export default function DashboardPage() {
  return (
    <div className="p-10">
      <h1 className="text-3xl font-bold">
        Dashboard
      </h1>

      <div className="mt-8 grid grid-cols-4 gap-4">

        <div className="border rounded p-4">
          <h3>Total Agents</h3>
          <p>0</p>
        </div>

        <div className="border rounded p-4">
          <h3>Total Leads</h3>
          <p>0</p>
        </div>

        <div className="border rounded p-4">
          <h3>Total Chats</h3>
          <p>0</p>
        </div>

        <div className="border rounded p-4">
          <h3>Plan</h3>
          <p>Starter</p>
        </div>

      </div>
    </div>
  );
}