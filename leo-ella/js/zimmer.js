// =====================================================
// Leo Ella – das Zimmer (Tag / Nacht)
//
// Das Zimmer ist ein Inline-SVG (Quelle: design/zimmer/zimmer-tag.svg,
// Nacht-Teile aus zimmer-nacht.svg). Tag → Nacht ist kein Dateiwechsel:
//   - Fenster-Gruppe tauschen (.nur-tag / .nur-nacht)
//   - dunkles Overlay, Nachtlicht und Lichterkette einblenden
//   - die große Leo ausblenden, die kleine schlafende Leo im Bett zeigen
// Der Übergang wird per CSS weich geblendet (Klasse "nacht" auf #buehne).
// =====================================================

var Zimmer = {
    buehne: null,
    istNacht: false,

    init: function () {
        this.buehne = document.getElementById('buehne');
    },

    setzeNacht: function (nacht) {
        this.istNacht = !!nacht;
        this.buehne.classList.remove('daemmern');
        this.buehne.classList.toggle('nacht', this.istNacht);
    },

    // Nur das Licht dimmen (während Leo noch gähnt) – die große Leo bleibt sichtbar
    setzeDaemmerung: function (an) {
        this.buehne.classList.toggle('daemmern', !!an);
    },

    // Position des Bett-Leos auf der Bühne (für die Zzz-Partikel)
    bettPosition: function () {
        return { x: 806, y: 300 };
    }
};
