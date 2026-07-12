import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import FormStrip from "../components/FormStrip.jsx";
import Hero3D from "../components/Hero3D.jsx";
import { rankIcon } from "../lib/ranks.js";

const playerUrl = (p) =>
  `/joueur/${p.region}/${encodeURIComponent(p.name)}/${encodeURIComponent(p.tag)}`;

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

  // Chargement EN SÉRIE : lisse les appels API sous le rate limit HenrikDev
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
            if (!cancelled)
              setProfiles((prev) => ({ ...prev, [`${p.name}#${p.tag}`]: { ...p, ...data } }));
          }
        } catch { /* joueur suivant */ }
      }
    })();
    return () => { cancelled = true; };
  }, [players]);

  const loaded = Object.values(profiles);

  // Classement : palier (tier) puis RR
  const ranked = useMemo(
    () => [...loaded].sort((a, b) => (b.rank.tier - a.rank.tier) || (b.rank.rr - a.rank.rr)),
    [loaded]
  );
  const podium = ranked.slice(0, 3);
  const rest = ranked.slice(3);

  // Ticker : derniers résultats de chaque joueur, du plus récent au plus ancien
  const ticker = useMemo(
    () =>
      loaded
        .filter((p) => p.last)
        .sort((a, b) => new Date(b.last.date) - new Date(a.last.date)),
    [loaded]
  );

  if (error) return <p className="error">{error}</p>;
  if (!players) return <p className="loading">Chargement…</p>;

  return (
    <>
      {/* Ticker des derniers résultats */}
      {ticker.length > 0 && (
        <div className="ticker" aria-hidden="true">
          <div className="ticker-track">
            {[...ticker, ...ticker].map((p, i) => (
              <span key={i} className={p.last.win ? "t-w" : "t-l"}>
                {p.last.win ? "▲" : "▼"} {p.name} · {p.last.map} {p.last.score} · {p.last.kda}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="hero-wrap">
        <div className="hero-content">
          <div className="hero-eyebrow">Protocole ValoStat — suivi compétitif</div>
          <h1 className="hero-title">
            Le crew.<br />
            <em>Chaque match</em> compte.
          </h1>
          <p className="hero-sub">
            Stats compétitives en direct des joueurs suivis par le bot —
            classement, forme, agents, armes et les 20 derniers matchs.
          </p>
          <div className="hero-readout">
            <span>{players.length} opérateurs suivis</span>
            <span>Région EU</span>
            <span>Sync auto · 10 min</span>
          </div>
        </div>
        <div className="hero-visual">
          <Hero3D />
        </div>
      </div>

      {/* ---- Podium ---- */}
      <div className="section">
        <h2>Classement du crew</h2>
        {podium.length < 3 ? (
          <p className="loading">Calcul du classement… ({loaded.length}/{players.length})</p>
        ) : (
          <>
            <div className="podium">
              {[podium[1], podium[0], podium[2]].map((p, idx) => {
                const place = idx === 1 ? 1 : idx === 0 ? 2 : 3;
                return (
                  <Link key={p.name + p.tag} to={playerUrl(p)} className={`podium-col place-${place}`}>
                    <img className="podium-rank-img" src={rankIcon(p.rank.tier)} alt={p.rank.current} />
                    <div className="podium-name glitch">{p.name}</div>
                    <div className="podium-rankname">{p.rank.current} · <span className="num">{p.rank.rr} RR</span></div>
                    <div className="podium-stats">
                      <span>WR <b className="num">{p.overview.winrate}%</b></span>
                      <span>KD <b className="num">{p.overview.kd}</b></span>
                      <span>ACS <b className="num">{p.overview.acs}</b></span>
                      {p.overview.hs != null && <span>HS <b className="num">{p.overview.hs}%</b></span>}
                    </div>
                    <div className="podium-step">
                      <span className="podium-place num">{place}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
            {rest.length > 0 && (
              <div className="podium-rest">
                {rest.map((p, i) => (
                  <Link key={p.name + p.tag} to={playerUrl(p)} className="rest-row">
                    <span className="rest-place num">{i + 4}</span>
                    <img className="rest-rank-img" src={rankIcon(p.rank.tier)} alt={p.rank.current} />
                    <span className="rest-name">{p.name} <span className="player-tag">#{p.tag}</span></span>
                    <span className="rest-rankname">{p.rank.current} · <span className="num">{p.rank.rr} RR</span></span>
                    <span className="rest-stats">
                      WR <b className="num">{p.overview.winrate}%</b> · KD <b className="num">{p.overview.kd}</b> · ACS <b className="num">{p.overview.acs}</b>{p.overview.hs != null ? <> · HS <b className="num">{p.overview.hs}%</b></> : null}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* ---- Cartes détaillées ---- */}
      <div className="section">
        <h2>Les opérateurs</h2>
        <div className="grid">
          {players.map((p) => {
            const key = `${p.name}#${p.tag}`;
            const prof = profiles[key];
            return (
              <Link key={key} className="card" to={playerUrl(p)}>
                {prof && (
                  <img className="card-rank-icon" src={rankIcon(prof.rank.tier)} alt={prof.rank.current} loading="lazy" />
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
                      <span>WR <b className="num">{prof.overview.winrate}%</b></span>
                      <span>KD <b className="num">{prof.overview.kd}</b></span>
                      <span>ACS <b className="num">{prof.overview.acs}</b></span>
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
      </div>
    </>
  );
}
