// =====================================================
// GERÜST – gemeinsame Skalierung (noch leer)
//
// Was hier hineingehört: Jedes Spiel hat eine feste interne
// Auflösung (Zauberwiese 960 × 540, Hub 1024 × 768) und wird
// per CSS transform: scale() so groß wie möglich in den
// Bildschirm eingepasst. Diese Logik steht heute noch doppelt
// in zauberwiese/js/game.js (skaliere) und hub/hub.js.
//
// Geplante Schnittstelle (Vorschlag):
//     Skalierung.init(element, breite, hoehe);
//         → setzt transform: scale(faktor) auf das Element,
//           hört auf window resize / orientationchange
//     Skalierung.faktor            // aktueller Zoom-Faktor
//     Skalierung.zuBuehne(clientX, clientY)
//         → rechnet Bildschirm-Koordinaten (z. B. aus Pointer Events)
//           in Bühnen-Koordinaten um (für eingabe.js)
//
// Außerdem sinnvoll: Rundung des Faktors auf ganze Pixel bei
// Canvas-Spielen (verhindert unscharfe Kanten) und Beachtung von
// env(safe-area-inset-*) auf dem iPad.
// =====================================================

var Skalierung = {
    // absichtlich noch leer – siehe Kommentar oben
};
