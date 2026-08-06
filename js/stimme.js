// =====================================================
// Stimmen über die Web Speech API (speechSynthesis):
// Die Figuren sprechen wirklich – ohne Audiodateien und
// ohne Internet. Jede Figur bekommt über Tonhöhe (pitch)
// und Tempo (rate) ihren eigenen Klang.
//
// EIGENE AUFNAHMEN: Wer mag, kann Sätze selbst einsprechen!
// Einfach MP3-Dateien in den Ordner "audio/" legen (z. B.
// audio/geschichte-blumenwiese.mp3) und unten
// EIGENE_AUFNAHMEN auf true stellen. Vorhandene Aufnahmen
// werden dann bevorzugt, für alles andere spricht die
// Browser-Stimme weiter.
// =====================================================

const Stimme = {
    aus: false,        // per Knopf (🗣️) abschaltbar, wird gespeichert
    stimme: null,      // die gewählte deutsche Browser-Stimme
    bereit: false,
    aktuellesAudio: null, // gerade laufende eigene Aufnahme
    aktuellerSatz: null,  // Referenz auf den laufenden Satz (gegen Chrome-GC-Bug)
    startetGleich: false, // Satz ist eingeplant, aber noch nicht gestartet
    wachhalter: null,     // Timer gegen Chromes 15-Sekunden-Abbruch

    EIGENE_AUFNAHMEN: false, // true, sobald MP3s im Ordner "audio/" liegen

    // Stimmprofile der Figuren: pitch = Tonhöhe, rate = Tempo
    FIGUREN: {
        erzaehler: { pitch: 1.0, rate: 0.95 }, // ruhige Vorlese-Stimme
        lara:      { pitch: 1.4, rate: 1.0  }, // helles Mädchen
        fohlen:    { pitch: 1.6, rate: 1.05 }, // piepsige Einhorn-Fohlen
        freund:    { pitch: 1.5, rate: 1.05 }, // die kleinen Tier-Freunde
        biene:     { pitch: 0.9, rate: 1.15 }, // flott und brummig
        wolke:     { pitch: 0.6, rate: 0.85 }, // tief und grummelig
        krake:     { pitch: 0.5, rate: 0.8  }  // noch tiefer, blubberig
    },

    // Wie Sound.init: braucht eine erste Nutzer-Interaktion.
    // Sucht die beste deutsche Stimme aus (auf dem iPad z. B. "Anna").
    init() {
        if (this.bereit || !window.speechSynthesis) return;
        this.bereit = true;

        const waehleStimme = () => {
            const alle = speechSynthesis.getVoices();
            if (!alle.length) return;
            const deutsche = alle.filter(function (s) { return s.lang && s.lang.indexOf('de') === 0; });
            // Bevorzugt "Anna" (iPad/Mac), sonst die erste deutsche Stimme
            this.stimme = deutsche.find(function (s) { return /anna/i.test(s.name); })
                || deutsche[0]
                || null;
        };

        waehleStimme();
        // Manche Browser laden die Stimmen erst verzögert
        if (speechSynthesis.onvoiceschanged !== undefined) {
            speechSynthesis.onvoiceschanged = waehleStimme;
        }

        // Chrome-Bugfix: Chrome (Desktop) bricht längere Sätze nach
        // ~15 Sekunden einfach ab. Ein regelmäßiges pause()+resume()
        // hält die Sprachausgabe wach; anderen Browsern schadet es nicht.
        this.wachhalter = setInterval(function () {
            if (window.speechSynthesis && speechSynthesis.speaking && !speechSynthesis.paused) {
                speechSynthesis.pause();
                speechSynthesis.resume();
            }
        }, 8000);
    },

    // HTML-Tags und Emojis entfernen, damit die Stimme nicht
    // "Regenbogen-Emoji" vorliest
    aufraeumen(text) {
        return String(text)
            .replace(/<br\s*\/?>/gi, ' ')
            .replace(/<[^>]+>/g, '')
            .replace(/[\p{Extended_Pictographic}\u{FE0F}\u{200D}]/gu, '')
            .replace(/\s+/g, ' ')
            .trim();
    },

    // Einen Satz sprechen.
    //   figur     = Schlüssel aus FIGUREN (bestimmt den Klang)
    //   schluessel (optional) = Dateiname für eine eigene Aufnahme
    sprich(text, figur, schluessel) {
        if (this.aus) return;

        // Eigene Aufnahme bevorzugen (falls aktiviert)
        if (this.EIGENE_AUFNAHMEN && schluessel && typeof Audio !== 'undefined') {
            this.stopp();
            let ersatzLaeuft = false;
            const ersatz = () => {
                if (!ersatzLaeuft) { ersatzLaeuft = true; this.sprichBrowser(text, figur); }
            };
            const audio = new Audio('audio/' + schluessel + '.mp3');
            this.aktuellesAudio = audio;
            audio.onerror = ersatz;
            audio.play().catch(ersatz);
            return;
        }

        this.stopp();
        this.sprichBrowser(text, figur);
    },

    // Die eigentliche Browser-Sprachausgabe
    sprichBrowser(text, figur) {
        if (!window.speechSynthesis) return;
        const satz = new SpeechSynthesisUtterance(this.aufraeumen(text));
        const profil = this.FIGUREN[figur] || this.FIGUREN.erzaehler;
        satz.pitch = profil.pitch;
        satz.rate = profil.rate;
        satz.lang = 'de-DE';
        if (this.stimme) satz.voice = this.stimme;

        // Referenz behalten, sonst verstummt der Satz mitten im
        // Vorlesen, sobald Chromes Speicher-Aufräumer ihn einsammelt
        this.aktuellerSatz = satz;
        const fertig = () => {
            if (this.aktuellerSatz === satz) this.aktuellerSatz = null;
        };
        satz.onend = fertig;
        satz.onerror = fertig;

        // Kurz warten: speak() direkt nach cancel() geht in Chrome
        // manchmal verloren
        this.startetGleich = true;
        setTimeout(() => {
            if (this.aktuellerSatz === satz) {
                this.startetGleich = false;
                speechSynthesis.speak(satz);
            }
        }, 60);
    },

    // Wird gerade gesprochen (oder startet gleich ein Satz)?
    // Das Intro wartet damit, bis der Erzähler fertig ist.
    sprichtGerade() {
        if (this.startetGleich) return true;
        if (this.aktuellesAudio && !this.aktuellesAudio.ended && !this.aktuellesAudio.paused) return true;
        return !!(window.speechSynthesis && (speechSynthesis.speaking || speechSynthesis.pending));
    },

    // Laufende Sprache sofort beenden (z. B. beim Level-Start)
    stopp() {
        this.aktuellerSatz = null;   // verhindert auch verzögerte Starts
        this.startetGleich = false;
        if (window.speechSynthesis) speechSynthesis.cancel();
        if (this.aktuellesAudio) {
            this.aktuellesAudio.pause();
            this.aktuellesAudio = null;
        }
    },

    // Stimmen an/aus – gibt den neuen Zustand zurück
    stummUmschalten() {
        this.aus = !this.aus;
        if (this.aus) this.stopp();
        return this.aus;
    }
};
