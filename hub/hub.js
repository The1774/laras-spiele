// =====================================================
// Startbildschirm (Hub) von „Laras Spiele"
//
// - skaliert die feste Bühne (1024 × 768) auf den Bildschirm
// - Ton-Knopf: Stumm-Zustand über gemeinsam/audio.js (hub.stumm),
//   gilt damit für alle Spiele
// - Kachel tippen: eindrücken, kurzer Pling, dann Wechsel zum Spiel
//
// Braucht vorher: gemeinsam/speicher.js und gemeinsam/audio.js.
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

    // ---------- Ton-Knopf ----------

    var tonKnopf = document.getElementById('ton-knopf');

    function zeigeTonZustand() {
        tonKnopf.classList.toggle('stumm', Sound.stumm);
    }

    tonKnopf.addEventListener('click', function () {
        Sound.init();
        var stumm = Sound.stummUmschalten(); // speichert unter hub.stumm
        zeigeTonZustand();
        if (!stumm) Sound.klick();           // kurze Bestätigung, wenn Ton wieder an
    });

    // ---------- Kacheln ----------

    var kacheln = document.querySelectorAll('.kachel');
    var wechselLaeuft = false;

    Array.prototype.forEach.call(kacheln, function (kachel) {
        // Schon beim Runterdrücken den AudioContext wecken, damit der
        // Pling beim Klick sicher zu hören ist
        kachel.addEventListener('pointerdown', function () { Sound.init(); });

        kachel.addEventListener('click', function () {
            if (wechselLaeuft) return; // Doppeltipp abfangen
            wechselLaeuft = true;

            Sound.init();
            Sound.sammeln();               // das fröhliche "Pling"
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
