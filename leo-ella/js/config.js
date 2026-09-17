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

    // ---------- Füttern (Gegenstände aus dem Korb zu Leos Maul ziehen) ----------

    // Jedes Futter: was es bringt (satt), wie viel es krümelt (sauber sinkt),
    // und Leos Charakter dazu:
    //   lieblings  – extra Herzen und Schnurren
    //   naschen    – nur, wenn Leo nicht schon ziemlich satt ist
    //   schnuppern – Leo schnuppert erst misstrauisch, frisst dann doch
    FUTTER: {
        fisch: { plus: 35, kruemel: 4, lieblings: true,  farbe: '#f4a261' },
        milch: { plus: 25, kruemel: 0,                   farbe: '#ffffff' },
        keks:  { plus: 15, kruemel: 10, naschen: true,   farbe: '#c98a4a' },
        apfel: { plus: 20, kruemel: 3, schnuppern: true, farbe: '#fff6e6' }
    },
    WASSER_PLUS: 20,
    // So viele Bissen, bis etwas aufgegessen ist, und der Abstand dazwischen
    BISSE: 3,
    BISS_MS: 800,
    // Ab hier ist Leo so satt, dass sie den Kopf wegdreht
    SATT_VOLL: 92,
    // Keks nur, wenn satt unter diesem Wert
    NASCHEN_UNTER: 80,
    // So nah (Bühnen-Pixel) muss ein Gegenstand ans Maul, damit es aufgeht
    MAUL_NAEHE: 120,
    // So lange muss die Flasche am Maul gehalten werden, bis sie leer ist (ms)
    TRINKEN_MS: 2200,
    // Bäuerchen-Wahrscheinlichkeit nach dem Aufessen (0–1)
    BAEUERCHEN_CHANCE: 0.35,

    // ---------- Streicheln (Zonen: kopf, kinn, ohr, ruecken, bauch, pfote) ----------

    // Wie oft ein Herz beim Streicheln erscheint (ms), bei gleichmäßiger
    // Bewegung öfter
    HERZ_ABSTAND_MS: 220,
    // Schnurr-Lautstärke: von … (ruckelig) bis … (schön gleichmäßig)
    SCHNURR_LEISE: 0.05,
    SCHNURR_LAUT: 0.16,
    // Nach so langem Kuscheln am Bauch / Kinn kichert bzw. seufzt Leo (ms)
    ZONEN_EXTRA_MS: 1800,

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
