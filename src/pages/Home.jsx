import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import FormStrip from "../components/FormStrip.jsx";
import Hero3D from "../components/Hero3D.jsx";
import { rankIcon } from "../lib/ranks.js";

export default function Home() {
  const [players, setPlayers] = useState(null);
  const [profiles, setProfiles] = useState({});
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("/api/players")
      .then((r) => r.json())
      .then(setPlayers)
      .catch(() => setError("Impossible de charger la liste des joueurs."));
  }, []);

  // Chargement EN SÉRIE (un joueur après l'autre) : lisse les appels API
  // pour rester loin du rate limit HenrikDev.
  useEffect(() => {
    if (!players) return;
    let cancelled = false;
    (async () => {
      for (const p of players) {
        if (cancelled) return;
        try {
          const r = await fetch(
            `/api/summary/${p.region}/${encodeURIComponent(p.name)}/${encodeURIComponent(p.tag)}`
          );
          if (r.ok) {
            const data = await r.json();
            if (!cancelled) setProfiles((prev) => ({ ...prev, [`${p.name}#${p.tag}`]: data }));
          }
        } catch {
          /* joueur suivant */
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [players]);

  if (error) return <p className="error">{error}</p>;
  if (!players) return <p className="loading">Chargement…</p>;

  return (
    <>
      <div className="hero-wrap">
        <div className="hero-content">
          <div className="hero-eyebrow">Protocole ValoStat — suivi compétitif</div>
          <h1 className="hero-title">
            Le crew.<br />
            <em>Chaque match</em> compte.
          </h1>
          <p className="hero-sub">
            Stats compétitives en direct des joueurs suivis par le bot —
            forme, précision, agents, armes et les 20 derniers matchs.
          </p>
        </div>
        <div className="hero-visual">
          <Hero3D />
        </div>
      </div>

      <div className="grid">
        {players.map((p) => {
          const key = `${p.name}#${p.tag}`;
          const prof = profiles[key];
          return (
            <Link
              key={key}
              className="card"
              to={`/joueur/${p.region}/${encodeURIComponent(p.name)}/${encodeURIComponent(p.tag)}`}
            >
              {prof && (
                <img
                  className="card-rank-icon"
                  src={rankIcon(prof.rank.tier)}
                  alt={prof.rank.current}
                  loading="lazy"
                />
              )}
              <div className="player-name glitch">{p.name}</div>
              <div className="player-tag">#{p.tag}</div>

              {prof ? (
                <>
                  <div className="rank-line">
                    <span className="rank">{prof.rank.current}</span>
                    <span className="rr num">{prof.rank.rr} RR</span>
                  </div>
                  <div className="meta">
                    <span>
                      WR <b className="num">{prof.overview.winrate}%</b>
                    </span>
                    <span>
                      KD <b className="num">{prof.overview.kd}</b>
                    </span>
                    <span>
                      ACS <b className="num">{prof.overview.acs}</b>
                    </span>
                  </div>
                  <FormStrip matches={prof.matches} />
                </>
              ) : (
                <div className="meta" style={{ marginTop: 14 }}>Chargement…</div>
              )}
            </Link>
          );
        })}
      </div>
    </>
  );
}
