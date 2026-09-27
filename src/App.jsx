import Layout from "./components/Layout";
import Home from "./pages/Home";
import About from "./pages/About";
import Projects from "./pages/Projects";
import Now from "./pages/Now";
import Notes from "./pages/Notes";
import Anime from "./pages/Anime";
import Music from "./pages/Music";

export default function App() {
  return (
    <Layout>
      <Home />
      <About />
      <Projects />
      <Now />
      <Notes />
      <Anime />
      <Music />
    </Layout>
  );
}
