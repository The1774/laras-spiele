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

    // ---------- Baden (Wanne im Zimmer: Hahn, Seife, Schaum reiben, Dusche, Föhn) ----------

    // Nach so langer Pause wackelt das Ding, das als Nächstes dran ist (ms)
    BAD_HINWEIS_MS: 6000,
    // So nah (Pixel) muss die Seifenflasche an einen Schaumfleck, damit er wächst
    SEIFE_NAEHE: 150,
    // So groß wird ein Schaumberg allein durch Seife (0–1) – der Rest kommt vom Reiben
    SEIFE_MAX: 0.6,
    SEIFE_PRO_SEKUNDE: 0.55,
    // Reiben mit dem Finger (Schwamm): Reichweite (Pixel) und Tempo
    SCHRUBB_NAEHE: 95,
    SCHRUBB_PRO_SEKUNDE: 1.1,
    // Alle Schaumberge mindestens so groß → abspülen
    SCHAUM_FERTIG: 0.92,
    // Summe aller Schaumberge (je 0–1), ab der Leo einmal niest
    NIES_AB_SCHAUM: 2.6,
    // Duschregen: halbe Breite (Pixel) und wie schnell Schaum darunter wegspült
    DUSCHE_BREITE: 110,
    DUSCHE_PRO_SEKUNDE: 0.7,
    // So sauber ist Leo nach dem Abspülen (100 gibt es erst nach dem Föhnen)
    SAUBER_NACH_SPUELEN: 75,
    // Föhn: so nah (Pixel) an Leos Kopf wirkt er, so lange (s) bis sie trocken ist
    FOEHN_NAEHE: 300,
    FOEHN_SEKUNDEN: 3.2,

    // Dauer der Reaktionen in Millisekunden
    DAUER: {
        danke: 2600,
        trinken: 2000,
        frisch: 2600,
        wiedersehen: 2800,
        kitzeln: 1600,
        gutenacht: 3200,
        aufwachen: 2600,
        badefreude: 1300,
        planschen: 1300,
        niesen: 1100
    },

    // Speicher-Schlüssel (Präfix „leoella." setzt gemeinsam/speicher.js)
    SPEICHER_SCHLUESSEL: 'leo'
};
