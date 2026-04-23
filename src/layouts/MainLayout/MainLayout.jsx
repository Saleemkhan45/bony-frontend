function MainLayout({ header, children }) {
  return (
    <div className="relative min-h-screen overflow-x-clip bg-mist">
      <div className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_top_left,rgba(194,223,255,0.26),transparent_34%),linear-gradient(180deg,#fbfaff_0%,#ffffff_62%)]" />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(105,92,251,0.08),transparent_30%),radial-gradient(circle_at_80%_18%,rgba(58,214,252,0.12),transparent_16%)]" />

      <header className="relative z-20">{header}</header>
      <main className="relative z-10">{children}</main>
    </div>
  );
}

export default MainLayout;
