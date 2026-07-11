// Bande de forme : une barre par match (vert = victoire, rouge = défaite).
// C'est l'élément signature du site — lisible d'un coup d'œil.
export default function FormStrip({ matches, max = 20 }) {
  const slice = (matches || []).slice(0, max);
  return (
    <div className="form-strip" title="20 derniers matchs (récent → ancien)">
      {slice.map((m, i) => (
        <i key={i} className={m.win ? "w" : "l"} />
      ))}
      {Array.from({ length: Math.max(0, max - slice.length) }).map((_, i) => (
        <i key={`x${i}`} />
      ))}
    </div>
  );
}
