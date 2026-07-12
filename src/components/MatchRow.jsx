// Ligne d'historique riche — pièce maîtresse de la page profil.
// Affiche : agent, map, score, "Match Score" (équivalent visuel du TRS, calcul maison),
// badges multikills (2K/3K/4K/ACE), MVP, KDA, HS%, ACS.

function fmtDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

// Palier du Match Score -> couleur + label (repères façon tier)
function scoreTier(s) {
  if (s == null) return null;
  if (s >= 800) return { cls: "s", label: "S" };
  if (s >= 650) return { cls: "a", label: "A" };
  if (s >= 450) return { cls: "b", label: "B" };
  return { cls: "c", label: "C" };
}

export default function MatchRow({ m }) {
  const tier = scoreTier(m.matchScore);
  const multi = m.multi || {};
  const badges = [];
  if (multi.ace) badges.push({ t: `ACE${multi.ace > 1 ? " ×" + multi.ace : ""}`, cls: "ace" });
  if (multi.k4) badges.push({ t: `4K${multi.k4 > 1 ? " ×" + multi.k4 : ""}`, cls: "k4" });
  if (multi.k3) badges.push({ t: `3K${multi.k3 > 1 ? " ×" + multi.k3 : ""}`, cls: "k3" });
  if (multi.k2) badges.push({ t: `2K${multi.k2 > 1 ? " ×" + multi.k2 : ""}`, cls: "k2" });

  return (
    <div className={`mrow ${m.win ? "win" : "loss"}`}>
      <span className={`mrow-edge ${m.win ? "win" : "loss"}`} />

      {/* Bloc gauche : agent + contexte */}
      <div className="mrow-head">
        <div className="mrow-agent-badge">{(m.agent || "?").slice(0, 2)}</div>
        <div>
          <div className="mrow-map">
            {m.map}
            {m.isMvp && <span className="mrow-mvp">MVP</span>}
          </div>
          <div className="mrow-sub num">{fmtDate(m.date)} · Compétitif</div>
        </div>
      </div>

      {/* Score de la partie */}
      <div className={`mrow-score ${m.win ? "win" : "loss"}`}>
        <span className="num">{m.score}</span>
        <div className="mrow-result">{m.win ? "Victoire" : "Défaite"}</div>
      </div>

      {/* Match Score (type TRS) */}
      {tier ? (
        <div className={`mrow-trs ${tier.cls}`}>
          <span className="mrow-trs-badge">{tier.label}</span>
          <div>
            <div className="mrow-trs-val num">{m.matchScore}</div>
            <div className="mrow-trs-lbl">Score</div>
          </div>
        </div>
      ) : (
        <div className="mrow-trs empty" />
      )}

      {/* Badges multikills */}
      <div className="mrow-badges">
        {badges.length ? (
          badges.map((b, i) => <span key={i} className={`mk ${b.cls}`}>{b.t}</span>)
        ) : (
          <span className="mk-none">—</span>
        )}
      </div>

      {/* Stats chiffrées */}
      <div className="mrow-stats">
        <div className="ms"><span className="ms-k">KDA</span><b className="num">{m.kills} / {m.deaths} / {m.assists}</b></div>
        <div className="ms"><span className="ms-k">KD</span><b className={`num ${m.kd >= 1 ? "pos" : "neg"}`}>{m.kd}</b></div>
        <div className="ms"><span className="ms-k">HS</span><b className="num">{m.matchHs != null ? m.matchHs + "%" : "—"}</b></div>
        <div className="ms"><span className="ms-k">ACS</span><b className="num">{m.acs}</b></div>
      </div>
    </div>
  );
}
