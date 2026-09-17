// =====================================================
// Startbildschirm (Hub) von „Laras Spiele"
//
// - skaliert die feste Bühne (1024 × 768) auf den Bildschirm
// - Ton-Knopf: Stumm-Zustand unter "hub.stumm" – gilt für alle Spiele
// - Kachel tippen: eindrücken, kurzer Pling, dann Wechsel zum Spiel
//
// Keine ES-Module, damit alles per Doppelklick (file://) läuft.
// =====================================================

(function () {
    'use strict';

    // ---------- Skalierung ----------

    var BREITE = 1024;
    var HOEHE = 768;

    function skaliere() {
        var faktor = Math.min(window.innerWidth / BREITE, window.innerHeight / HOEHE);
        document.getElementById('buehne').style.transform = 'scale(' + faktor + ')';
    }

    // ---------- Ton ----------

    var STUMM_SCHLUESSEL = 'hub.stumm';
    var stumm = false;
    var kontext = null;

    // Stumm-Zustand lesen (localStorage kann blockiert sein → try/catch)
    try {
        stumm = localStorage.getItem(STUMM_SCHLUESSEL) === '1';
    } catch (e) { /* dann eben nicht stumm */ }

    // Der AudioContext darf erst nach der ersten Nutzer-Interaktion
    // gestartet werden (Browser-Vorgabe).
    function audioInit() {
        if (!kontext) {
            var AC = window.AudioContext || window.webkitAudioContext;
            if (AC) kontext = new AC();
        }
        if (kontext && kontext.state === 'suspended') kontext.resume();
    }

    // Ein einzelner weicher Ton
    function ton(frequenz, dauer, lautstaerke, verzoegerung) {
        if (stumm || !kontext) return;
        var start = kontext.currentTime + (verzoegerung || 0);
        var osz = kontext.createOscillator();
        var huelle = kontext.createGain();
        osz.type = 'sine';
        osz.frequency.setValueAtTime(frequenz, start);
        huelle.gain.setValueAtTime(0, start);
        huelle.gain.linearRampToValueAtTime(lautstaerke, start + 0.015);
        huelle.gain.linearRampToValueAtTime(0, start + dauer);
        osz.connect(huelle);
        huelle.connect(kontext.destination);
        osz.start(start);
        osz.stop(start + dauer + 0.05);
    }

    // Fröhliches "Pling" beim Antippen einer Kachel
    function pling() {
        ton(880, 0.09, 0.18);
        ton(1318, 0.14, 0.16, 0.07);
    }

    var tonKnopf = document.getElementById('ton-knopf');

    function zeigeTonZustand() {
        tonKnopf.classList.toggle('stumm', stumm);
    }

    tonKnopf.addEventListener('click', function () {
        audioInit();
        stumm = !stumm;
        try {
            localStorage.setItem(STUMM_SCHLUESSEL, stumm ? '1' : '0');
        } catch (e) { /* ohne Speichern weiter */ }
        zeigeTonZustand();
        if (!stumm) ton(600, 0.06, 0.1); // kurzer Klick als Bestätigung
    });

    // ---------- Kacheln ----------

    var kacheln = document.querySelectorAll('.kachel');
    var wechselLaeuft = false;

    Array.prototype.forEach.call(kacheln, function (kachel) {
        // Schon beim Runterdrücken den AudioContext wecken, damit der
        // Pling beim Klick sicher zu hören ist
        kachel.addEventListener('pointerdown', audioInit);

        kachel.addEventListener('click', function () {
            if (wechselLaeuft) return; // Doppeltipp abfangen
            wechselLaeuft = true;

            audioInit();
            pling();
            kachel.classList.add('gedrueckt');

            // Kurz eingedrückt zeigen, dann zum Spiel wechseln
            setTimeout(function () {
                window.location.href = kachel.getAttribute('data-ziel');
            }, 260);
        });
    });

    // Falls man per "Zurück" wieder hier landet (Seiten-Cache):
    // Kachel wieder loslassen
    window.addEventListener('pageshow', function () {
        wechselLaeuft = false;
        Array.prototype.forEach.call(kacheln, function (k) { k.classList.remove('gedrueckt'); });
    });

    // ---------- Start ----------

    zeigeTonZustand();
    window.addEventListener('resize', skaliere);
    skaliere();
})();
