export default function AdminDashboard() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Dashboard</h2>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        {[
          { label: 'Total Orders', value: '0' },
          { label: 'Total Revenue', value: 'Rp 0' },
          { label: 'Total Customers', value: '0' },
          { label: 'Total Products', value: '0' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-lg border bg-card p-6">
            <p className="text-sm text-muted-foreground">{stat.label}</p>
            <p className="text-2xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-lg border bg-card p-6">
        <h3 className="font-semibold mb-4">Recent Orders</h3>
        <p className="text-sm text-muted-foreground">
          No orders yet. Orders will appear here once customers start placing them.
        </p>
      </div>
    </div>
  );
}
