// =====================================================
// GERÜST – gemeinsame Partikel-Effekte (noch leer)
//
// Was hier hineingehört: kleine, wiederverwendbare Effekte, die
// mehrere Spiele brauchen, gezeichnet auf einem Canvas-Kontext.
// Jeder Effekt bekommt eine Position, erzeugt ein paar Teilchen
// und diese werden pro Frame bewegt und gezeichnet.
//
// Geplante Effekte:
//   herzen    – aufsteigende rosa Herzen (Streicheln, Belohnung)
//   funkeln   – kleine Sterne/Glitzer (Magie, Erfolg)
//   noten     – Musiknoten (Singen, Musik an)
//   zzz       – schwebende „Z", wenn eine Figur schläft
//   tropfen   – Wassertropfen (Baden, Tränen, Regen)
//   konfetti  – bunte Schnipsel mit Schwerkraft (großer Jubel)
//
// Geplante Schnittstelle (Vorschlag):
//     var p = Partikel.erstelle();        // eigener Pool je Spiel
//     p.herzen(x, y, anzahl);             // Teilchen hinzufügen
//     p.update(dt);                       // bewegen, alte entfernen
//     p.zeichne(ctx);                     // auf das Canvas malen
//
// Die Zauberwiese behält ihre eigenen Partikel in entities.js/game.js;
// ein späteres Zusammenführen ist möglich, aber nicht nötig.
// =====================================================

var Partikel = {
    // absichtlich noch leer – siehe Kommentar oben
};
