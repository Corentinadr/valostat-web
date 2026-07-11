import "dotenv/config";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;
const API_KEY = process.env.HENRIK_API_KEY;
const BASE = "https://api.henrikdev.xyz/valorant";

if (!API_KEY) {
  console.error("❌ HENRIK_API_KEY manquante (voir .env.example)");
  process.exit(1);
}

// --- Joueurs affichés sur le site (Ourraaa volontairement exclu) ---
const PLAYERS = [
  { name: "Rin Tosaka", tag: "GOAT", region: "eu" },
  { name: "Krokmou", tag: "12345", region: "eu" },
  { name: "Gab", tag: "2001S", region: "eu" },
  { name: "Archer", tag: "2112s", region: "eu" },
  { name: "Gattouz", tag: "UWU69", region: "eu" },
];

// --- Agent -> rôle ---
const ROLES = {
  jett: "Duelliste", reyna: "Duelliste", raze: "Duelliste", phoenix: "Duelliste",
  neon: "Duelliste", yoru: "Duelliste", iso: "Duelliste", waylay: "Duelliste",
  sova: "Initiateur", breach: "Initiateur", skye: "Initiateur", "kay/o": "Initiateur",
  fade: "Initiateur", gekko: "Initiateur", tejo: "Initiateur",
  omen: "Contrôleur", brimstone: "Contrôleur", viper: "Contrôleur",
  astra: "Contrôleur", harbor: "Contrôleur", clove: "Contrôleur",
  sage: "Sentinelle", cypher: "Sentinelle", killjoy: "Sentinelle",
  chamber: "Sentinelle", deadlock: "Sentinelle", vyse: "Sentinelle",
};
const roleOf = (agent) => ROLES[(agent || "").toLowerCase()] || "Autre";

// --- Cache mémoire simple (TTL 5 min) pour épargner le rate limit ---
const cache = new Map();
const TTL = 5 * 60 * 1000;
function getCache(key) {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.t < TTL) return hit.v;
  return null;
}
function setCache(key, v) {
  cache.set(key, { v, t: Date.now() });
}

async function henrik(endpoint) {
  const res = await fetch(`${BASE}${endpoint}`, { headers: { Authorization: API_KEY } });
  if (!res.ok) return null;
  return res.json();
}

// --- Agrégation complète d'un profil joueur ---
async function buildProfile(p) {
  const enc = encodeURIComponent;
  const key = `profile:${p.region}:${p.name}#${p.tag}`.toLowerCase();
  const cached = getCache(key);
  if (cached) return cached;

  const [account, mmr, stored, full] = await Promise.all([
    henrik(`/v1/account/${enc(p.name)}/${enc(p.tag)}`),
    henrik(`/v2/mmr/${p.region}/${enc(p.name)}/${enc(p.tag)}`),
    henrik(`/v1/stored-matches/${p.region}/${enc(p.name)}/${enc(p.tag)}?mode=competitive&size=20`),
    henrik(`/v3/matches/${p.region}/${enc(p.name)}/${enc(p.tag)}?filter=competitive&size=10`),
  ]);

  const puuid = account?.data?.puuid;
  const cur = mmr?.data?.current_data;
  const peak = mmr?.data?.highest_rank;

  // --- Derniers matchs (jusqu'à 20) depuis stored-matches ---
  const matches = [];
  const agg = {
    wins: 0, losses: 0, kills: 0, deaths: 0, assists: 0,
    head: 0, body: 0, leg: 0, scoreSum: 0, roundsSum: 0,
  };
  const mapAgg = {};   // map -> {w,l}
  const agentAgg = {}; // agent -> {matches,w,l,k,d,a,scoreSum,roundsSum}
  const roleAgg = {};  // role -> {w,l,k,d,a}

  for (const m of stored?.data || []) {
    const s = m.stats || {};
    const teams = m.teams || {};
    const myTeam = (s.team || "").toLowerCase();
    const my = teams[myTeam] ?? 0;
    const enemy = teams[myTeam === "red" ? "blue" : "red"] ?? 0;
    const win = my > enemy;
    const rounds = (teams.red ?? 0) + (teams.blue ?? 0) || 1;
    const agent = s.character?.name || "?";
    const map = m.meta?.map?.name || "?";
    const acs = Math.round((s.score || 0) / rounds);
    const shots = (s.shooting?.head || 0) + (s.shooting?.body || 0) + (s.shooting?.leg || 0);
    const hs = shots ? Math.round(((s.shooting?.head || 0) / shots) * 100) : 0;

    matches.push({
      id: m.meta?.id,
      date: m.meta?.started_at,
      map, agent, win,
      score: `${my} — ${enemy}`,
      kills: s.kills ?? 0, deaths: s.deaths ?? 0, assists: s.assists ?? 0,
      kd: s.deaths ? +(s.kills / s.deaths).toFixed(2) : s.kills ?? 0,
      acs, hs,
    });

    if (win) agg.wins++; else agg.losses++;
    agg.kills += s.kills || 0; agg.deaths += s.deaths || 0; agg.assists += s.assists || 0;
    agg.head += s.shooting?.head || 0; agg.body += s.shooting?.body || 0; agg.leg += s.shooting?.leg || 0;
    agg.scoreSum += s.score || 0; agg.roundsSum += rounds;

    mapAgg[map] = mapAgg[map] || { w: 0, l: 0 };
    win ? mapAgg[map].w++ : mapAgg[map].l++;

    agentAgg[agent] = agentAgg[agent] || { matches: 0, w: 0, l: 0, k: 0, d: 0, a: 0, scoreSum: 0, roundsSum: 0 };
    const A = agentAgg[agent];
    A.matches++; win ? A.w++ : A.l++;
    A.k += s.kills || 0; A.d += s.deaths || 0; A.a += s.assists || 0;
    A.scoreSum += s.score || 0; A.roundsSum += rounds;

    const role = roleOf(agent);
    roleAgg[role] = roleAgg[role] || { w: 0, l: 0, k: 0, d: 0, a: 0 };
    const R = roleAgg[role];
    win ? R.w++ : R.l++;
    R.k += s.kills || 0; R.d += s.deaths || 0; R.a += s.assists || 0;
  }

  // --- Top armes + first bloods, depuis les événements de kills (v3, 10 derniers matchs) ---
  const weaponAgg = {};
  let firstBloods = 0;
  for (const m of full?.data || []) {
    const kills = m.kills || [];
    const earliest = {};
    for (const k of kills) {
      if (k.killer_puuid === puuid) {
        const w = k.damage_weapon_name || null;
        if (w) {
          weaponAgg[w] = (weaponAgg[w] || 0) + 1;
        }
      }
      const r = k.round, t = k.kill_time_in_round;
      if (r !== undefined && t !== undefined) {
        if (!earliest[r] || t < earliest[r].t) earliest[r] = { t, killer: k.killer_puuid };
      }
    }
    for (const r in earliest) if (earliest[r].killer === puuid) firstBloods++;
  }

  const shotsTotal = agg.head + agg.body + agg.leg;
  const profile = {
    name: p.name, tag: p.tag, region: p.region,
    level: account?.data?.account_level ?? null,
    card: account?.data?.card?.small ?? null,
    rank: {
      current: cur?.currenttierpatched || "Non classé",
      tier: cur?.currenttier ?? 0,
      rr: cur?.ranking_in_tier ?? 0,
      lastChange: cur?.mmr_change_to_last_game ?? null,
      peak: peak?.patched_tier || null,
      peakSeason: peak?.season || null,
    },
    overview: {
      matches: matches.length,
      wins: agg.wins, losses: agg.losses,
      winrate: matches.length ? Math.round((agg.wins / matches.length) * 100) : 0,
      kills: agg.kills, deaths: agg.deaths, assists: agg.assists,
      kd: agg.deaths ? +(agg.kills / agg.deaths).toFixed(2) : agg.kills,
      kad: agg.deaths ? +((agg.kills + agg.assists) / agg.deaths).toFixed(2) : agg.kills,
      acs: agg.roundsSum ? Math.round(agg.scoreSum / agg.roundsSum) : 0,
      killsPerRound: agg.roundsSum ? +(agg.kills / agg.roundsSum).toFixed(2) : 0,
      firstBloods,
    },
    accuracy: {
      head: shotsTotal ? Math.round((agg.head / shotsTotal) * 100) : 0,
      body: shotsTotal ? Math.round((agg.body / shotsTotal) * 100) : 0,
      leg: shotsTotal ? Math.round((agg.leg / shotsTotal) * 100) : 0,
      headHits: agg.head, bodyHits: agg.body, legHits: agg.leg,
    },
    roles: Object.entries(roleAgg).map(([role, r]) => ({
      role, wins: r.w, losses: r.l,
      winrate: (r.w + r.l) ? Math.round((r.w / (r.w + r.l)) * 100) : 0,
      kda: r.d ? +((r.k + r.a) / r.d).toFixed(2) : r.k,
      k: r.k, d: r.d, a: r.a,
    })).sort((a, b) => (b.wins + b.losses) - (a.wins + a.losses)),
    topAgents: Object.entries(agentAgg).map(([agent, a]) => ({
      agent, matches: a.matches,
      winrate: Math.round((a.w / a.matches) * 100),
      kd: a.d ? +(a.k / a.d).toFixed(2) : a.k,
      acs: a.roundsSum ? Math.round(a.scoreSum / a.roundsSum) : 0,
    })).sort((a, b) => b.matches - a.matches).slice(0, 5),
    topWeapons: Object.entries(weaponAgg).map(([weapon, kills]) => ({ weapon, kills }))
      .sort((a, b) => b.kills - a.kills).slice(0, 5),
    topMaps: Object.entries(mapAgg).map(([map, m]) => ({
      map, wins: m.w, losses: m.l,
      winrate: Math.round((m.w / (m.w + m.l)) * 100),
    })).sort((a, b) => b.winrate - a.winrate),
    matches,
  };

  setCache(key, profile);
  return profile;
}

// --- Routes API ---
app.get("/api/players", (req, res) => res.json(PLAYERS));

app.get("/api/player/:region/:name/:tag", async (req, res) => {
  const { region, name, tag } = req.params;
  const known = PLAYERS.find(
    (p) => p.name.toLowerCase() === name.toLowerCase() && p.tag.toLowerCase() === tag.toLowerCase()
  );
  if (!known) return res.status(404).json({ error: "Joueur non suivi" });
  try {
    const profile = await buildProfile({ ...known, region });
    res.json(profile);
  } catch (e) {
    console.error(e);
    res.status(502).json({ error: "Erreur API HenrikDev" });
  }
});

// Fil d'activité pour la page Bot : dernier match de chaque joueur
app.get("/api/feed", async (req, res) => {
  try {
    const out = [];
    for (const p of PLAYERS) {
      const profile = await buildProfile(p);
      const last = profile.matches[0];
      if (last) out.push({ player: `${p.name}#${p.tag}`, rank: profile.rank, ...last });
    }
    out.sort((a, b) => new Date(b.date) - new Date(a.date));
    res.json(out);
  } catch (e) {
    console.error(e);
    res.status(502).json({ error: "Erreur API HenrikDev" });
  }
});

// --- Fichiers statiques du front (après `npm run build`) ---
const dist = path.join(__dirname, "..", "dist");
app.use(express.static(dist));
app.get("*", (req, res) => res.sendFile(path.join(dist, "index.html")));

app.listen(PORT, () => console.log(`🌐 ValoStat Web sur le port ${PORT}`));
