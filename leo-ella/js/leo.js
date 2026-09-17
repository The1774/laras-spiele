// =====================================================
// Leo Ella – die Figur
//
// Leo ist EIN Inline-SVG in index.html (Quelle: design/leo-ella-standard.svg).
// Alles, was sich zwischen den Zuständen und Reaktionen unterscheidet
// (Augen, Mund, Ohren, Brauen, Schwanz, Wangen, Träne, Decke, Props …),
// liegt als eigene Gruppe mit data-teil="…" und data-variante="…" im SVG.
// Dieses Modul blendet pro Teil genau eine Variante ein (oder keine).
//
// Ein „Gesicht" ist eine Beschreibung wie
//     { augen: 'offen', mund: 'laecheln', ohren: 'oben', schwanz: 'normal', … }
// Bei Props darf eine Liste stehen: props: ['schuessel-voll', 'herzen'].
//
// Dazu kommen CSS-Klassen für die Bewegung (leo-ella/css/style.css):
//   auf #leo-figur: huepfen, wackeln, schuetteln, plustern, vibrieren
//   auf #kopf:      nicken, lehnen
// =====================================================

var Leo = {
    svg: null,
    figur: null,
    kopf: null,
    teile: {},          // { augen: { offen: [el, …], gross: [el, …] }, … }
    aktuellesGesicht: null,

    // ---------- Gesichter der Zustände ----------

    BASIS: {
        schatten: 'tag', schwanz: 'normal', koerper: 'normal', pfoten: 'normal',
        ohren: 'oben', augen: 'offen', wangen: 'normal', mund: 'laecheln'
    },

    ZUSTAENDE: {
        zufrieden: {},
        hungrig:   { augen: 'gross', mund: 'zick', grummel: 'an', props: ['schuessel-leer'] },
        muede:     { ohren: 'unten', augen: 'muede', mund: 'gaehnen' },
        schmutzig: { augen: 'seitlich', mund: 'gerade', matsch: 'an' },
        traurig:   { ohren: 'unten', brauen: 'traurig', augen: 'traurig', traene: 'gross',
                     mund: 'traurig', schwanz: 'traurig' },
        schlafend: { schatten: 'nacht', schwanz: null, pfoten: null, ohren: 'unten',
                     augen: 'zu', mund: 'klein', decke: 'an', props: ['mond'] }
    },

    // ---------- Gesichter der Reaktionen (1–3 Sekunden, dann zurück) ----------

    REAKTIONEN: {
        danke:       { augen: 'lachen', wangen: 'gross', mund: 'lachen',
                       props: ['schuessel-voll', 'herzen'], blase: 'danke', kopf: 'nicken' },
        trinken:     { augen: 'lachen', wangen: 'gross', mund: 'lachen',
                       props: ['glas', 'herzen'], kopf: 'nicken' },
        schnurren:   { augen: 'lachen', wangen: 'gross', mund: 'lachen', schwanz: 'herz',
                       props: ['vibration'], kopf: 'lehnen', figur: 'vibrieren' },
        frisch:      { schatten: 'frisch', koerper: 'plustern', ohren: 'hoch', mund: 'lachen',
                       props: ['funkeln'], figur: 'plustern' },
        schuetteln:  { augen: 'zugekniffen', mund: 'gerade', figur: 'schuetteln' },
        wiedersehen: { schatten: 'klein', schwanz: 'freude', winkpfote: 'an', ohren: 'hoch',
                       augen: 'freude', wangen: 'gross', mund: 'lachen',
                       props: ['grossesherz'], blase: 'lara', figur: 'huepfen' },
        kitzeln:     { augen: 'zugekniffen', wangen: 'gross', mund: 'lachen',
                       props: ['kitzellinien'], blase: 'hihi', figur: 'wackeln' },
        gutenacht:   { schatten: 'nacht', schwanz: null, pfoten: null, ohren: 'nacht',
                       augen: 'zu', mund: 'gaehnen-gross', traene: 'klein', decke: 'hoch',
                       props: ['herz-klein', 'mond'] },
        blinzeln:    { augen: 'zu' }
    },

    // Diese Schlüssel sind keine SVG-Teile, sondern Bewegungs-Klassen
    BEWEGUNGEN: { kopf: true, figur: true },

    init: function () {
        this.svg = document.getElementById('leo');
        this.figur = document.getElementById('leo-figur');
        this.kopf = document.getElementById('kopf');

        // Alle Varianten einsammeln
        var alle = this.svg.querySelectorAll('[data-teil]');
        for (var i = 0; i < alle.length; i++) {
            var el = alle[i];
            var teil = el.getAttribute('data-teil');
            var variante = el.getAttribute('data-variante');
            if (!this.teile[teil]) this.teile[teil] = {};
            if (!this.teile[teil][variante]) this.teile[teil][variante] = [];
            this.teile[teil][variante].push(el);
        }
        this.zeigeZustand('zufrieden');
    },

    // Gesicht anwenden: pro Teil genau die gewünschte(n) Variante(n) zeigen
    setze: function (gesicht) {
        this.aktuellesGesicht = gesicht;
        for (var teil in this.teile) {
            var soll = gesicht[teil];
            var liste = Array.isArray(soll) ? soll : (soll ? [soll] : []);
            for (var variante in this.teile[teil]) {
                var sichtbar = liste.indexOf(variante) >= 0;
                var els = this.teile[teil][variante];
                for (var i = 0; i < els.length; i++) {
                    els[i].style.display = sichtbar ? '' : 'none';
                }
            }
        }
        // Bewegungs-Klassen setzen
        this.setzeBewegung(this.kopf, ['nicken', 'lehnen'], gesicht.kopf);
        this.setzeBewegung(this.figur, ['huepfen', 'wackeln', 'schuetteln', 'plustern', 'vibrieren'], gesicht.figur);
    },

    setzeBewegung: function (el, klassen, aktiv) {
        for (var i = 0; i < klassen.length; i++) el.classList.remove(klassen[i]);
        if (aktiv) {
            // Reflow erzwingen, damit dieselbe Animation erneut startet
            el.getBoundingClientRect();
            el.classList.add(aktiv);
        }
    },

    // Zustand = Basis-Gesicht + Abweichungen des Zustands
    zeigeZustand: function (name) {
        var g = this.mische(this.BASIS, this.ZUSTAENDE[name] || {});
        this.setze(g);
        this.matschZuruecksetzen();
    },

    // Reaktion = Basis + Zustands-Reste + Reaktions-Abweichungen.
    // Bei Reaktionen bleiben Matsch/Grummel des Zustands sichtbar,
    // damit z. B. ein schmutziger Leo beim Kitzeln schmutzig bleibt.
    zeigeReaktion: function (name, zustandName) {
        var zustand = this.ZUSTAENDE[zustandName] || {};
        var rest = {};
        if (zustand.matsch) rest.matsch = zustand.matsch;
        if (zustand.grummel && name !== 'danke' && name !== 'trinken') rest.grummel = zustand.grummel;
        var g = this.mische(this.mische(this.BASIS, rest), this.REAKTIONEN[name] || {});
        this.setze(g);
    },

    // Flache Mischung: rechts überschreibt links, null blendet ein Teil aus
    mische: function (a, b) {
        var g = {};
        for (var k in a) g[k] = a[k];
        for (var k2 in b) g[k2] = b[k2];
        return g;
    },

    // ---------- Matsch (Schmutzig) ----------

    // Die einzelnen Flecken werden beim Wischen ausgeblendet
    flecken: function () {
        return this.svg.querySelectorAll('.fleck');
    },

    matschZuruecksetzen: function () {
        var f = this.flecken();
        for (var i = 0; i < f.length; i++) f[i].style.display = '';
    },

    // Wie viele Flecken sind noch da?
    fleckenUebrig: function () {
        var f = this.flecken(), n = 0;
        for (var i = 0; i < f.length; i++) if (f[i].style.display !== 'none') n++;
        return n;
    },

    // Fleck unter einer Position (in Leo-SVG-Koordinaten) entfernen.
    // Gibt true zurück, wenn einer getroffen wurde.
    fleckWischen: function (lx, ly) {
        var f = this.flecken();
        for (var i = 0; i < f.length; i++) {
            if (f[i].style.display === 'none') continue;
            var cx = parseFloat(f[i].getAttribute('data-x'));
            var cy = parseFloat(f[i].getAttribute('data-y'));
            var dx = lx - cx, dy = ly - cy;
            if (dx * dx + dy * dy < 34 * 34) {
                f[i].style.display = 'none';
                return true;
            }
        }
        return false;
    },

    // Bühnen-Koordinaten → Leo-SVG-Koordinaten (viewBox 320 × 300)
    zuLeo: function (x, y) {
        return {
            x: (x - KONFIG.LEO.x) / KONFIG.LEO.faktor,
            y: (y - KONFIG.LEO.y) / KONFIG.LEO.faktor
        };
    },

    // Liegt der Punkt (Bühne) auf Leos Körper/Kopf?
    trifft: function (x, y) {
        var p = this.zuLeo(x, y);
        // Kopf (Kreis 160/150 r 84 + Ohren) oder Körper (Ellipse 160/240)
        var dk = (p.x - 160) * (p.x - 160) + (p.y - 140) * (p.y - 140);
        if (dk < 104 * 104) return true;
        var ex = (p.x - 160) / 80, ey = (p.y - 240) / 54;
        return ex * ex + ey * ey < 1;
    }
};
