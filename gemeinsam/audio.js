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

    // ---------- Sounds für Leo Ella (und künftige Kuschel-Spiele) ----------

    // Leises, brummendes Schnurren – viele kurze, tiefe Pulse.
    // lautstaerke (optional, 0–1) – Leo schnurrt lauter, je gleichmäßiger
    // gestreichelt wird (Standard 0.09)
    schnurren(dauer, lautstaerke) {
        const n = Math.max(3, Math.round((dauer || 0.8) / 0.09));
        const l = lautstaerke === undefined ? 0.09 : lautstaerke;
        for (let i = 0; i < n; i++) {
            this.ton(96, 0.07, 'triangle', l, i * 0.09, 84);
        }
    },

    // Kleines „Hicks!" (Bäuerchen nach dem Essen)
    hicks() {
        this.ton(700, 0.06, 'square', 0.05, 0, 1100);
        this.ton(1100, 0.05, 'sine', 0.08, 0.05, 900);
    },

    // Freundliches „Mmh-mm" (Leo mag das gerade nicht)
    naa() {
        this.ton(330, 0.12, 'triangle', 0.09, 0, 300);
        this.ton(300, 0.16, 'triangle', 0.09, 0.15, 260);
    },

    // Schnüffeln – zwei kurze Luftzüge
    schnueffeln() {
        this.ton(1400, 0.05, 'triangle', 0.04, 0, 1800);
        this.ton(1500, 0.05, 'triangle', 0.04, 0.12, 1900);
    },

    // Ein Bissen: ein knackiger Plopp
    biss() {
        this.ton(240, 0.08, 'triangle', 0.13, 0, 110);
    },

    // Lampe klickt (an / aus)
    lampe(an) {
        this.ton(an ? 900 : 600, 0.05, 'square', 0.06, 0, an ? 1200 : 400);
    },

    // Vorhang rutscht über die Stange
    vorhang() {
        for (let i = 0; i < 5; i++) {
            this.ton(2400 + i * 150, 0.05, 'triangle', 0.025, i * 0.07, 2000);
        }
    },

    // Wasser plätschert in kleinen Schlucken (Trinken aus der Flasche)
    schluck() {
        this.ton(360, 0.09, 'sine', 0.09, 0, 720);
    },

    // Kicherndes Auf und Ab beim Kitzeln
    kichern() {
        const toene = [880, 1108, 932, 1175, 988, 1318];
        toene.forEach((f, i) => this.ton(f, 0.06, 'sine', 0.11, i * 0.075));
    },

    // Herzhaftes Gähnen: langsamer Gleitton nach unten
    gaehnen() {
        this.ton(420, 0.7, 'sine', 0.11, 0, 210);
        this.ton(630, 0.5, 'triangle', 0.04, 0.05, 320);
    },

    // Schmatzen beim Essen – drei weiche, tiefe Plopps
    schmatzen() {
        for (let i = 0; i < 3; i++) {
            this.ton(190, 0.07, 'triangle', 0.12, i * 0.17, 120);
        }
    },

    // Blubbern beim Trinken
    blubbern() {
        for (let i = 0; i < 4; i++) {
            this.ton(300 + i * 60, 0.09, 'sine', 0.09, i * 0.12, 600 + i * 60);
        }
    },

    // Weicher Platscher (Wasser, Schwamm)
    platsch() {
        this.ton(520, 0.12, 'triangle', 0.10, 0, 160);
        this.ton(900, 0.06, 'sine', 0.06, 0.03, 300);
    },

    // Kleines Schlaflied-Motiv beim Zudecken
    schlaflied() {
        const melodie = [523, 494, 440, 392];
        melodie.forEach((f, i) => this.ton(f, 0.35, 'sine', 0.12, i * 0.32));
    },

    // Fröhliches Aufwach-Motiv am Morgen
    morgen() {
        const melodie = [523, 659, 784, 1046];
        melodie.forEach((f, i) => this.ton(f, 0.16, 'sine', 0.14, i * 0.13));
    },

    // Kurzes, fragendes „Mrrp?" – wenn Leo angetippt wird
    mrrp() {
        this.ton(520, 0.14, 'triangle', 0.09, 0, 780);
    },

    // ---------- Baden (Leo Ella) ----------

    // Wasser rauscht in die Wanne: schnelle, aufsteigende Plinks
    // (mehrfach aufrufen, solange es läuft)
    wasserlauf() {
        for (let i = 0; i < 6; i++) {
            this.ton(500 + i * 70 + Math.random() * 80, 0.07, 'sine', 0.05, i * 0.09, 700 + i * 60);
        }
    },

    // Seifenflasche quietscht beim Drücken
    quietsch() {
        this.ton(700, 0.12, 'sine', 0.07, 0, 1300);
    },

    // Hatschi! – kurzes Hochziehen, dann ein Platzer nach unten
    niesen() {
        this.ton(600, 0.16, 'triangle', 0.06, 0, 900);
        this.ton(1000, 0.18, 'square', 0.07, 0.18, 250);
    },

    // Duschregen: leises Prasseln
    dusche() {
        for (let i = 0; i < 5; i++) {
            this.ton(1500 + Math.random() * 900, 0.04, 'sine', 0.025, i * 0.06);
        }
    },

    // Föhn brummt warm (mehrfach aufrufen, solange er läuft)
    foehn() {
        this.ton(130, 0.45, 'triangle', 0.045, 0, 140);
        this.ton(262, 0.45, 'sine', 0.02, 0, 280);
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
