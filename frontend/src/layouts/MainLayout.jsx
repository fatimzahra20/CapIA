import Sidebar from "../components/Sidebar";

function MainLayout({
  children,
  page,
  selectedId,
  onNavigate,
  onSelectAnalysis,
  onLogout,
  user,
  lang,
  refreshKey,
}) {
  return (
    <div className="min-h-screen bg-[#212121] text-[#ECECEC]">
      <Sidebar
        page={page}
        selectedId={selectedId}
        onNavigate={onNavigate}
        onSelectAnalysis={onSelectAnalysis}
        onLogout={onLogout}
        user={user}
        lang={lang}
        refreshKey={refreshKey}
      />
      <main className="ml-[260px] min-h-screen">{children}</main>
    </div>
  );
}

export default MainLayout;
