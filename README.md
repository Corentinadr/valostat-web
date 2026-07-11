# ValoStat Web

Site React qui prolonge le bot Discord ValoStat : stats compétitives détaillées
des joueurs du crew + vitrine du bot. Données via l'API non officielle HenrikDev.

## Structure
- `server/index.js` — backend Express : proxy HenrikDev (clé côté serveur), agrégation des stats, cache 5 min
- `src/` — front React (Vite) : accueil (cartes joueurs), profils détaillés, page bot
- Joueurs affichés : définis dans `PLAYERS` en haut de `server/index.js` (Ourraaa exclu volontairement)

## Lancer en local
```bash
npm install
cp .env.example .env   # puis mets ta clé HenrikDev
npm run server         # terminal 1 : API sur :3001
npm run dev            # terminal 2 : front sur :5173
```
Ouvre http://localhost:5173

## Production (Render)
```bash
npm run build          # génère dist/
npm start              # Express sert l'API + le front sur :3001
```
Sur Render : Web Service, Build `npm install && npm run build`, Start `npm start`,
variable d'env `HENRIK_API_KEY`.

## Stats affichées par profil
Vue d'ensemble (WR, KD, KAD, ACS, kills/morts/assists, kills par round, first bloods),
précision (tête/corps/jambes), rôles, top agents, top armes, top maps,
historique des 20 derniers matchs avec bande de forme.
