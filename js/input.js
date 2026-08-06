// =====================================================
// Eingabe: Tastatur (Desktop) + Touch-Knöpfe (Tablet).
// Die Touch-Knöpfe werden nur auf Touch-Geräten gezeigt.
// =====================================================

const Eingabe = {
    links: false,
    rechts: false,
    springen: false,

    // Erkennen, ob wir auf einem Touch-Gerät sind
    istTouchGeraet: ('ontouchstart' in window) || navigator.maxTouchPoints > 0,

    // rueckrufe = { beiPause: fn, beiStumm: fn, beiStimme: fn } – kommt aus game.js
    init(rueckrufe) {

        // ---------- Tastatur ----------
        window.addEventListener('keydown', (e) => {
            Sound.init();  // AudioContext braucht eine Nutzer-Interaktion
            Stimme.init(); // ebenso die Sprachausgabe

            switch (e.key) {
                case 'ArrowLeft':  this.links = true;  e.preventDefault(); break;
                case 'ArrowRight': this.rechts = true; e.preventDefault(); break;
                case 'ArrowUp':
                case ' ':          this.springen = true; e.preventDefault(); break;
                case 'p': case 'P': rueckrufe.beiPause(); break;
                case 'm': case 'M': rueckrufe.beiStumm(); break;
                case 's': case 'S': rueckrufe.beiStimme(); break;
            }
        });

        window.addEventListener('keyup', (e) => {
            switch (e.key) {
                case 'ArrowLeft':  this.links = false;  break;
                case 'ArrowRight': this.rechts = false; break;
                case 'ArrowUp':
                case ' ':          this.springen = false; break;
            }
        });

        // ---------- Touch-Knöpfe ----------
        if (this.istTouchGeraet) {
            document.getElementById('touch-steuerung').classList.add('aktiv');
            this.bindeTouchKnopf('touch-links',  (an) => { this.links = an; });
            this.bindeTouchKnopf('touch-rechts', (an) => { this.rechts = an; });
            this.bindeTouchKnopf('touch-sprung', (an) => { this.springen = an; });
        }
    },

    // Einen Touch-Knopf so verdrahten, dass "gedrückt halten"
    // funktioniert und kein Kontextmenü/Scrollen stört.
    bindeTouchKnopf(id, setze) {
        const knopf = document.getElementById(id);

        const runter = (e) => { e.preventDefault(); Sound.init(); Stimme.init(); setze(true); };
        const hoch = (e) => { e.preventDefault(); setze(false); };

        knopf.addEventListener('pointerdown', runter);
        knopf.addEventListener('pointerup', hoch);
        knopf.addEventListener('pointercancel', hoch);
        knopf.addEventListener('pointerleave', hoch);
        knopf.addEventListener('contextmenu', (e) => e.preventDefault());
    }
};
