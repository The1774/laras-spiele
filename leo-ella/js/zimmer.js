// =====================================================
// Leo Ella – das Zimmer (Tag / Nacht, Vorhang, Stehlampe)
//
// Das Zimmer ist ein Inline-SVG (Quelle: design/zimmer/zimmer-tag.svg,
// Nacht-Teile aus zimmer-nacht.svg). Tag → Nacht ist kein Dateiwechsel:
//   - Fenster-Gruppe tauschen (.nur-tag / .nur-nacht)
//   - dunkles Overlay, Nachtlicht und Lichterkette einblenden
//   - die große Leo ausblenden, die kleine schlafende Leo im Bett zeigen
// Der Übergang wird per CSS weich geblendet (Klasse "nacht" auf #buehne).
//
// Neu fürs Abendritual (alles, was Lara selbst macht):
//   - Vorhang: zwei Bahnen (#vorhang-links/-rechts), die Lara am Fenster
//     zuzieht (ziehen oder tippen). anteil 0 = offen, 1 = zu.
//   - Stehlampe (#lampe): antippen schaltet an/aus.
// Beides macht das Zimmer über #abdunkeln stufenweise dunkler (CSS-Klassen
// "vorhang-zu" und "lampe-aus" auf #buehne).
// =====================================================

var Zimmer = {
    buehne: null,
    istNacht: false,
    vorhangAnteil: 0,      // 0 offen … 1 zu
    lampeAn: true,

    // Bereiche zum Antippen / Anfassen (Bühnen-Koordinaten)
    FENSTER: { x: 196, y: 30, breite: 208, hoehe: 212 },
    LAMPE:   { x: 600, y: 250, breite: 56, hoehe: 226 },
    // So weit (Pixel) muss man ziehen, um den Vorhang ganz zu- oder aufzuziehen
    VORHANG_WEG: 150,

    init: function () {
        this.buehne = document.getElementById('buehne');
        this.vorhangEl = document.getElementById('vorhang');
        this.vorhangLinks = document.getElementById('vorhang-links');
        this.vorhangRechts = document.getElementById('vorhang-rechts');
        this.setzeVorhang(0, true);
        this.setzeLampe(true);
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
    },

    // ---------- Trefferbereiche ----------

    inBereich: function (b, x, y) {
        return x >= b.x && x <= b.x + b.breite && y >= b.y && y <= b.y + b.hoehe;
    },
    istImFenster: function (x, y) { return this.inBereich(this.FENSTER, x, y); },
    istAufLampe:  function (x, y) { return this.inBereich(this.LAMPE, x, y); },

    // ---------- Vorhang ----------

    // anteil 0..1; sofort = ohne weiches Nachgleiten (beim Ziehen mit dem Finger)
    setzeVorhang: function (anteil, sofort) {
        anteil = Math.max(0, Math.min(1, anteil));
        this.vorhangAnteil = anteil;
        this.vorhangEl.classList.toggle('zieht', !!sofort);
        // Offen: schmal zusammengerafft am Rand (16 %), zu: volle Breite bis zur Mitte
        var k = 0.16 + 0.84 * anteil;
        this.vorhangLinks.style.transform = 'scaleX(' + k.toFixed(3) + ')';
        this.vorhangRechts.style.transform = 'scaleX(' + k.toFixed(3) + ')';
        this.buehne.classList.toggle('vorhang-zu', anteil >= 0.5);
    },

    istVorhangZu: function () { return this.vorhangAnteil >= 0.5; },

    // Beim Ziehen: startAnteil + Fingerweg. Von welcher Seite Lara zieht,
    // entscheidet die Richtung: vom linken Rand nach rechts = zuziehen,
    // vom rechten Rand nach links = zuziehen, jeweils zurück = aufziehen.
    vorhangZiehen: function (startAnteil, startX, x) {
        var mitte = this.FENSTER.x + this.FENSTER.breite / 2;
        var richtung = startX < mitte ? 1 : -1;           // links angefasst → nach rechts schließt
        var weg = (x - startX) * richtung / this.VORHANG_WEG;
        this.setzeVorhang(startAnteil + weg, true);
    },

    // Finger loslassen: auf zu oder auf einrasten
    vorhangEinrasten: function () {
        this.setzeVorhang(this.vorhangAnteil >= 0.5 ? 1 : 0, false);
    },

    vorhangUmschalten: function () {
        this.setzeVorhang(this.istVorhangZu() ? 0 : 1, false);
    },

    // ---------- Stehlampe ----------

    setzeLampe: function (an) {
        this.lampeAn = !!an;
        this.buehne.classList.toggle('lampe-aus', !this.lampeAn);
    },

    lampeUmschalten: function () {
        this.setzeLampe(!this.lampeAn);
        return this.lampeAn;
    }
};
