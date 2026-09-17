// =====================================================
// Leo Ella – Einstellungen an einem Ort
//
// Alle Zahlen, an denen man drehen möchte: wie schnell Leo hungrig
// wird, ab wann sie müde ist, wie viel ein Futter bringt.
// Werte der drei Bedürfnisse laufen von 0 (leer) bis 100 (voll).
// =====================================================

var KONFIG = {
    // Feste Bühne (wird per gemeinsam/skalierung.js eingepasst)
    BREITE: 1024,
    HOEHE: 768,

    // Wo Leo auf der Bühne sitzt (Position + Größe des Leo-SVGs,
    // viewBox 320 × 300 → Faktor 1.5)
    LEO: { x: 220, y: 218, breite: 480, hoehe: 450, faktor: 1.5 },

    // Nach so vielen Stunden ohne Pflege ist ein Bedürfnis von 100 auf 0
    // (läuft in echter Zeit weiter, auch wenn das Spiel zu ist)
    ABNAHME_STUNDEN: { satt: 5, sauber: 8, ausgeschlafen: 14 },

    // Nach langer Abwesenheit sinkt nichts unter diesen Wert –
    // Leo soll hungrig aussehen, aber nie verwahrlost
    UNTERGRENZE_NACH_ABWESENHEIT: 12,

    // Schlafen füllt „ausgeschlafen" wieder auf:
    // im Spiel schnell (Sekunden von 0 auf 100), bei geschlossener App langsam (Stunden)
    SCHLAF_SEKUNDEN_IM_SPIEL: 40,
    SCHLAF_STUNDEN_GESCHLOSSEN: 8,

    // Ab hier zeigt Leo Hunger / Schmutz / Müdigkeit
    SCHWELLE_HUNGRIG: 35,
    SCHWELLE_SCHMUTZIG: 35,
    SCHWELLE_MUEDE: 30,

    // Abends (echte Uhrzeit) ist Leo müde, egal wie ausgeschlafen
    ABEND_AB_UHR: 19,
    MORGEN_AB_UHR: 6,
    // … außer sie ist gerade frisch aufgewacht (ausgeschlafen noch über diesem Wert)
    ABEND_MUEDE_UNTER: 80,

    // Traurig nur nach sehr langer Nichtbeachtung (Stunden seit letzter Aktion)
    TRAURIG_NACH_STUNDEN: 20,

    // Wiedersehensfreude beim Öffnen, wenn die letzte Aktion so lange her ist (Minuten)
    WIEDERSEHEN_NACH_MINUTEN: 10,

    // Was die Aktionen bringen
    FUTTER_PLUS: 45,
    WASSER_PLUS: 20,
    ESSEN_MACHT_SCHMUTZIG: 8,      // Krümel! Sauber sinkt beim Essen ein wenig
    STREICHELN_PLUS_SATT: 0,        // Streicheln macht nicht satt, aber glücklich

    // Kitzeln: so viele Tipps auf Leo innerhalb dieses Zeitfensters
    KITZEL_TIPPS: 3,
    KITZEL_FENSTER_MS: 900,

    // Schnurren endet so lange nach der letzten Streichel-Bewegung (ms)
    SCHNURR_NACHLAUF_MS: 700,

    // Dauer der Reaktionen in Millisekunden
    DAUER: {
        danke: 2600,
        trinken: 2000,
        frisch: 2600,
        wiedersehen: 2800,
        kitzeln: 1600,
        gutenacht: 3200,
        aufwachen: 2600
    },

    // Speicher-Schlüssel (Präfix „leoella." setzt gemeinsam/speicher.js)
    SPEICHER_SCHLUESSEL: 'leo'
};
