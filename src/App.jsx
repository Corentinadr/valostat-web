import { Routes, Route, NavLink } from "react-router-dom";
import Home from "./pages/Home.jsx";
import Player from "./pages/Player.jsx";
import Bot from "./pages/Bot.jsx";

export default function App() {
  return (
    <div className="container">
      <nav className="nav">
        <NavLink to="/" className="brand">
          Valo<span>//</span>Stat
        </NavLink>
        <div className="links">
          <span className="live-dot">Live</span>
          <NavLink to="/" end className={({ isActive }) => (isActive ? "active" : "")}>
            Joueurs
          </NavLink>
          <NavLink to="/bot" className={({ isActive }) => (isActive ? "active" : "")}>
            Le bot
          </NavLink>
        </div>
      </nav>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/joueur/:region/:name/:tag" element={<Player />} />
        <Route path="/bot" element={<Bot />} />
      </Routes>

      <footer>ValoStat — projet perso. Données via l'API non officielle HenrikDev. Non affilié à Riot Games.</footer>
    </div>
  );
}
