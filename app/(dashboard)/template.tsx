// Remounts per navigation so every screen enters with the archive fade.
export default function DashboardTemplate({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <div className="page-fade">{children}</div>;
}
