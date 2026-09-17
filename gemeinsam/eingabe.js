// =====================================================
// Gemeinsame Eingabe: Pointer Events für Tablet (Finger),
// Desktop (Maus) und Stift – tippen, ziehen, wischen.
//
// Alle Positionen kommen in Bühnen-Koordinaten (siehe skalierung.js),
// damit die Spiellogik nichts vom Zoom-Faktor wissen muss.
//
// Verwendung:
//     Eingabe.init(document.getElementById('buehne'), {
//         beiTippen:  function (x, y) {},
//         beiZiehen:  function (x, y, startX, startY, phase) {}, // 'start' | 'bewegt' | 'ende'
//         beiWischen: function (richtung, startX, startY) {}    // 'links' | 'rechts' | 'oben' | 'unten'
//     });
//     Eingabe.aktiv   // true, solange ein Finger/Maus gedrückt ist
//     Eingabe.x, Eingabe.y   // letzte Position in Bühnen-Koordinaten
//
// Die erste Berührung weckt außerdem den AudioContext (Sound.init),
// weil Browser Ton erst nach einer Nutzer-Interaktion erlauben.
//
// Die Zauberwiese behält ihr eigenes js/input.js (Tastatur + Touch-
// Knöpfe) und lädt diese Datei nicht.
// =====================================================

var Eingabe = {
    aktiv: false,
    x: 0,
    y: 0,

    // Ab dieser Bewegung (in Bühnen-Pixeln) wird aus einem Tipp ein Ziehen
    ZIEH_SCHWELLE: 8,
    // Ein Wischen ist ein schnelles, weites Ziehen
    WISCH_STRECKE: 60,
    WISCH_ZEIT_MS: 300,
    // Länger gedrückt als das ist kein Tipp mehr
    TIPP_ZEIT_MS: 400,

    init: function (element, rueckrufe) {
        var self = this;
        var r = rueckrufe || {};
        var pointerId = null;
        var startX = 0, startY = 0, startZeit = 0;
        var zieht = false;

        function position(e) {
            if (typeof Skalierung !== 'undefined' && Skalierung.element) {
                return Skalierung.zuBuehne(e.clientX, e.clientY);
            }
            return { x: e.clientX, y: e.clientY };
        }

        element.addEventListener('pointerdown', function (e) {
            if (pointerId !== null) return;          // nur ein Finger zählt
            // Knöpfe und Links regeln sich selbst (click) – sonst würde das
            // Pointer-Capture der Bühne ihre Klicks schlucken
            if (e.target.closest && e.target.closest("button, a")) return;
            pointerId = e.pointerId;
            if (typeof Sound !== 'undefined') Sound.init();

            var p = position(e);
            startX = self.x = p.x;
            startY = self.y = p.y;
            startZeit = performance.now();
            zieht = false;
            self.aktiv = true;
            try { element.setPointerCapture(e.pointerId); } catch (err) { /* egal */ }
        });

        element.addEventListener('pointermove', function (e) {
            if (e.pointerId !== pointerId) return;
            var p = position(e);
            self.x = p.x;
            self.y = p.y;
            if (!zieht) {
                var dx = p.x - startX, dy = p.y - startY;
                if (dx * dx + dy * dy < self.ZIEH_SCHWELLE * self.ZIEH_SCHWELLE) return;
                zieht = true;
                if (r.beiZiehen) r.beiZiehen(p.x, p.y, startX, startY, 'start');
            }
            if (r.beiZiehen) r.beiZiehen(p.x, p.y, startX, startY, 'bewegt');
        });

        function loslassen(e, abgebrochen) {
            if (e.pointerId !== pointerId) return;
            pointerId = null;
            self.aktiv = false;
            var p = position(e);
            var dauer = performance.now() - startZeit;
            var dx = p.x - startX, dy = p.y - startY;

            if (abgebrochen) {
                if (zieht && r.beiZiehen) r.beiZiehen(p.x, p.y, startX, startY, 'ende');
                return;
            }

            if (!zieht) {
                if (dauer <= self.TIPP_ZEIT_MS && r.beiTippen) r.beiTippen(p.x, p.y);
                return;
            }

            // Schnell und weit → Wischen, sonst normales Zieh-Ende
            var strecke = Math.sqrt(dx * dx + dy * dy);
            if (dauer <= self.WISCH_ZEIT_MS && strecke >= self.WISCH_STRECKE && r.beiWischen) {
                var richtung;
                if (Math.abs(dx) > Math.abs(dy)) richtung = dx > 0 ? 'rechts' : 'links';
                else richtung = dy > 0 ? 'unten' : 'oben';
                r.beiWischen(richtung, startX, startY);
            }
            if (r.beiZiehen) r.beiZiehen(p.x, p.y, startX, startY, 'ende');
        }

        element.addEventListener('pointerup', function (e) { loslassen(e, false); });
        element.addEventListener('pointercancel', function (e) { loslassen(e, true); });

        // Kein Kontextmenü bei langem Drücken auf dem Tablet
        element.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    }
};
