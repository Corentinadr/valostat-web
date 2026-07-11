import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import FormStrip from "../components/FormStrip.jsx";
import { rankIcon } from "../lib/ranks.js";

function fmtDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

export default function Player() {
  const { region, name, tag } = useParams();
  const [p, setP] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    setP(null);
    fetch(`/api/player/${region}/${encodeURIComponent(name)}/${encodeURIComponent(tag)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setP)
      .catch(() => setError("Impossible de charger ce profil."));
  }, [region, name, tag]);

  if (error)
    return (
      <p className="error">
        {error} <Link to="/">← Retour</Link>
      </p>
    );
  if (!p) return <p className="loading">Chargement du profil…</p>;

  const o = p.overview;

  return (
    <>
      <div className="profile-head">
        <div>
          <h1>
            {p.name} <span className="tag">#{p.tag}</span>
          </h1>
          <FormStrip matches={p.matches} />
        </div>
        <div className="rank-block">
          <img className="rank-icon" src={rankIcon(p.rank.tier)} alt={p.rank.current} />
          <div>
            <div className="current">
              {p.rank.current} · <span className="num">{p.rank.rr} RR</span>
            </div>
            {p.rank.peak && (
              <div className="peak">
                Peak {p.rank.peak}
                {p.rank.peakSeason ? ` (${p.rank.peakSeason})` : ""}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ---- Stats de base ---- */}
      <div className="section">
        <h2>Vue d'ensemble — {o.matches} derniers matchs</h2>
        <div className="tiles">
          <div className="tile"><div className="v num">{o.winrate}%</div><div className="k">Win rate ({o.wins}V – {o.losses}D)</div></div>
          <div className="tile"><div className="v num">{o.kd}</div><div className="k">KD</div></div>
          <div className="tile"><div className="v num">{o.kad}</div><div className="k">KAD</div></div>
          <div className="tile"><div className="v num">{o.acs}</div><div className="k">ACS moyen</div></div>
          <div className="tile"><div className="v num">{o.kills}</div><div className="k">Kills</div></div>
          <div className="tile"><div className="v num">{o.deaths}</div><div className="k">Morts</div></div>
          <div className="tile"><div className="v num">{o.assists}</div><div className="k">Assists</div></div>
          <div className="tile"><div className="v num">{o.killsPerRound}</div><div className="k">Kills / round</div></div>
          <div className="tile"><div className="v num">{o.firstBloods}</div><div className="k">First bloods (10 matchs)</div></div>
        </div>
      </div>

      <div className="two-col">
        {/* ---- Accuracy ---- */}
        <div className="section">
          <h2>Précision</h2>
          {[
            { lbl: "Tête", pct: p.accuracy.head, hits: p.accuracy.headHits },
            { lbl: "Corps", pct: p.accuracy.body, hits: p.accuracy.bodyHits },
            { lbl: "Jambes", pct: p.accuracy.leg, hits: p.accuracy.legHits },
          ].map((r) => (
            <div className="acc-row" key={r.lbl}>
              <span className="lbl">{r.lbl}</span>
              <span className="bar"><i style={{ width: `${r.pct}%` }} /></span>
              <span className="val num"><b>{r.pct}%</b> · {r.hits} hits</span>
            </div>
          ))}
        </div>

        {/* ---- Rôles ---- */}
        <div className="section">
          <h2>Rôles</h2>
          {p.roles.map((r) => (
            <div className="role-row" key={r.role}>
              <div>
                <div className="r-name">{r.role}</div>
                <div className="r-wr">
                  WR <b className="num">{r.winrate}%</b> · {r.wins}V – {r.losses}D
                </div>
              </div>
              <div className="r-kda">
                <b className="num">KDA {r.kda}</b>
                <div className="num">{r.k} / {r.d} / {r.a}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="two-col">
        {/* ---- Top armes ---- */}
        <div className="section">
          <h2>Top armes — 10 derniers matchs</h2>
          {p.topWeapons.length === 0 ? (
            <p style={{ color: "var(--muted)" }}>Données d'armes indisponibles.</p>
          ) : (
            <table>
              <thead><tr><th>Arme</th><th style={{ textAlign: "right" }}>Kills</th></tr></thead>
              <tbody>
                {p.topWeapons.map((w) => (
                  <tr key={w.weapon}>
                    <td>{w.weapon}</td>
                    <td className="num" style={{ textAlign: "right", fontWeight: 600 }}>{w.kills}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* ---- Top maps ---- */}
        <div className="section">
          <h2>Top maps</h2>
          <table>
            <thead><tr><th>Map</th><th>Bilan</th><th style={{ textAlign: "right" }}>Win %</th></tr></thead>
            <tbody>
              {p.topMaps.map((m) => (
                <tr key={m.map}>
                  <td style={{ fontWeight: 600 }}>{m.map}</td>
                  <td className="num" style={{ color: "var(--muted)" }}>{m.wins}V – {m.losses}D</td>
                  <td className="num" style={{ textAlign: "right", fontWeight: 600 }}>{m.winrate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ---- Top agents ---- */}
      <div className="section">
        <h2>Top agents</h2>
        <table>
          <thead>
            <tr><th>Agent</th><th>Matchs</th><th>Win %</th><th>KD</th><th style={{ textAlign: "right" }}>ACS</th></tr>
          </thead>
          <tbody>
            {p.topAgents.map((a) => (
              <tr key={a.agent}>
                <td style={{ fontWeight: 600 }}>{a.agent}</td>
                <td className="num">{a.matches}</td>
                <td className="num">{a.winrate}%</td>
                <td className="num">{a.kd}</td>
                <td className="num" style={{ textAlign: "right" }}>{a.acs}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ---- Historique ---- */}
      <div className="section">
        <h2>20 derniers matchs</h2>
        {p.matches.map((m) => (
          <div className="match-row" key={m.id || m.date}>
            <span className={`edge ${m.win ? "w" : "l"}`} />
            <span className="m-sub num">{fmtDate(m.date)}</span>
            <span>
              <span className="m-map">{m.map}</span>{" "}
              <span className="m-agent">· {m.agent}</span>
              {m.isMvp && <span className="mvp-chip">MVP</span>}
              {m.isMvp === false && m.mvpName && (
                <span className="m-agent"> · MVP : {m.mvpName}</span>
              )}
            </span>
            <span className={`m-score num ${m.win ? "w" : "l"}`}>{m.score}</span>
            <span className="num hide-sm">{m.kills} / {m.deaths} / {m.assists}</span>
            <span className="m-sub num hide-sm">KD {m.kd}</span>
            <span className="m-sub num hide-sm">ACS {m.acs}</span>
          </div>
        ))}
      </div>
    </>
  );
}
