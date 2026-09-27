import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import About from "./pages/About";
import Projects from "./pages/Projects";
import Lab from "./pages/Lab";
import Now from "./pages/Now";
import Notes from "./pages/Notes";
import Anime from "./pages/Anime";
import Music from "./pages/Music";
import Guestbook from "./pages/Guestbook";
import Void from "./pages/Void";
import NotFound from "./pages/NotFound";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/lab" element={<Lab />} />
        <Route path="/now" element={<Now />} />
        <Route path="/notes" element={<Notes />} />
        <Route path="/anime" element={<Anime />} />
        <Route path="/music" element={<Music />} />
        <Route path="/guestbook" element={<Guestbook />} />
        <Route path="/void" element={<Void />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
