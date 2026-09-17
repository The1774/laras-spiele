// =====================================================
// Gemeinsame Skalierung: feste interne Auflösung → Bildschirm
//
// Jedes Spiel hat eine feste Bühne (z. B. 1024 × 768). Sie wird
// per CSS transform: scale() so groß wie möglich in das Fenster
// eingepasst und bleibt dabei mittig (der Rahmen drumherum ist
// ein Flex-Container, siehe basis.css / Spiel-CSS).
//
// Verwendung:
//     Skalierung.init(document.getElementById('buehne'), 1024, 768);
//     Skalierung.faktor                  // aktueller Zoom-Faktor
//     Skalierung.zuBuehne(clientX, clientY)
//         → { x, y } in Bühnen-Koordinaten (für eingabe.js)
//
// Die Zauberwiese hat noch ihre eigene skaliere()-Funktion in
// game.js; sie kann später hierauf umgestellt werden.
// =====================================================

var Skalierung = {
    element: null,
    breite: 1024,
    hoehe: 768,
    faktor: 1,

    init: function (element, breite, hoehe) {
        this.element = element;
        this.breite = breite;
        this.hoehe = hoehe;
        var self = this;
        window.addEventListener('resize', function () { self.anpassen(); });
        window.addEventListener('orientationchange', function () { self.anpassen(); });
        this.anpassen();
    },

    // Zoom-Faktor neu berechnen und auf das Element anwenden
    anpassen: function () {
        if (!this.element) return;
        this.faktor = Math.min(window.innerWidth / this.breite, window.innerHeight / this.hoehe);
        this.element.style.transform = 'scale(' + this.faktor + ')';
    },

    // Bildschirm-Koordinaten (z. B. aus einem Pointer Event) in
    // Bühnen-Koordinaten umrechnen. getBoundingClientRect() berücksichtigt
    // die Skalierung bereits, deshalb reicht Teilen durch den Faktor.
    zuBuehne: function (clientX, clientY) {
        if (!this.element) return { x: clientX, y: clientY };
        var r = this.element.getBoundingClientRect();
        return {
            x: (clientX - r.left) / this.faktor,
            y: (clientY - r.top) / this.faktor
        };
    }
};
