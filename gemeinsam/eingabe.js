// =====================================================
// GERÜST – gemeinsame Eingabe für alle Spiele (noch leer)
//
// Was hier hineingehört, sobald das erste Spiel es braucht
// (Leo Ella von Anfang an, die Zauberwiese behält vorerst
// ihr eigenes js/input.js):
//
// - Pointer Events statt getrennter Touch-/Maus-Listener:
//   pointerdown / pointermove / pointerup / pointercancel
//   → funktioniert auf Tablet (Finger), Desktop (Maus) und Stift
// - Gesten-Erkennung auf Basis der Bühnen-Koordinaten
//   (siehe skalierung.js, damit Positionen unabhängig vom
//   Zoom-Faktor sind):
//     tippen   – kurz runter und wieder hoch, ohne Bewegung
//     ziehen   – runter, bewegen (mit Start-/aktueller Position), hoch
//     wischen  – schnelle Bewegung in eine Richtung (links/rechts/oben/unten)
// - Erste Interaktion weckt den AudioContext (Sound.init aus audio.js)
// - preventDefault für Scrollen/Zoomen auf der Spielfläche
//
// Geplante Schnittstelle (Vorschlag):
//     Eingabe.init(element, {
//         beiTippen:  function (x, y) {},
//         beiZiehen:  function (x, y, startX, startY, phase) {}, // phase: 'start'|'bewegt'|'ende'
//         beiWischen: function (richtung) {}
//     });
// =====================================================

var EingabeGemeinsam = {
    // absichtlich noch leer – siehe Kommentar oben
};
