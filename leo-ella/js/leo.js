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
    waescht: false,     // beim Baden bleiben weggewischte Flecken weg, auch wenn der Zustand neu gezeigt wird

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
        blinzeln:    { augen: 'zu' },

        // ----- Füttern (Gegenstand am Maul) -----
        // Etwas kommt näher: Maul auf, große Augen
        naeh:        { augen: 'gross', mund: 'offen' },
        // Erst mal schnuppern (Apfel)
        schnuppern:  { augen: 'seitlich', mund: 'zick', kopf: 'schnuppern' },
        // Ein Bissen: Augen zu, kauen, Kopf nickt einmal
        kauen:       { augen: 'zugekniffen', wangen: 'gross', mund: 'kauen', kopf: 'kauen' },
        // Aufgegessen – ganz normal lecker
        satt:        { augen: 'lachen', wangen: 'gross', mund: 'lachen', props: ['herzen'], kopf: 'nicken' },
        // Aufgegessen – das Lieblingsessen!
        lecker:      { augen: 'herz', wangen: 'gross', mund: 'lachen', schwanz: 'herz',
                       props: ['herzen', 'funkeln'], kopf: 'nicken', figur: 'huepfen' },
        // „Mmh-mm" – Leo mag das gerade nicht (zu satt / Keks)
        naa:         { augen: 'seitlich', mund: 'gerade', kopf: 'wegdrehen' },
        // Bäuerchen
        baeuerchen:  { augen: 'zugekniffen', wangen: 'gross', mund: 'klein', figur: 'hicks' },
        // Trinken aus der Flasche (solange sie gehalten wird)
        trinkt:      { augen: 'zu', wangen: 'gross', mund: 'zunge' },
        // Maul ablecken nach dem Trinken
        lecken:      { augen: 'lachen', mund: 'zunge', kopf: 'nicken' },

        // Die Decke kommt näher: Leo wird schon schläfrig
        schlaefrig:  { ohren: 'unten', augen: 'muede', mund: 'gaehnen' },

        // ----- Streichel-Zonen (solange der Finger streicht) -----
        kinn:        { augen: 'zu', wangen: 'gross', mund: 'lachen', schwanz: 'herz',
                       props: ['vibration'], kopf: 'heben', figur: 'vibrieren' },
        ohr:         { augen: 'zugekniffen', mund: 'klein', kopf: 'ohrzucken' },
        ruecken:     { augen: 'lachen', wangen: 'gross', mund: 'lachen', schwanz: 'freude',
                       props: ['vibration'], figur: 'welle' },
        bauch:       { augen: 'lachen', wangen: 'gross', mund: 'lachen', schwanz: 'herz',
                       pfoten: 'hoch', figur: 'zurueck' },
        pfote:       { augen: 'zugekniffen', wangen: 'gross', mund: 'lachen',
                       props: ['kitzellinien'], figur: 'wackeln' },

        // ----- Baden -----
        // Die Wanne ist da: Freudenhüpfer hinein
        badefreude:  { augen: 'freude', wangen: 'gross', mund: 'lachen', schwanz: 'freude', figur: 'huepfen' },
        // Große Augen: das Wasser läuft, die Seife kommt
        neugierig:   { augen: 'gross', mund: 'klein' },
        // Die Wanne ist voll: Pfote patscht ins Wasser
        planschen:   { augen: 'lachen', wangen: 'gross', mund: 'lachen', pfoten: 'plansch' },
        // Hatschi! – der Schaum kitzelt in der Nase
        niesen:      { augen: 'zugekniffen', mund: 'offen', blase: 'hatschi', figur: 'schuetteln' },
        // Unter der Dusche: Augen zu, Ohren hängen
        dusche:      { ohren: 'unten', augen: 'zugekniffen', mund: 'klein' },
        // Nass und wartend auf den Föhn
        nass:        { ohren: 'unten', augen: 'gross', mund: 'klein' },
        // Im warmen Föhnwind: Ohren hoch, alles flattert
        foehn:       { ohren: 'hoch', augen: 'zugekniffen', wangen: 'gross', mund: 'lachen', figur: 'flattern' }
    },

    // Diese Schlüssel sind keine SVG-Teile, sondern Bewegungs-Klassen
    BEWEGUNGEN: { kopf: true, figur: true },
    KOPF_KLASSEN:  ['nicken', 'lehnen', 'heben', 'ohrzucken', 'wegdrehen', 'schnuppern', 'kauen'],
    FIGUR_KLASSEN: ['huepfen', 'wackeln', 'schuetteln', 'plustern', 'vibrieren', 'welle', 'zurueck', 'hicks', 'flattern'],

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
        this.setzeBewegung(this.kopf, this.KOPF_KLASSEN, gesicht.kopf);
        this.setzeBewegung(this.figur, this.FIGUR_KLASSEN, gesicht.figur);
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
        if (!this.waescht) this.matschZuruecksetzen();
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
    fleckWischen: function (lx, ly, radius) {
        var r = radius || 34;
        return this.fleckEntfernen(function (cx, cy) {
            var dx = lx - cx, dy = ly - cy;
            return dx * dx + dy * dy < r * r;
        });
    },

    // Fleck im Duschregen entfernen: alles, was unterhalb von lyAb liegt und
    // seitlich höchstens halbeBreite von lx entfernt ist (Leo-Koordinaten)
    fleckSpuelen: function (lx, lyAb, halbeBreite) {
        return this.fleckEntfernen(function (cx, cy) {
            return Math.abs(cx - lx) < halbeBreite && cy > lyAb;
        });
    },

    // Den ersten sichtbaren Fleck ausblenden, auf den `trifft(cx, cy)` zutrifft
    fleckEntfernen: function (trifft) {
        var f = this.flecken();
        for (var i = 0; i < f.length; i++) {
            if (f[i].style.display === 'none') continue;
            var cx = parseFloat(f[i].getAttribute('data-x'));
            var cy = parseFloat(f[i].getAttribute('data-y'));
            if (trifft(cx, cy)) {
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

    // Leo-SVG-Koordinaten → Bühne
    zuBuehne: function (lx, ly) {
        return {
            x: KONFIG.LEO.x + lx * KONFIG.LEO.faktor,
            y: KONFIG.LEO.y + ly * KONFIG.LEO.faktor
        };
    },

    // Leos Maul auf der Bühne (Ziel fürs Futter)
    maulPosition: function () { return this.zuBuehne(160, 190); },

    // Liegt der Punkt (Bühne) auf Leos Körper/Kopf?
    trifft: function (x, y) {
        return this.zone(x, y) !== null;
    },

    // ---------- Körperzonen ----------

    // Welche Zone liegt unter dem Punkt (Bühne)?
    //   'ohr' | 'kinn' | 'kopf' | 'pfote' | 'bauch' | 'ruecken' | null
    // Reihenfolge = Priorität: kleine Zonen zuerst, damit sie nicht vom Kopf-
    // Kreis oder der Körper-Ellipse verdeckt werden.
    zone: function (x, y) {
        var p = this.zuLeo(x, y);
        function inKreis(cx, cy, r) {
            var dx = p.x - cx, dy = p.y - cy;
            return dx * dx + dy * dy < r * r;
        }
        function inEllipse(cx, cy, rx, ry) {
            var ex = (p.x - cx) / rx, ey = (p.y - cy) / ry;
            return ex * ex + ey * ey < 1;
        }
        if (inKreis(100, 86, 36) || inKreis(220, 86, 36)) return 'ohr';
        if (inEllipse(160, 196, 44, 30)) return 'kinn';           // Schnauze + Kinn
        if (inKreis(160, 150, 88)) return 'kopf';
        if (inEllipse(126, 276, 24, 15) || inEllipse(194, 276, 24, 15)) return 'pfote';
        if (inEllipse(160, 250, 40, 27)) return 'bauch';          // heller Bauch
        if (inEllipse(160, 240, 76, 50)) return 'ruecken';
        return null;
    },

    // ---------- Blick: Augen und Kopf folgen einem Punkt ----------

    // x/y in Bühnen-Koordinaten; null = geradeaus schauen.
    // Die Pupillen (Gruppen .pupille) rutschen ein Stück Richtung Ziel,
    // der Kopf neigt sich leicht zur Seite.
    schauZu: function (x, y) {
        var pupillen = this.svg.querySelectorAll('.pupille');
        var tx = 0, ty = 0, neigung = 0;
        if (x !== null && x !== undefined) {
            var auge = this.zuBuehne(160, 146);
            var dx = x - auge.x, dy = y - auge.y;
            var l = Math.sqrt(dx * dx + dy * dy) || 1;
            var staerke = Math.min(1, l / 260);
            tx = dx / l * 7 * staerke;
            ty = dy / l * 6 * staerke;
            neigung = Math.max(-9, Math.min(9, dx / 30));
        }
        for (var i = 0; i < pupillen.length; i++) {
            pupillen[i].style.transform = 'translate(' + tx.toFixed(1) + 'px, ' + ty.toFixed(1) + 'px)';
        }
        this.kopf.style.transform = neigung ? 'rotate(' + neigung.toFixed(1) + 'deg)' : '';
    }
};
