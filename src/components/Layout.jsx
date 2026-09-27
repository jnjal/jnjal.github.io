import { Outlet, useLocation } from "react-router-dom";
import { useEffect } from "react";
import Nav from "./Nav";
import Footer from "./Footer";
import Cursor from "./Cursor";

export default function Layout() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div style={{ cursor: "inherit", display: "flex", flexDirection: "column", minHeight: "100svh" }}>
      <Cursor />
      <div className="bg-fx" aria-hidden="true">
        <div className="noise" />
        <div className="glow" />
      </div>
      <Nav />
      <Outlet />
      <Footer />
    </div>
  );
}
