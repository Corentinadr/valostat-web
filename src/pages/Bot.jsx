import { useEffect, useState } from "react";

function fmtDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleString("fr-FR", {
    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
  });
}

export default function Bot() {
  const [feed, setFeed] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("/api/feed")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setFeed)
      .catch(() => setError("Fil d'activité indisponible pour le moment."));
  }, []);

  return (
    <>
      <div className="hero">
        <h1>
          Le bot <span>ValoStat</span>, en direct sur Discord.
        </h1>
        <p>
          À chaque victoire ou défaite compétitive d'un joueur suivi, ValoStat envoie
          automatiquement une alerte dans le salon Discord du crew : RR gagné ou perdu,
          rang, K/D/A, ACS, précision, first bloods, MVP de la partie et agent joué.
        </p>
      </div>

      <div className="section">
        <h2>Comment ça marche</h2>
        <div className="steps">
          <div className="step">
            <b>1 · Surveillance</b>
            <p>Toutes les 60 secondes, le bot vérifie l'historique compétitif de chaque joueur suivi via l'API HenrikDev.</p>
          </div>
          <div className="step">
            <b>2 · Détection</b>
            <p>Dès qu'un nouveau match classé apparaît, il récupère le détail complet : score, stats, MVP, changement de RR.</p>
          </div>
          <div className="step">
            <b>3 · Alerte</b>
            <p>Un embed vert ou rouge part instantanément dans le salon, avec l'icône du rang du joueur en vignette.</p>
          </div>
          <div className="step">
            <b>4 · 24/7</b>
            <p>Hébergé sur Render et maintenu éveillé en continu — aucune partie ne passe entre les mailles.</p>
          </div>
        </div>
      </div>

      <div className="section">
        <h2>Dernières alertes — la version web</h2>
        {error && <p className="error">{error}</p>}
        {!feed && !error && <p className="loading">Chargement du fil…</p>}
        {feed &&
          feed.map((a) => (
            <div className={`alert-card ${a.win ? "w" : "l"}`} key={a.player + a.date}>
              <div className="a-head">
                <span className="a-title">
                  <span className={`res ${a.win ? "w" : "l"}`}>
                    {a.win ? "Victoire" : "Défaite"}
                  </span>{" "}
                  — {a.player}
                </span>
                <span className="a-date">{fmtDate(a.date)}</span>
              </div>
              <div className="a-body">
                <span>{a.map} · <b className="num">{a.score}</b></span>
                <span>K/D/A <b className="num">{a.kills} / {a.deaths} / {a.assists}</b></span>
                <span>KD <b className="num">{a.kd}</b></span>
                <span>ACS <b className="num">{a.acs}</b></span>
                <span>HS <b className="num">{a.hs}%</b></span>
                <span>{a.rank.current} · <b className="num">{a.rank.rr} RR</b></span>
                <span>Agent <b>{a.agent}</b></span>
              </div>
            </div>
          ))}
      </div>
    </>
  );
}
