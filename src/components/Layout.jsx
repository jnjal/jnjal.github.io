import { Suspense, lazy, useState } from "react";
import Nav from "./Nav";
import Footer from "./Footer";
import Cursor from "./Cursor";

const Archive = lazy(() => import("./Archive"));

export default function Layout({ children }) {
  const [archiveOpen, setArchiveOpen] = useState(false);

  return (
    <div style={{ cursor: "inherit", display: "flex", flexDirection: "column", minHeight: "100svh" }}>
      <Cursor />
      <div className="boot" aria-hidden="true" />
      <div className="bg-fx" aria-hidden="true">
        <div className="noise" />
        <div className="glow" />
      </div>
      <Nav onSecret={() => setArchiveOpen(true)} />
      <main>{children}</main>
      <Footer />
      {archiveOpen && (
        <Suspense fallback={null}>
          <Archive onClose={() => setArchiveOpen(false)} />
        </Suspense>
      )}
    </div>
  );
}
