import { useState } from "react";
import Nav from "./Nav";
import Footer from "./Footer";
import Cursor from "./Cursor";
import Void from "../pages/Void";

export default function Layout({ children }) {
  const [voidOpen, setVoidOpen] = useState(false);

  return (
    <div style={{ cursor: "inherit", display: "flex", flexDirection: "column", minHeight: "100svh" }}>
      <Cursor />
      <div className="boot" aria-hidden="true" />
      <div className="bg-fx" aria-hidden="true">
        <div className="noise" />
        <div className="glow" />
      </div>
      <Nav onSecret={() => setVoidOpen(true)} />
      <main>{children}</main>
      <Footer />
      {voidOpen && <Void onClose={() => setVoidOpen(false)} />}
    </div>
  );
}
