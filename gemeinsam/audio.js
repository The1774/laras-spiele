// =====================================================
// Gemeinsamer Sound für alle Spiele – Web Audio API.
// Kurze, fröhliche, synthetische Töne, keine Audiodateien nötig.
//
// Ursprünglich aus der Zauberwiese; jetzt in gemeinsam/, damit
// Hub und alle Spiele dieselben Sounds und denselben Ton-Knopf-
// Zustand haben. Stumm-Zustand liegt unter "hub.stumm" (siehe
// speicher.js) – einmal stumm, überall stumm.
//
// Einbinden (klassische Script-Tags, in dieser Reihenfolge):
//     <script src="../gemeinsam/speicher.js"></script>
//     <script src="../gemeinsam/audio.js"></script>
// =====================================================

const Sound = {
    kontext: null,
    stumm: false,

    // Ablage für den gemeinsamen Stumm-Zustand (Präfix "hub.")
    ablage: (typeof Speicher !== 'undefined') ? Speicher.fuer('hub') : null,

    // Der AudioContext darf erst nach der ersten
    // Nutzer-Interaktion gestartet werden (Browser-Vorgabe).
    // Wird deshalb bei jedem Klick/Tastendruck aufgerufen.
    init() {
        if (!this.kontext) {
            const AC = window.AudioContext || window.webkitAudioContext;
            if (AC) this.kontext = new AC();
        }
        if (this.kontext && this.kontext.state === 'suspended') {
            this.kontext.resume();
        }
    },

    // Einen einzelnen Ton abspielen.
    // zielFrequenz (optional) lässt den Ton gleiten (z. B. beim Springen).
    ton(frequenz, dauer, wellenform, lautstaerke, verzoegerung, zielFrequenz) {
        if (this.stumm || !this.kontext) return;
        const start = this.kontext.currentTime + (verzoegerung || 0);

        const oszillator = this.kontext.createOscillator();
        const huelle = this.kontext.createGain();

        oszillator.type = wellenform || 'sine';
        oszillator.frequency.setValueAtTime(frequenz, start);
        if (zielFrequenz) {
            oszillator.frequency.linearRampToValueAtTime(zielFrequenz, start + dauer);
        }

        // Sanftes Ein- und Ausblenden, damit nichts "knackt"
        huelle.gain.setValueAtTime(0, start);
        huelle.gain.linearRampToValueAtTime(lautstaerke, start + 0.015);
        huelle.gain.linearRampToValueAtTime(0, start + dauer);

        oszillator.connect(huelle);
        huelle.connect(this.kontext.destination);
        oszillator.start(start);
        oszillator.stop(start + dauer + 0.05);
    },

    // ---------- Die einzelnen Spiel-Sounds ----------

    // Fröhliches "Pling" beim Blumen-Sammeln (und beim Antippen einer Hub-Kachel)
    sammeln() {
        this.ton(880, 0.09, 'sine', 0.18);
        this.ton(1318, 0.14, 'sine', 0.16, 0.07);
    },

    // Heller Stern-Sound
    stern() {
        this.ton(1046, 0.08, 'sine', 0.16);
        this.ton(1318, 0.08, 'sine', 0.16, 0.06);
        this.ton(1568, 0.16, 'sine', 0.16, 0.12);
    },

    // Kleiner "Wuiii"-Gleitton beim Springen
    sprung() {
        this.ton(330, 0.18, 'sine', 0.12, 0, 660);
    },

    // Weicher, NICHT gruseliger Ton beim Treffer
    treffer() {
        this.ton(260, 0.15, 'triangle', 0.14, 0, 180);
    },

    // Kurzes "Hopp" – ein Werfer-Gegner schleudert einen Matschball
    wurf() {
        this.ton(300, 0.12, 'triangle', 0.08, 0, 520);
    },

    // Funkelnde Aufwärts-Melodie, wenn ein Freund aus der
    // Zauberblase befreit wird (mit "Plopp" der Blase davor)
    rettung() {
        this.ton(520, 0.06, 'triangle', 0.14, 0, 300); // die Blase ploppt
        this.ton(784, 0.09, 'sine', 0.16, 0.06);
        this.ton(988, 0.09, 'sine', 0.16, 0.14);
        this.ton(1175, 0.09, 'sine', 0.16, 0.22);
        this.ton(1568, 0.24, 'sine', 0.18, 0.30);
    },

    // Warmes Glöckchen beim Extraherz
    extraherz() {
        this.ton(660, 0.1, 'sine', 0.16);
        this.ton(880, 0.1, 'sine', 0.16, 0.09);
        this.ton(1108, 0.2, 'sine', 0.16, 0.18);
    },

    // Heller "Pjuu"-Gleitton, wenn ein Regenbogen-Strahl aus dem Horn schießt
    strahl() {
        this.ton(700, 0.14, 'triangle', 0.12, 0, 1400);
        this.ton(1568, 0.1, 'sine', 0.08, 0.02);
    },

    // Weicher, fröhlicher "Plopp", wenn ein Strahl die Grummelwolke trifft
    bossTreffer() {
        this.ton(523, 0.08, 'sine', 0.16);
        this.ton(784, 0.14, 'sine', 0.15, 0.05);
    },

    // Heller Aufstieg, wenn Bella einen Energie-Funken einfängt
    energie() {
        this.ton(880, 0.07, 'sine', 0.15);
        this.ton(1175, 0.12, 'sine', 0.15, 0.06);
    },

    // Leises "Pfft" – Bella drückt, hat aber keine Energie zum Schießen
    leer() {
        this.ton(220, 0.1, 'triangle', 0.06, 0, 150);
    },

    // Tiefes Donnergrollen – kräftig genug zum Hören,
    // aber absichtlich weich, nicht erschreckend
    donner() {
        this.ton(140, 0.6, 'triangle', 0.16, 0.0, 70);
        this.ton(90, 1.0, 'sine', 0.14, 0.05, 45);
        this.ton(190, 0.4, 'triangle', 0.09, 0.0, 110);
        this.ton(60, 0.9, 'sine', 0.10, 0.25, 40); // langes Nachgrollen
    },

    // Kleine Sieges-Melodie am Regenbogen
    sieg() {
        const melodie = [523, 659, 784, 1046, 784, 1046];
        melodie.forEach((freq, i) => {
            this.ton(freq, 0.18, 'sine', 0.16, i * 0.14);
        });
    },

    // Dezentes Klicken für Menü-Knöpfe
    klick() {
        this.ton(600, 0.06, 'sine', 0.1);
    },

    // ---------- Stumm-Zustand (gemeinsam für alle Spiele) ----------

    // Ton an/aus – gibt den neuen Zustand zurück und merkt ihn sich
    // unter "hub.stumm", damit er im Hub und in jedem Spiel gleich ist
    stummUmschalten() {
        this.stumm = !this.stumm;
        if (this.ablage) this.ablage.set('stumm', this.stumm);
        return this.stumm;
    }
};

// Gespeicherten Stumm-Zustand beim Laden übernehmen
if (Sound.ablage) Sound.stumm = !!Sound.ablage.get('stumm', false);
