import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import FormStrip from "../components/FormStrip.jsx";
import MatchRow from "../components/MatchRow.jsx";
import { rankIcon } from "../lib/ranks.js";
import { topPercent, topTone } from "../lib/percentile.js";

function Tile({ v, k, stat, statValue }) {
  const top = stat ? topPercent(stat, statValue ?? v) : null;
  return (
    <div className="tile">
      <div className="v num">{v}</div>
      <div className="k">{k}</div>
      {top !== null && <div className={`top-pct ${topTone(top)}`}>Top {top}%</div>}
    </div>
  );
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

  if (error) return <p className="error">{error} <Link to="/">← Retour</Link></p>;
  if (!p) return <p className="loading">Chargement du profil…</p>;

  const o = p.overview;

  return (
    <>
      {/* ---- En-tête : identité + Current / Peak Rating ---- */}
      <div className="pf-head">
        <div className="pf-id">
          <h1>{p.name} <span className="tag">#{p.tag}</span></h1>
          <FormStrip matches={p.matches} />
          {p.level != null && <div className="pf-level">Niveau {p.level}</div>}
        </div>

        <div className="rating-cards">
          <div className="rating-card current">
            <div className="rc-label">Current Rating</div>
            <div className="rc-body">
              <img src={rankIcon(p.rank.tier)} alt={p.rank.current} />
              <div>
                <div className="rc-rank">{p.rank.current}</div>
                <div className="rc-rr num">{p.rank.rr} RR</div>
              </div>
            </div>
          </div>
          {p.rank.peak && (
            <div className="rating-card peak">
              <div className="rc-label">Peak Rating</div>
              <div className="rc-body">
                <img src={rankIcon(tierFromName(p.rank.peak))} alt={p.rank.peak} />
                <div>
                  <div className="rc-rank">{p.rank.peak}</div>
                  {p.rank.peakSeason && <div className="rc-rr">{p.rank.peakSeason}</div>}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ---- HISTORIQUE : pièce maîtresse ---- */}
      <div className="section section-hero">
        <h2>Historique — {o.matches} derniers matchs</h2>
        <div className="mrow-list">
          {p.matches.map((m) => (
            <MatchRow key={m.id || m.date} m={m} />
          ))}
        </div>
      </div>

      {/* ---- Stats secondaires ---- */}
      <div className="section">
        <h2>Vue d'ensemble</h2>
        <div className="tiles">
          <Tile v={`${o.winrate}%`} k={`Win rate (${o.wins}V – ${o.losses}D)`} stat="winrate" statValue={o.winrate} />
          <Tile v={o.kd} k="KD" stat="kd" statValue={o.kd} />
          <Tile v={o.kad} k="KAD" stat="kad" statValue={o.kad} />
          <Tile v={o.acs} k="ACS moyen" stat="acs" statValue={o.acs} />
          <Tile v={`${o.hs}%`} k="Headshot %" stat="hs" statValue={o.hs} />
          <Tile v={o.kills} k="Kills" stat="killsPerMatch" statValue={o.matches ? o.kills / o.matches : null} />
          <Tile v={o.deaths} k="Morts" stat="deathsPerMatch" statValue={o.matches ? o.deaths / o.matches : null} />
          <Tile v={o.assists} k="Assists" stat="assistsPerMatch" statValue={o.matches ? o.assists / o.matches : null} />
          <Tile v={o.killsPerRound} k="Kills / round" stat="killsPerRound" statValue={o.killsPerRound} />
          <Tile v={o.firstBloods} k="First bloods (10 m.)" stat="fbPerMatch" statValue={o.firstBloods / 10} />
        </div>
        <p className="pct-note">Les « Top % » et le HS% sont des estimations calées sur les distributions communautaires. « HS % » et « Headshot % » proviennent des 10 derniers matchs détaillés.</p>
      </div>

      <div className="two-col">
        {/* Rôles */}
        <div className="section">
          <h2>Rôles</h2>
          {p.roles.map((r) => (
            <div className="role-row" key={r.role}>
              <div>
                <div className="r-name">{r.role}</div>
                <div className="r-wr">WR <b className="num">{r.winrate}%</b> · {r.wins}V – {r.losses}D</div>
              </div>
              <div className="r-kda">
                <b className="num">KDA {r.kda}</b>
                <div className="num">{r.k} / {r.d} / {r.a}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Top armes avec HS% (share des kills) */}
        <div className="section">
          <h2>Top armes — 10 derniers matchs</h2>
          {p.topWeapons.length === 0 ? (
            <p style={{ color: "var(--muted)" }}>Données d'armes indisponibles.</p>
          ) : (
            <table>
              <thead><tr><th>Arme</th><th>Part</th><th style={{ textAlign: "right" }}>Kills</th></tr></thead>
              <tbody>
                {p.topWeapons.map((w) => (
                  <tr key={w.weapon}>
                    <td style={{ fontWeight: 600 }}>{w.weapon}</td>
                    <td className="num" style={{ color: "var(--muted)" }}>{w.share}%</td>
                    <td className="num" style={{ textAlign: "right", fontWeight: 600 }}>{w.kills}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="two-col">
        {/* Top maps */}
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

        {/* Top agents */}
        <div className="section">
          <h2>Top agents</h2>
          <table>
            <thead><tr><th>Agent</th><th>Matchs</th><th>WR</th><th>KD</th><th style={{ textAlign: "right" }}>ACS</th></tr></thead>
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
      </div>
    </>
  );
}

// Retrouve un numéro de palier approximatif depuis un nom de rang (pour le Peak)
function tierFromName(name = "") {
  const n = name.toLowerCase();
  const map = [
    ["radiant", 27], ["immortal 3", 26], ["immortal 2", 25], ["immortal 1", 24], ["immortal", 24],
    ["ascendant 3", 23], ["ascendant 2", 22], ["ascendant 1", 21], ["ascendant", 21],
    ["diamond 3", 20], ["diamond 2", 19], ["diamond 1", 18], ["diamond", 18],
    ["platinum 3", 17], ["platinum 2", 16], ["platinum 1", 15], ["platinum", 15],
    ["gold 3", 14], ["gold 2", 13], ["gold 1", 12], ["gold", 12],
    ["silver 3", 11], ["silver 2", 10], ["silver 1", 9], ["silver", 9],
    ["bronze 3", 8], ["bronze 2", 7], ["bronze 1", 6], ["bronze", 6],
    ["iron 3", 5], ["iron 2", 4], ["iron 1", 3], ["iron", 3],
  ];
  for (const [k, v] of map) if (n.includes(k)) return v;
  return 0;
}
