// =====================================================
// Sanfte Hintergrundmusik + Umgebungsgeräusche – komplett
// über die Web Audio API erzeugt, keine Audiodateien nötig.
//
// Die Musik ist eine leise Harfen-Melodie: Pro "Stil" gibt
// es eine Akkordfolge und ein Zupf-Muster, das fortlaufend
// eingeplant wird (Lookahead-Scheduling). Jedes Level hat
// seine eigene Stimmung (game.js: musikStil).
//
// Umgebungsgeräusche: Regenrauschen im Gewitter, sanftes
// Blubbern unter Wasser.
//
// Der Ton-Knopf (🔊/M) schaltet Musik und Geräusche mit
// stumm – sie hängen an Sound.stumm.
// =====================================================

const Musik = {
    laeuft: false,
    stil: null,
    stilDaten: null,
    schritt: 0,          // Position im Zupf-Muster
    naechsteZeit: 0,     // AudioContext-Zeit des nächsten Tons
    timer: null,         // Interval für das Vorausplanen
    hauptGain: null,     // Master-Lautstärke der Musik
    ambienteKnoten: [],  // laufende Rausch-Quellen (Regen/Wasser)
    ambienteTimer: null, // Interval für Blubber-Bläschen

    // ---------- Die Musik-Stile ----------
    // schrittDauer = Sekunden pro Zupf-Schritt (8 Schritte pro Akkord)
    // akkorde      = Grundtöne der Akkordfolge (Hz)
    // intervalle   = Faktoren auf den Grundton (1 = Grundton, 1.5 = Quinte …)
    // muster       = welcher Intervall-Index pro Schritt gezupft wird (-1 = Pause)
    STILE: {
        wiese: {   // fröhlicher Tag auf der Wiese
            schrittDauer: 0.28, welle: 'triangle', lautstaerke: 0.045,
            akkorde: [262, 196, 220, 175],
            intervalle: [1, 1.25, 1.5, 2],
            muster: [0, 2, 1, 2, 3, 2, 1, -1]
        },
        nacht: {   // ruhige Sternennacht
            schrittDauer: 0.45, welle: 'sine', lautstaerke: 0.04,
            akkorde: [220, 175, 262, 196],
            intervalle: [1, 1.2, 1.5, 2],
            muster: [0, -1, 1, -1, 2, -1, 3, -1]
        },
        wasser: {  // träumerische Unterwasserwelt
            schrittDauer: 0.5, welle: 'sine', lautstaerke: 0.04,
            akkorde: [262, 165, 175, 196],
            intervalle: [1, 1.25, 1.5, 2],
            muster: [0, 1, 2, 3, 2, 1, 0, -1]
        },
        eis: {     // Glockenspiel im Schnee
            schrittDauer: 0.3, welle: 'sine', lautstaerke: 0.04,
            akkorde: [523, 392, 440, 349], // eine Oktave höher = glitzernd
            intervalle: [1, 1.25, 1.5, 2],
            muster: [0, -1, 2, -1, 1, -1, 3, -1]
        },
        sturm: {   // dunkel und spannend (Moll)
            schrittDauer: 0.5, welle: 'triangle', lautstaerke: 0.04,
            akkorde: [220, 175, 147, 165],
            intervalle: [1, 1.2, 1.5, 2],
            muster: [0, -1, -1, 1, -1, -1, 2, -1]
        },
        boss: {    // flotter Puls für die Boss-Kämpfe
            schrittDauer: 0.24, welle: 'triangle', lautstaerke: 0.045,
            akkorde: [147, 147, 175, 165],
            intervalle: [1, 1.2, 1.5, 2],
            muster: [0, 0, 2, 0, 1, 0, 2, 0]
        },
        fest: {    // Jubel! (nach Boss-Sieg + Finale)
            schrittDauer: 0.22, welle: 'triangle', lautstaerke: 0.05,
            akkorde: [262, 175, 196, 262],
            intervalle: [1, 1.25, 1.5, 2],
            muster: [0, 2, 3, 2, 0, 2, 3, 1]
        }
    },

    // Master-Gain anlegen, sobald der AudioContext existiert
    knotenSicherstellen() {
        if (!Sound.kontext) return false;
        if (!this.hauptGain) {
            this.hauptGain = Sound.kontext.createGain();
            this.hauptGain.gain.value = 1;
            this.hauptGain.connect(Sound.kontext.destination);
        }
        return true;
    },

    // Musik in einem Stil starten (läuft, bis stopp() kommt).
    // Ein erneuter Aufruf wechselt fließend den Stil.
    start(stil) {
        this.stil = stil;
        this.stilDaten = this.STILE[stil] || this.STILE.wiese;
        this.ambienteStoppen();

        if (!this.knotenSicherstellen()) return; // ohne AudioContext: still

        this.schritt = 0;
        this.naechsteZeit = Sound.kontext.currentTime + 0.1;
        this.laeuft = true;

        if (!this.timer) {
            this.timer = setInterval(() => this.planeVoraus(), 120);
        }

        // Passende Umgebungsgeräusche
        if (stil === 'sturm') this.regenAmbiente();
        if (stil === 'wasser') this.wasserAmbiente();
    },

    stopp() {
        this.laeuft = false;
        this.ambienteStoppen();
    },

    // Plant alle Töne der nächsten ~0,3 Sekunden ein
    planeVoraus() {
        if (!this.laeuft || !Sound.kontext) return;

        // Ton-Knopf (M/🔊) gilt auch für die Musik
        this.hauptGain.gain.value = Sound.stumm ? 0 : 1;

        const d = this.stilDaten;
        const gesamt = d.akkorde.length * 8;

        while (this.naechsteZeit < Sound.kontext.currentTime + 0.3) {
            const takt = Math.floor(this.schritt / 8);
            const pos = this.schritt % 8;
            const grundton = d.akkorde[takt];

            // Tiefer Basston am Taktanfang
            if (pos === 0) {
                this.ton(grundton / 2, d.schrittDauer * 7, 'sine', d.lautstaerke * 0.9, this.naechsteZeit);
            }

            // Gezupfte Melodie laut Muster (jeder 2. Takt eine Oktave höher)
            const idx = d.muster[pos];
            if (idx >= 0) {
                const oktave = (takt % 2 === 1) ? 2 : 1;
                this.ton(grundton * d.intervalle[idx] * oktave, d.schrittDauer * 1.6, d.welle, d.lautstaerke, this.naechsteZeit);
            }

            this.naechsteZeit += d.schrittDauer;
            this.schritt = (this.schritt + 1) % gesamt;
        }
    },

    // Einzelner Musik-Ton (wie Sound.ton, aber zu einer geplanten
    // Startzeit und über den Musik-Master-Gain)
    ton(frequenz, dauer, welle, lautstaerke, startZeit) {
        const ctx = Sound.kontext;
        const osc = ctx.createOscillator();
        const huelle = ctx.createGain();
        osc.type = welle;
        osc.frequency.setValueAtTime(frequenz, startZeit);
        huelle.gain.setValueAtTime(0, startZeit);
        huelle.gain.linearRampToValueAtTime(lautstaerke, startZeit + 0.02);
        huelle.gain.linearRampToValueAtTime(0, startZeit + dauer);
        osc.connect(huelle);
        huelle.connect(this.hauptGain);
        osc.start(startZeit);
        osc.stop(startZeit + dauer + 0.05);
    },

    // ---------- Umgebungsgeräusche ----------

    // Erzeugt eine leise, endlos laufende Rausch-Quelle
    // (tiefpass-gefiltert), z. B. für Regen oder Wasser.
    rauschen(filterFrequenz, lautstaerke) {
        const ctx = Sound.kontext;
        const laenge = ctx.sampleRate * 2;
        const puffer = ctx.createBuffer(1, laenge, ctx.sampleRate);
        const daten = puffer.getChannelData(0);
        for (let i = 0; i < laenge; i++) daten[i] = Math.random() * 2 - 1;

        const quelle = ctx.createBufferSource();
        quelle.buffer = puffer;
        quelle.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = filterFrequenz;

        const gain = ctx.createGain();
        gain.gain.value = lautstaerke;

        quelle.connect(filter);
        filter.connect(gain);
        gain.connect(this.hauptGain);
        quelle.start();

        this.ambienteKnoten.push(quelle);
        return gain;
    },

    // Gewitter-Level: gleichmäßiges Regenrauschen
    // (der Donner selbst grollt weiterhin bei jedem Blitz – audio.js)
    regenAmbiente() {
        this.rauschen(1400, 0.035);
    },

    // Unterwasser: dumpfes Wasserrauschen + ab und zu ein "Blub"
    wasserAmbiente() {
        this.rauschen(320, 0.05);
        this.ambienteTimer = setInterval(() => {
            if (!Sound.kontext || Sound.stumm || !this.laeuft) return;
            // kleines aufsteigendes Bläschen
            const start = Sound.kontext.currentTime;
            const f = 150 + Math.random() * 150;
            const osc = Sound.kontext.createOscillator();
            const huelle = Sound.kontext.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(f, start);
            osc.frequency.linearRampToValueAtTime(f * 2.4, start + 0.18);
            huelle.gain.setValueAtTime(0, start);
            huelle.gain.linearRampToValueAtTime(0.05, start + 0.03);
            huelle.gain.linearRampToValueAtTime(0, start + 0.2);
            osc.connect(huelle);
            huelle.connect(this.hauptGain);
            osc.start(start);
            osc.stop(start + 0.25);
        }, 1800 + Math.random() * 1500);
    },

    // Alle Umgebungsgeräusche beenden
    ambienteStoppen() {
        for (const quelle of this.ambienteKnoten) {
            try { quelle.stop(); } catch (e) { /* war schon beendet */ }
        }
        this.ambienteKnoten = [];
        if (this.ambienteTimer) {
            clearInterval(this.ambienteTimer);
            this.ambienteTimer = null;
        }
    }
};
