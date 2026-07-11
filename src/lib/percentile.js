// Estimation du percentile d'une stat par rapport à l'ensemble des joueurs
// Valorant, via une approximation normale calée sur les distributions
// communautaires publiques. L'API HenrikDev ne fournit pas de classement
// global — ce sont donc des ESTIMATIONS, affichées comme telles.

// Fonction de répartition de la loi normale (approximation d'Abramowitz-Stegun)
function normCdf(x) {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989423 * Math.exp((-x * x) / 2);
  let p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return x > 0 ? 1 - p : p;
}

// Moyenne / écart-type approximatifs par stat (références communautaires)
const BENCH = {
  winrate: { mean: 50, sd: 8 },
  kd: { mean: 0.95, sd: 0.28 },
  kad: { mean: 1.35, sd: 0.35 },
  acs: { mean: 205, sd: 45 },
  killsPerRound: { mean: 0.72, sd: 0.16 },
  killsPerMatch: { mean: 15, sd: 4.5 },
  deathsPerMatch: { mean: 14.5, sd: 3, invert: true }, // moins = mieux
  assistsPerMatch: { mean: 5, sd: 2.6 },
  fbPerMatch: { mean: 1.0, sd: 0.7 },
};

// Renvoie "Top X%" (estimation), ou null si pas de référence pour la stat
export function topPercent(stat, value) {
  const b = BENCH[stat];
  if (!b || value === null || value === undefined) return null;
  let z = (value - b.mean) / b.sd;
  if (b.invert) z = -z;
  const pct = normCdf(z); // proportion de joueurs en dessous
  const top = Math.max(0.1, Math.min(99, +(100 - pct * 100).toFixed(1)));
  return top;
}

// Couleur du label selon le niveau (repères façon tracker)
export function topTone(top) {
  if (top === null) return "";
  if (top <= 5) return "s";   // exceptionnel
  if (top <= 20) return "a";  // très bon
  if (top <= 45) return "b";  // bon
  return "c";                  // dans la masse
}
