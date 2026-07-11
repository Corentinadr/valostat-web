// Numéro de palier HenrikDev -> fichier image dans public/ranks/
export const TIER_ICONS = {
  0: "unranked",
  3: "iron1", 4: "iron2", 5: "iron3",
  6: "bronze1", 7: "bronze2", 8: "bronze3",
  9: "silver1", 10: "silver2", 11: "silver3",
  12: "gold1", 13: "gold2", 14: "gold3",
  15: "platinum1", 16: "platinum2", 17: "platinum3",
  18: "diamond1", 19: "diamond2", 20: "diamond3",
  21: "ascendant1", 22: "ascendant2", 23: "ascendant3",
  24: "immortal1", 25: "immortal2", 26: "immortal3",
  27: "radiant",
};

export const rankIcon = (tier) => `/ranks/${TIER_ICONS[tier] ?? "unranked"}.png`;
