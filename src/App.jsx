import AdminApp from "./components/AdminApp.jsx";
import PublicSite from "./components/PublicSite.jsx";

export default function App() {
  const isAdmin = window.location.pathname.startsWith("/admin");
  return isAdmin ? <AdminApp /> : <PublicSite />;
}
