// =====================================================
// Leo Ella – das Bad (Wanne, Wasser, Schaum, nasses Fell)
//
// Die Wanne fährt fürs Baden ins Zimmer (zwei SVGs: #wanne-hinten liegt
// hinter Leo, #wanne-vorne mit Wasser, Rand und Hahn davor). Dieses Modul
// kennt nur das Bild:
//   - Wasserstand (0 leer … 1 voll) und der Hahn, aus dem es läuft
//   - Schaum auf Leo: einzelne Blobs im Leo-SVG (#schaum .schaumblob),
//     jeder mit einem Wert 0 (nichts) … 1 (dicker Schaumberg)
//   - Schaum auf der Wasseroberfläche (was abgespült wurde)
//   - nasses Fell: die Fellfarbe (--leo-fell) wird dunkler, Tropfen hängen
//     an Ohren und Kinn
//
// Was wann passiert (Hahn, Seife, Dusche, Föhn) entscheidet game.js.
//
// Verwendung:
//     Bad.init(); Bad.zeigen(); Bad.verstecken();
//     Bad.hahnAuf(); if (Bad.update(dt)) { /* Wanne ist gerade voll geworden */ }
//     var i = Bad.naechsterBlob(x, y, 150); Bad.schaum(i, 0.5); Bad.schaumGesamt();
//     Bad.oberflaechenSchaum(0.4); Bad.setzeFeuchte(0.8);
// =====================================================

var Bad = {
    buehne: null,
    vorne: null,
    hinten: null,
    wasser: null,
    schaumGruppe: null,
    leoSvg: null,
    blobs: [],            // { el, x, y (Leo-Koordinaten), wert }
    wasserstand: 0,       // 0 leer … 1 voll
    laeuft: false,        // Hahn offen
    feuchte: 0,           // 0 trocken … 1 klatschnass

    // Bereich um den Wasserhahn (Bühnen-Koordinaten) – groß für kleine Finger
    HAHN: { x: 576, y: 486, breite: 120, hoehe: 130 },
    // Wo der Strahl aus dem Hahn ins Wasser fällt (für Blick und Tropfen)
    STRAHL: { x: 606, y: 596 },
    // So lange läuft das Wasser, bis die Wanne voll ist (Sekunden)
    FUELL_SEKUNDEN: 2.4,
    // Der Wasserspiegel steigt von hier (leer) nach hier (voll), Bühnen-Pixel
    WASSER_LEER_Y: 622,
    WASSER_VOLL_Y: 578,

    FELL_TROCKEN: '#ffd98a',
    FELL_NASS: '#e9b95e',

    init: function () {
        this.buehne = document.getElementById('buehne');
        this.vorne = document.getElementById('wanne-vorne');
        this.hinten = document.getElementById('wanne-hinten');
        this.wasser = document.getElementById('wasser');
        this.leoSvg = document.getElementById('leo');
        this.schaumGruppe = document.getElementById('schaum');

        var els = this.schaumGruppe.querySelectorAll('.schaumblob');
        for (var i = 0; i < els.length; i++) {
            this.blobs.push({
                el: els[i],
                x: parseFloat(els[i].getAttribute('data-x')),
                y: parseFloat(els[i].getAttribute('data-y')),
                wert: 0
            });
            els[i].style.transform = 'scale(0)';
        }
        this.wasserSetzen(0);
        this.oberflaechenSchaum(0);
    },

    // ---------- Wanne rein / raus ----------

    zeigen: function () {
        this.wasserstand = 0;
        this.laeuft = false;
        this.wasserSetzen(0);
        this.oberflaechenSchaum(0);
        this.schaumWeg();
        this.vorne.classList.remove('laeuft');
        this.buehne.classList.add('badet');
        this.leoSvg.classList.add('badet');
    },

    verstecken: function () {
        this.laeuft = false;
        this.vorne.classList.remove('laeuft');
        this.buehne.classList.remove('badet');
        this.leoSvg.classList.remove('badet');
        this.setzeFeuchte(0);
    },

    // ---------- Wasser ----------

    istAufHahn: function (x, y) {
        var b = this.HAHN;
        return x >= b.x && x <= b.x + b.breite && y >= b.y && y <= b.y + b.hoehe;
    },

    hahnAuf: function () {
        if (this.laeuft || this.wasserstand >= 1) return false;
        this.laeuft = true;
        this.vorne.classList.add('laeuft');
        return true;
    },

    // Pro Frame: Wasser steigt, solange der Hahn offen ist.
    // Gibt true zurück in dem Moment, in dem die Wanne voll wird.
    update: function (dt) {
        if (!this.laeuft) return false;
        this.wasserstand = Math.min(1, this.wasserstand + dt / this.FUELL_SEKUNDEN);
        this.wasserSetzen(this.wasserstand);
        if (this.wasserstand >= 1) {
            this.laeuft = false;
            this.vorne.classList.remove('laeuft');
            return true;
        }
        return false;
    },

    wasserSetzen: function (stand) {
        var y = this.WASSER_LEER_Y + (this.WASSER_VOLL_Y - this.WASSER_LEER_Y) * stand;
        this.wasser.setAttribute('y', y.toFixed(1));
    },

    // Kurz wackeln: „hier drehen"
    hahnHinweis: function () {
        var h = document.getElementById('hahn');
        h.classList.remove('hinweis');
        h.getBoundingClientRect();
        h.classList.add('hinweis');
        setTimeout(function () { h.classList.remove('hinweis'); }, 1600);
    },

    // ---------- Schaum auf Leo ----------

    // Blob-Mittelpunkt auf der Bühne
    blobPosition: function (i) {
        return Leo.zuBuehne(this.blobs[i].x, this.blobs[i].y);
    },

    // Welcher Blob liegt am nächsten am Punkt (Bühne), höchstens `radius` entfernt? (-1 = keiner)
    naechsterBlob: function (x, y, radius) {
        var bester = -1, besteDist = radius * radius;
        for (var i = 0; i < this.blobs.length; i++) {
            var p = this.blobPosition(i);
            var dx = p.x - x, dy = p.y - y;
            var d = dx * dx + dy * dy;
            if (d < besteDist) { bester = i; besteDist = d; }
        }
        return bester;
    },

    schaum: function (i, wert) {
        var b = this.blobs[i];
        b.wert = Math.max(0, Math.min(1, wert));
        // Ab dem ersten Tropfen Seife ist schon ein kleiner Klecks zu sehen
        var s = b.wert <= 0 ? 0 : 0.25 + 0.75 * b.wert;
        b.el.style.transform = 'scale(' + s.toFixed(3) + ')';
    },

    schaumGesamt: function () {
        var s = 0;
        for (var i = 0; i < this.blobs.length; i++) s += this.blobs[i].wert;
        return s;
    },

    schaumMax: function () {
        var m = 0;
        for (var i = 0; i < this.blobs.length; i++) m = Math.max(m, this.blobs[i].wert);
        return m;
    },

    schaumAlleUeber: function (w) {
        for (var i = 0; i < this.blobs.length; i++) if (this.blobs[i].wert < w) return false;
        return true;
    },

    schaumWeg: function () {
        for (var i = 0; i < this.blobs.length; i++) this.schaum(i, 0);
    },

    // Die Schaumberge wackeln kurz: „hier reiben"
    schaumHinweis: function () {
        var g = this.schaumGruppe;
        g.classList.remove('wackelt');
        g.getBoundingClientRect();
        g.classList.add('wackelt');
        setTimeout(function () { g.classList.remove('wackelt'); }, 1400);
    },

    // Schaum, der auf dem Badewasser schwimmt (0 … 1)
    oberflaechenSchaum: function (anteil) {
        document.getElementById('wanne-schaum').style.opacity = Math.max(0, Math.min(1, anteil)).toFixed(2);
    },

    // ---------- Nasses Fell ----------

    // 0 = trocken und fluffig, 1 = klatschnass (dunkleres Fell, Tropfen)
    setzeFeuchte: function (t) {
        t = Math.max(0, Math.min(1, t));
        this.feuchte = t;
        this.leoSvg.style.setProperty('--leo-fell', t <= 0 ? '' : mischeFarbe(this.FELL_TROCKEN, this.FELL_NASS, t));
        this.leoSvg.classList.toggle('nass', t > 0.15);
    }
};

// Zwei Hex-Farben mischen (t = 0 → a, t = 1 → b)
function mischeFarbe(a, b, t) {
    function kanal(h, i) { return parseInt(h.substr(1 + i * 2, 2), 16); }
    var r = Math.round(kanal(a, 0) + (kanal(b, 0) - kanal(a, 0)) * t);
    var g = Math.round(kanal(a, 1) + (kanal(b, 1) - kanal(a, 1)) * t);
    var bl = Math.round(kanal(a, 2) + (kanal(b, 2) - kanal(a, 2)) * t);
    return 'rgb(' + r + ',' + g + ',' + bl + ')';
}
