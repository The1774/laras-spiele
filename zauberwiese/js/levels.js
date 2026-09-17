// =====================================================
// Level-Definitionen als reine Daten.
// Jedes Level: Name, Länge, Farben, Deko und eine Liste
// von Objekten (Blume, Hindernis, Stern, Herz, Ziel).
// Neue Level lassen sich einfach unten ergänzen.
// =====================================================

// Flughöhen der Sammel-Objekte (alle bequem erreichbar)
const HOEHE_TIEF   = KONFIG.BODEN_Y - 45;   // im Vorbeilaufen
const HOEHE_MITTEL = KONFIG.BODEN_Y - 105;  // kleiner Hüpfer
const HOEHE_HOCH   = KONFIG.BODEN_Y - 160;  // richtiger Sprung

// ---------- Bau-Helfer ----------

let _blumenZaehler = 0;

function blume(objekte, x, y) {
    const sorten = KONFIG.SPRITES.blumen;
    objekte.push({ typ: 'blume', x: x, y: y, emoji: sorten[_blumenZaehler++ % sorten.length] });
}

// Mehrere Blumen nebeneinander auf gleicher Höhe
function blumenReihe(objekte, startX, anzahl, y) {
    for (let i = 0; i < anzahl; i++) blume(objekte, startX + i * 85, y);
}

// Blumen-Bogen über einer Stelle – belohnt einen schönen Sprung
function blumenBogen(objekte, mitteX) {
    blume(objekte, mitteX - 150, HOEHE_TIEF);
    blume(objekte, mitteX - 75,  HOEHE_MITTEL);
    blume(objekte, mitteX,       HOEHE_HOCH);
    blume(objekte, mitteX + 75,  HOEHE_MITTEL);
    blume(objekte, mitteX + 150, HOEHE_TIEF);
}

// art: 0 = Pilz, 1 = Kaktus, 2 = Stein
// (wird in entities.js als große Cartoon-Figur gezeichnet)
function hindernis(objekte, x, art) {
    objekte.push({ typ: 'hindernis', art: art, x: x, y: KONFIG.BODEN_Y - 22 });
}

// ---------- Bewegliche Gegner ----------
// Die Lauf-Zustände (Richtung, Phase, Wurf-Timer) werden beim
// Levelstart in game.js gesetzt; hier nur die Grunddaten.

// Krabbler: watschelt am Boden zwischen x ± spanne hin und her
function krabbler(objekte, x, spanne, farbe) {
    objekte.push({ typ: 'gegner', art: 'krabbler', x: x, y: KONFIG.BODEN_Y - 18,
                   spanne: spanne || 120, tempo: 1.6, farbe: farbe });
}

// Flieger: flattert in der Luft seitlich (x ± spanne) und wippt auf/ab.
// hoehe = Mittel-Höhe (kleiner = höher); auf dem Boden ist Bella sicher,
// nur Reinspringen tut weh.
function flieger(objekte, x, hoehe, spanne, farbe) {
    objekte.push({ typ: 'gegner', art: 'flieger', x: x, y: hoehe || (KONFIG.BODEN_Y - 110),
                   spanne: spanne || 90, tempo: 1.1, amplitude: 22, farbe: farbe });
}

// Werfer: sitzt am Boden und schleudert Matschbälle im Bogen Richtung Bella
function werfer(objekte, x, farbe) {
    objekte.push({ typ: 'gegner', art: 'werfer', x: x, y: KONFIG.BODEN_Y - 24, farbe: farbe });
}

// Fledermaus: schwirrt frei umher – hoch/runter UND links/rechts – und
// prallt an den Rändern ihres Bereichs ab. Auf dem Boden ist Bella sicher,
// nur wer in die Flugbahn springt, bekommt etwas ab. (Für die dunklen
// und die Regen-Level.)
function fledermaus(objekte, x, spanneX) {
    objekte.push({
        typ: 'gegner', art: 'fledermaus', x: x,
        y: 240,                                  // Starthöhe (Mitte)
        spanneX: spanneX || 180,
        yMin: 120, yMax: KONFIG.BODEN_Y - 55,    // oben bis knapp über Bellas Kopf
        tempoX: 1.7, tempoY: 1.2, farbe: '#5b4a86'
    });
}

// Pinguin: watschelt am Boden hin und her (Gegner im Eis-Level)
function pinguin(objekte, x, spanne) {
    objekte.push({ typ: 'gegner', art: 'pinguin', x: x, y: KONFIG.BODEN_Y - 18,
                   spanne: spanne || 70, tempo: 1.3 });
}

// Eis-Kristall: zählt wie eine Blume (gleiche Punkte), nur als 💎-Variante
function kristall(objekte, x, y) {
    objekte.push({ typ: 'blume', x: x, y: y, emoji: '💎' });
}

function stern(objekte, x, y) {
    objekte.push({ typ: 'stern', x: x, y: y, emoji: KONFIG.SPRITES.stern });
}

// y ist optional – ohne Angabe schwebt das Herz auf mittlerer Höhe
function extraHerz(objekte, x, y) {
    objekte.push({ typ: 'herz', x: x, y: y || HOEHE_MITTEL, emoji: KONFIG.SPRITES.herz });
}

// Gefangener Freund in einer Zauberblase: Berührt Lara die Blase,
// zerplatzt sie und der Freund ist gerettet (Geschichte des Spiels!).
// Der gerettete Freund bleibt fröhlich im Level stehen.
function freund(objekte, x, y, emoji, name) {
    objekte.push({ typ: 'freund', x: x, y: y || HOEHE_MITTEL, emoji: emoji, name: name, gerettet: false, feier: 0 });
}

// Schwebende Insel: x = Mitte, y = Oberkante (zum Drauflanden)
function plattform(liste, x, y, breite) {
    liste.push({ x: x, y: y, breite: breite });
}

// Korallen-Spalte (nur Wasser-Level): zwei feste Säulen mit einer Lücke.
// gapY = Mitte der Lücke, gapHoehe = ihre Höhe. Bella muss hoch-/runter-
// schwimmen, um durch die Lücke zu passen.
function spalt(objekte, x, gapY, gapHoehe) {
    objekte.push({ typ: 'spalt', x: x, gapY: gapY, gapHeight: gapHoehe || 180, breite: 46 });
}

// ---------- Unterwasser-Sammelobjekte ----------
// Beide zählen wie Blumen (gleiche Punkte, gleicher Zähler)

function muschel(objekte, x, y) {
    objekte.push({ typ: 'blume', x: x, y: y, emoji: '🐚' });
}

// Wird in entities.js als lächelnder Seestern gezeichnet
function seestern(objekte, x, y) {
    objekte.push({ typ: 'blume', seestern: true, x: x, y: y });
}

// Bogen aus Muscheln und Seesternen über einem Hindernis
function meeresBogen(objekte, mitteX) {
    seestern(objekte, mitteX - 150, HOEHE_TIEF);
    muschel(objekte, mitteX - 75, HOEHE_MITTEL);
    seestern(objekte, mitteX, HOEHE_HOCH);
    muschel(objekte, mitteX + 75, HOEHE_MITTEL);
    seestern(objekte, mitteX + 150, HOEHE_TIEF);
}

// Der Ziel-Regenbogen steht kurz vor dem Levelende
function ziel(objekte, laenge) {
    objekte.push({ typ: 'ziel', x: laenge - 220, y: KONFIG.BODEN_Y - 75, emoji: KONFIG.SPRITES.ziel });
}

// Zauber-Sonne (nur im Gewitter-Level): Beim Einsammeln schießt Bella
// einen Regenbogen-Strahl nach oben, der das Gewitter auflöst (game.js).
function zaubersonne(objekte, x, y) {
    objekte.push({ typ: 'sonne', x: x, y: y });
}

// ---------- Die vier Level ----------

// Level 1: Blumenwiese – ganz sanfter Einstieg, wenige Hindernisse
function baueLevel1() {
    const laenge = 5200;
    const o = [];
    blumenReihe(o, 400, 4, HOEHE_TIEF);
    blumenReihe(o, 950, 3, HOEHE_MITTEL);
    hindernis(o, 1400, 0);
    blumenBogen(o, 1400);
    blumenReihe(o, 1850, 4, HOEHE_TIEF);
    stern(o, 2300, HOEHE_HOCH);
    hindernis(o, 2650, 1);
    blumenReihe(o, 2950, 4, HOEHE_TIEF);
    extraHerz(o, 3400);
    hindernis(o, 3750, 2);
    blumenBogen(o, 3750);
    blumenReihe(o, 4150, 5, HOEHE_MITTEL);
    stern(o, 4650, HOEHE_HOCH);
    ziel(o, laenge);

    // Gegner – sanfter Einstieg: ein Krabbler und ein hoher Flieger
    krabbler(o, 2100, 120);
    flieger(o, 4400, HOEHE_HOCH, 100);

    // Der gefangene Freund dieses Levels
    freund(o, 3550, HOEHE_MITTEL, '🦋', 'Mia, der Schmetterling');

    return {
        name: 'Blumenwiese', laenge: laenge, objekte: o,
        farben: { himmelOben: '#e9d5ff', himmelUnten: '#fce7f3', wiese: '#a7e3a0' },
        huegel: { fern: '#cdeec8', nah: '#b8e8b1' },
        himmelskoerper: '☀️',
        bodenDeko: ['🌼', '🌿'],
        freundEmoji: '🦋', freundName: 'Mia, der Schmetterling',
        geschichte: 'Die Grummel-Blasen haben eure Einhorn-Fohlen entführt! 🫧<br>' +
            'Über die Blumenwiese sind sie davongeschwebt – reitet hinterher!<br>' +
            'Und rettet unterwegs Mia, den Schmetterling!'
    };
}

// Level 2: Zauberwald – etwas mehr Hindernisse
function baueLevel2() {
    const laenge = 6000;
    const o = [];
    blumenReihe(o, 400, 4, HOEHE_TIEF);
    hindernis(o, 950, 2);
    blumenBogen(o, 950);
    blumenReihe(o, 1350, 3, HOEHE_MITTEL);
    hindernis(o, 1800, 0);
    stern(o, 2100, HOEHE_HOCH);
    blumenReihe(o, 2350, 4, HOEHE_TIEF);
    hindernis(o, 2900, 1);
    blumenBogen(o, 2900);
    extraHerz(o, 3350);
    blumenReihe(o, 3650, 4, HOEHE_MITTEL);
    hindernis(o, 4200, 0);
    blumenReihe(o, 4500, 4, HOEHE_TIEF);
    stern(o, 5000, HOEHE_HOCH);
    hindernis(o, 5300, 2);
    blumenBogen(o, 5300);
    ziel(o, laenge);

    // Gegner
    krabbler(o, 1550, 130);
    flieger(o, 2100, HOEHE_MITTEL, 110);
    werfer(o, 4350);

    // Der gefangene Freund dieses Levels
    freund(o, 4870, HOEHE_MITTEL, '🐰', 'Hoppel, das Häschen');

    return {
        name: 'Zauberwald', laenge: laenge, objekte: o,
        farben: { himmelOben: '#c7f0d8', himmelUnten: '#f0fce7', wiese: '#7fcf8a' },
        huegel: { fern: '#a9e0b4', nah: '#92d89c' },
        himmelskoerper: '☀️',
        bodenDeko: ['🌳', '🌲', '🍀'],
        freundEmoji: '🐰', freundName: 'Hoppel, das Häschen',
        geschichte: 'Die Spur der Grummel-Blasen führt in den Zauberwald!<br>' +
            'Hoppel, das Häschen, hat sie gesehen – doch jetzt steckt er selbst in einer Blase. 🫧<br>' +
            'Befreie ihn, dann zeigt er euch den Weg!'
    };
}

// Level 3: Abendhimmel – gemütliche Abendstimmung, flotter Rhythmus
function baueLevel3() {
    const laenge = 6600;
    const o = [];
    blumenReihe(o, 400, 5, HOEHE_TIEF);
    hindernis(o, 1000, 1);
    blumenBogen(o, 1000);
    stern(o, 1450, HOEHE_HOCH);
    blumenReihe(o, 1700, 4, HOEHE_MITTEL);
    hindernis(o, 2250, 2);
    blumenReihe(o, 2550, 4, HOEHE_TIEF);
    hindernis(o, 3100, 0);
    blumenBogen(o, 3100);
    extraHerz(o, 3550);
    stern(o, 3900, HOEHE_HOCH);
    hindernis(o, 4250, 1);
    blumenReihe(o, 4550, 5, HOEHE_MITTEL);
    hindernis(o, 5200, 2);
    blumenBogen(o, 5200);
    blumenReihe(o, 5650, 4, HOEHE_TIEF);
    stern(o, 6100, HOEHE_HOCH);
    ziel(o, laenge);

    // Gegner
    krabbler(o, 1900, 140);
    flieger(o, 2900, HOEHE_HOCH, 120);
    krabbler(o, 4900, 140);
    werfer(o, 5950);

    // Der gefangene Freund dieses Levels
    freund(o, 3380, HOEHE_MITTEL, '🦌', 'Rosa, das Reh');

    return {
        name: 'Abendhimmel', laenge: laenge, objekte: o,
        farben: { himmelOben: '#fbc2eb', himmelUnten: '#fde68a', wiese: '#9d8fd6' },
        huegel: { fern: '#c3b4e6', nah: '#b0a1de' },
        himmelskoerper: '🌙',
        bodenDeko: ['🌷', '⭐'],
        freundEmoji: '🦌', freundName: 'Rosa, das Reh',
        geschichte: 'Rosalie ist gerettet – aber zwei Fohlen fehlen noch! 🦄🦄<br>' +
            'Die Reise geht weiter in den rosa Abendhimmel.<br>' +
            'Auch Rosa, das Reh, wartet dort in einer Zauberblase. 🫧'
    };
}

// Level 4: Wolkenwelt – das große Finale, auch mal zwei Hindernisse nah beieinander
function baueLevel4() {
    const laenge = 7200;
    const o = [];
    blumenReihe(o, 400, 5, HOEHE_TIEF);
    hindernis(o, 1000, 0);
    blumenBogen(o, 1000);
    stern(o, 1450, HOEHE_HOCH);
    hindernis(o, 1800, 1);
    blumenReihe(o, 2100, 4, HOEHE_MITTEL);
    // Doppel-Hindernis: mit EINEM Sprung gut zu schaffen
    hindernis(o, 2650, 2);
    hindernis(o, 2710, 2);
    blumenBogen(o, 2680);
    extraHerz(o, 3150);
    blumenReihe(o, 3450, 4, HOEHE_TIEF);
    hindernis(o, 4000, 0);
    stern(o, 4300, HOEHE_HOCH);
    blumenReihe(o, 4550, 4, HOEHE_MITTEL);
    hindernis(o, 5100, 1);
    blumenBogen(o, 5100);
    hindernis(o, 5700, 2);
    blumenReihe(o, 6000, 5, HOEHE_TIEF);
    stern(o, 6550, HOEHE_HOCH);
    extraHerz(o, 6750);
    ziel(o, laenge);

    // Gegner – jetzt alle drei Typen
    krabbler(o, 1600, 140);
    flieger(o, 2400, HOEHE_MITTEL, 130);
    werfer(o, 3800);
    krabbler(o, 4800, 150);
    flieger(o, 6000, HOEHE_HOCH, 120);

    return {
        name: 'Wolkenwelt', laenge: laenge, objekte: o,
        farben: { himmelOben: '#dbeafe', himmelUnten: '#fce7f3', wiese: '#f3effd' },
        huegel: { fern: '#ece4fb', nah: '#e0d6f8' },
        himmelskoerper: '🌈',
        bodenDeko: ['☁️', '✨'],
        fest: true,   // die drei geretteten Fohlen feiern am Ziel-Regenbogen mit!
        geschichte: 'Alle Einhorn-Fohlen sind gerettet! 🦄🦄🦄<br>' +
            'Jetzt feiert das ganze Zauberland über den Wolken.<br>' +
            'Lauft gemeinsam zum großen Regenbogen-Fest! 🌈🎉'
    };
}

// Level 5: Schwebende Inseln – hier gibt es zum ersten Mal
// Plattformen zum Drauf-Springen. Der Weg am Boden bleibt immer
// frei – die Inseln sind Bonus-Wege mit Blumen und Sternen.
function baueLevel5() {
    const laenge = 6800;
    const o = [];
    const pl = [];
    const B = KONFIG.BODEN_Y;

    blumenReihe(o, 400, 4, HOEHE_TIEF);
    plattform(pl, 950, B - 110, 170);
    blumenReihe(o, 880, 3, B - 150);
    hindernis(o, 1250, 0);
    plattform(pl, 1600, B - 115, 160);
    stern(o, 1600, B - 165);
    plattform(pl, 1900, B - 195, 150);
    blumenReihe(o, 1860, 2, B - 235);
    hindernis(o, 2300, 1);
    blumenBogen(o, 2300);
    blumenReihe(o, 2700, 4, HOEHE_TIEF);
    plattform(pl, 3150, B - 120, 180);
    blumenReihe(o, 3080, 3, B - 160);
    hindernis(o, 3500, 2);
    plattform(pl, 3850, B - 110, 160);
    plattform(pl, 4150, B - 190, 150);
    stern(o, 4150, B - 240);
    blumenReihe(o, 4500, 4, HOEHE_TIEF);
    hindernis(o, 4900, 0);
    blumenBogen(o, 4900);
    plattform(pl, 5350, B - 130, 200);
    extraHerz(o, 5350, B - 175);
    blumenReihe(o, 5700, 4, HOEHE_MITTEL);
    hindernis(o, 6100, 1);
    stern(o, 6350, HOEHE_HOCH);
    ziel(o, laenge);

    // Gegner (am Boden – der Weg unten bleibt trotzdem schaffbar)
    krabbler(o, 2000, 140);
    flieger(o, 2600, HOEHE_HOCH, 120);
    werfer(o, 4000);
    krabbler(o, 5200, 140);

    // Der gefangene Freund schwebt über einer Insel (Bonus-Weg!)
    freund(o, 3850, B - 165, '🐦', 'Pips, der Vogel');

    return {
        name: 'Schwebende Inseln', laenge: laenge, objekte: o, plattformen: pl,
        farben: { himmelOben: '#cfe8ff', himmelUnten: '#ffe3f3', wiese: '#a7e3a0' },
        huegel: { fern: '#cdeec8', nah: '#b8e8b1' },
        himmelskoerper: '☀️',
        bodenDeko: ['🌼', '🍀'],
        freundEmoji: '🐦', freundName: 'Pips, der Vogel',
        geschichte: 'Von den schwebenden Inseln könnt ihr weit sehen:<br>' +
            'Da vorne brummt es laut – dort muss ein Fohlen sein! 🦄<br>' +
            'Rettet erst Pips, den Vogel, aus seiner Blase! 🫧'
    };
}

// Level 6: Sternennacht – dunkler Himmel mit Mond und funkelnden
// Sternen. Bellas Horn leuchtet und zeigt den Weg (game.js).
function baueLevel6() {
    const laenge = 7000;
    const o = [];
    const pl = [];
    const B = KONFIG.BODEN_Y;

    blumenReihe(o, 400, 4, HOEHE_TIEF);
    hindernis(o, 900, 2);
    blumenBogen(o, 900);
    plattform(pl, 1350, B - 110, 170);
    stern(o, 1350, B - 160);
    blumenReihe(o, 1700, 4, HOEHE_TIEF);
    hindernis(o, 2150, 0);
    plattform(pl, 2500, B - 120, 160);
    blumenReihe(o, 2440, 3, B - 160);
    plattform(pl, 2800, B - 200, 150);
    extraHerz(o, 2800, B - 245);
    hindernis(o, 3200, 1);
    blumenBogen(o, 3200);
    blumenReihe(o, 3600, 4, HOEHE_MITTEL);
    stern(o, 4000, HOEHE_HOCH);
    hindernis(o, 4300, 2);
    plattform(pl, 4700, B - 115, 180);
    blumenReihe(o, 4630, 3, B - 155);
    hindernis(o, 5100, 0);
    hindernis(o, 5160, 0);
    blumenBogen(o, 5130);
    plattform(pl, 5600, B - 130, 170);
    stern(o, 5600, B - 180);
    blumenReihe(o, 5950, 4, HOEHE_TIEF);
    extraHerz(o, 6400);
    ziel(o, laenge);

    // Gegner – inkl. umherschwirrender Fledermäuse (Laras Wunsch 🦇)
    krabbler(o, 1600, 140);
    fledermaus(o, 2300, 190);
    flieger(o, 3000, HOEHE_HOCH, 130);
    werfer(o, 4600);
    fledermaus(o, 5300, 200);
    krabbler(o, 5900, 140);

    // Der gefangene Freund dieses Levels
    freund(o, 4080, HOEHE_MITTEL, '🧚', 'Luna, die Sternenfee');

    return {
        name: 'Sternennacht', laenge: laenge, objekte: o, plattformen: pl,
        farben: { himmelOben: '#221c44', himmelUnten: '#5b4490', wiese: '#2e5044' },
        huegel: { fern: '#3a3f68', nah: '#31564b' },
        himmelskoerper: '🌕',
        nachts: true,      // aktiviert Dunkelheit + leuchtendes Horn
        tier: '✨',         // Glühwürmchen statt Schmetterlinge
        bodenDeko: ['🌷', '✨'],
        freundEmoji: '🧚', freundName: 'Luna, die Sternenfee',
        geschichte: 'Es ist Nacht im Zauberland – Bellas Horn leuchtet euch den Weg! ✨<br>' +
            'Luna, die Sternenfee, ist in einer Zauberblase gefangen. 🫧<br>' +
            'Ohne sie funkeln die Sterne nicht. Findet sie!'
    };
}

// Level 7: Unterwasserwelt – Bella taucht! Muscheln und Seesterne
// statt Blumen, Fische und Luftblasen, Korallenbänke als
// Plattformen, See-Igel und Felsen als Hindernisse. Durch das
// Wasser sind alle Sprünge herrlich langsam und schwebend.
function baueLevel7() {
    const laenge = 7200;
    const o = [];
    const pl = [];
    const B = KONFIG.BODEN_Y;

    for (let i = 0; i < 4; i++) muschel(o, 400 + i * 85, HOEHE_TIEF);
    seestern(o, 850, HOEHE_TIEF);
    seestern(o, 930, HOEHE_TIEF);
    hindernis(o, 1250, 3); // See-Igel
    meeresBogen(o, 1250);
    plattform(pl, 1700, B - 115, 170);
    muschel(o, 1640, B - 155);
    seestern(o, 1700, B - 155);
    muschel(o, 1760, B - 155);
    stern(o, 2050, HOEHE_HOCH);
    hindernis(o, 2350, 2); // Fels
    meeresBogen(o, 2350);
    for (let i = 0; i < 4; i++) seestern(o, 2700 + i * 85, HOEHE_TIEF);
    plattform(pl, 3150, B - 120, 160);
    plattform(pl, 3450, B - 200, 150);
    extraHerz(o, 3450, B - 245);
    hindernis(o, 3850, 3);
    meeresBogen(o, 3850);
    for (let i = 0; i < 4; i++) muschel(o, 4200 + i * 85, HOEHE_MITTEL);
    stern(o, 4650, HOEHE_HOCH);
    hindernis(o, 4900, 2);
    hindernis(o, 4960, 3); // Fels + See-Igel direkt hintereinander
    meeresBogen(o, 4930);
    plattform(pl, 5400, B - 110, 180);
    seestern(o, 5330, B - 150);
    muschel(o, 5400, B - 150);
    seestern(o, 5470, B - 150);
    for (let i = 0; i < 4; i++) muschel(o, 5750 + i * 85, HOEHE_TIEF);
    extraHerz(o, 6200);
    hindernis(o, 6450, 3);
    seestern(o, 6700, HOEHE_TIEF);
    muschel(o, 6780, HOEHE_TIEF);
    ziel(o, laenge);

    // Gegner (passend eingefärbt: orange "Krabben", blaue "Flitzer")
    krabbler(o, 1100, 140, '#ff9a62');
    flieger(o, 2050, HOEHE_HOCH, 130, '#5ec6f0');
    werfer(o, 3300, '#79c46f');
    krabbler(o, 5700, 150, '#ff9a62');
    flieger(o, 6050, HOEHE_MITTEL, 120, '#5ec6f0');

    // Korallen-Spalten zum Durchschwimmen (Lücke mal tief, mal hoch)
    spalt(o, 1900, KONFIG.BODEN_Y - 130, 175);
    spalt(o, 3050, KONFIG.BODEN_Y - 235, 165);
    spalt(o, 4250, KONFIG.BODEN_Y - 150, 185);
    spalt(o, 5550, KONFIG.BODEN_Y - 250, 165);

    // Der gefangene Freund schwebt mitten im Wasser
    freund(o, 4550, 230, '🐬', 'Finn, der Delfin');

    return {
        name: 'Unterwasserwelt', laenge: laenge, objekte: o, plattformen: pl,
        farben: { himmelOben: '#a8e7f7', himmelUnten: '#2f9fd0', wiese: '#edd49b' },
        huegel: { fern: '#57b4d9', nah: '#3fa5cd' },
        himmelskoerper: '⛵',          // Segelboot an der Wasseroberfläche
        wasser: true,                  // Lichtstrahlen + aufsteigende Blasen
        schwimmen: true,               // Frei-Schwimmen statt Springen!
        schwebe: 0.55,                 // (nur Fallback, im Schwimm-Modus ungenutzt)
        wolke: '🫧',                   // Luftblasen statt Wolken
        tier: ['🐠', '🐟', '🐡'],      // schwimmende Fische
        plattformFarben: { koerper: '#e2a86f', deckel: '#79c9b4', halme: '#4da894' },
        sammelIcon: '🐚',
        sammelName: 'Muscheln & Seesterne',
        bodenDeko: ['🐚', '🪸'],
        freundEmoji: '🐬', freundName: 'Finn, der Delfin',
        geschichte: 'Eine Grummel-Blase wurde am Meer gesehen! Platsch – taucht hinab!<br>' +
            'Bella zaubert Wasser-Magie: Sprung-Knopf drücken = auftauchen, loslassen = sinken.<br>' +
            'Und Finn, der Delfin, braucht unterwegs eure Hilfe! 🫧'
    };
}

// Level 8: Eisrutsche – erst läuft Bella normal über das Eis, ab der
// Kante (rutschAb) geht es eine Rutsche hinab: nur noch vorwärts, nur
// springen, schneller! Gegner sind watschelnde Pinguine, dazu Schnee-
// gestöber und Eisfelsen zum Drüberspringen; gesammelt werden Kristalle.
// Der „nur vorwärts"-Modus steckt in player.js (autorennen).
function baueEis() {
    const laenge = 7200;
    const o = [];

    // --- Teil 1: gemütlich über das Eis laufen ---
    for (let i = 0; i < 4; i++) kristall(o, 400 + i * 85, HOEHE_TIEF);
    pinguin(o, 1100, 90);
    hindernis(o, 1500, 2);
    for (let i = 0; i < 3; i++) kristall(o, 1750 + i * 85, HOEHE_MITTEL);
    // Der gefangene Freund – noch VOR der Rutsch-Kante, damit man ihn
    // in Ruhe retten kann
    freund(o, 2035, HOEHE_MITTEL, '🐥', 'Flöckchen, das Pinguin-Küken');
    stern(o, 2150, HOEHE_HOCH);
    pinguin(o, 2350, 70);

    // --- Teil 2: die Eisrutsche (ab x = 2600 nur vorwärts + springen) ---
    pinguin(o, 3000, 50);
    hindernis(o, 3500, 2);
    kristall(o, 3500, HOEHE_HOCH);   // beim Sprung über den Felsen einsammeln
    pinguin(o, 4100, 60);
    hindernis(o, 4750, 2);
    kristall(o, 4750, HOEHE_HOCH);
    stern(o, 5300, HOEHE_HOCH);
    pinguin(o, 5550, 60);
    hindernis(o, 6100, 2);
    kristall(o, 6100, HOEHE_HOCH);
    pinguin(o, 6600, 50);
    ziel(o, laenge);

    return {
        name: 'Eisrutsche', laenge: laenge, objekte: o,
        eis: true, rutschAb: 2600, schnee: true,
        farben: { himmelOben: '#cfeeff', himmelUnten: '#eaf6ff', wiese: '#dff1fb' },
        huegel: { fern: '#d8ebf7', nah: '#c9e2f2' },
        himmelskoerper: '🏔️',
        tier: '❄️',
        bodenDeko: ['⛄', '🧊', '❄️'],
        sammelIcon: '💎', sammelName: 'Kristalle 💎',
        freundEmoji: '🐥', freundName: 'Flöckchen, das Pinguin-Küken',
        geschichte: 'Brrr, wie kalt es im Eisland ist! ❄️<br>' +
            'Flöckchen, das Pinguin-Küken, zittert in seiner Zauberblase. 🫧<br>' +
            'Rette es schnell – und dann: Festhalten, gleich kommt die große Eisrutsche!'
    };
}

// Level 9: Gewittersturm – es regnet und blitzt! Vom Ablauf ein
// normales Lauf-Level, aber mit Regenschleiern, Wind und ab und zu
// einem (sanften) Blitz samt Donnergrollen. Am Ende wartet – wie im
// echten Leben nach dem Regen – der Ziel-Regenbogen. 🌈
// Die Effekte stecken in entities.js (Flags regen + gewitter).
function baueGewitter() {
    const laenge = 7000;
    const o = [];
    blumenReihe(o, 400, 4, HOEHE_TIEF);
    hindernis(o, 950, 2);
    blumenBogen(o, 950);
    stern(o, 1400, HOEHE_HOCH);
    blumenReihe(o, 1650, 4, HOEHE_MITTEL);
    hindernis(o, 2200, 0);
    blumenReihe(o, 2500, 4, HOEHE_TIEF);
    extraHerz(o, 2950);
    hindernis(o, 3300, 1);
    blumenBogen(o, 3300);
    stern(o, 3750, HOEHE_HOCH);
    blumenReihe(o, 4050, 4, HOEHE_MITTEL);
    // Doppel-Hindernis im stärksten Regen
    hindernis(o, 4600, 2);
    hindernis(o, 4660, 2);
    blumenBogen(o, 4630);
    blumenReihe(o, 5050, 4, HOEHE_TIEF);
    stern(o, 5500, HOEHE_HOCH);
    hindernis(o, 5800, 0);
    blumenReihe(o, 6050, 4, HOEHE_TIEF);
    // Die Zauber-Sonne kurz vor Schluss: einsammeln → Gewitter löst sich
    // auf, die echte Sonne geht auf, dann läuft Bella zum Regenbogen.
    zaubersonne(o, 6250, HOEHE_MITTEL);
    extraHerz(o, 6500);
    ziel(o, laenge);

    // Gegner (die Finale-Strecke ab der Zauber-Sonne bleibt gegnerfrei)
    krabbler(o, 1500, 140);
    fledermaus(o, 2100, 190);
    flieger(o, 2600, HOEHE_HOCH, 130);
    werfer(o, 3900);
    fledermaus(o, 4500, 210);
    krabbler(o, 5100, 150);

    // Der gefangene Freund dieses Levels
    freund(o, 4430, HOEHE_MITTEL, '🐿️', 'Nussi, das Eichhörnchen');

    return {
        name: 'Gewittersturm', laenge: laenge, objekte: o,
        farben:      { himmelOben: '#566173', himmelUnten: '#93a0b2', wiese: '#5f8f6a' },
        farbenSonne: { himmelOben: '#bfe3ff', himmelUnten: '#fff3c4', wiese: '#7fcf7a' }, // nach dem Auflösen
        huegel:      { fern: '#7d9a85', nah: '#6e9476' },
        huegelSonne: { fern: '#a4cf9e', nah: '#8fc487' }, // Hügel nach dem Auflösen
        himmelskoerper: '⛈️',
        regen: true,
        gewitter: true,
        bodenDeko: ['🪨', '🌿', '💧'],
        freundEmoji: '🐿️', freundName: 'Nussi, das Eichhörnchen',
        geschichte: 'Ein Gewitter tobt über dem Zauberland! ⛈️<br>' +
            'Nussi, das Eichhörnchen, hat große Angst in seiner Zauberblase. 🫧<br>' +
            'Rette es und finde die Zauber-Sonne – sie vertreibt den Sturm!'
    };
}

// Level 10: Grummelwolke – das erste Boss-Level! Hier wird NICHT
// gelaufen-bis-zum-Ziel, sondern eine schmollende Wolke wieder
// fröhlich gemacht: Mit ⬅️➡️ unter die Wolke stellen und mit der
// Sprung-Taste Regenbogen-Strahlen aus dem Horn schießen (der Strahl
// zielt von selbst auf die Wolke). Den grauen Tropfen ausweichen.
// Das Spielfeld ist genau einen Bildschirm breit – die Kamera bleibt
// also stehen (Arena statt Lauf-Level). Die ganze Logik steckt in
// game.js (aktualisiereBoss), gezeichnet wird in entities.js.
function baueBoss() {
    return {
        name: 'Grummelwolke',
        laenge: KONFIG.BREITE,   // genau ein Bildschirm → keine Kamerafahrt
        objekte: [],             // keine Sammel-Objekte: hier zählt der Strahl!
        boss: true,
        farben:     { himmelOben: '#8f97ad', himmelUnten: '#c3aecb', wiese: '#8fbf8a' },
        farbenSieg: { himmelOben: '#bfe3ff', himmelUnten: '#ffe0f2', wiese: '#a7e3a0' }, // Himmel hellt nach dem Sieg auf
        huegel: { fern: '#a8cfa4', nah: '#9cc797' },
        himmelskoerper: '',      // kein Sonne/Mond – die Wolke ist der Star
        bodenDeko: ['🌿', '🪨'],
        sammelIcon: '🌈',
        fohlen: 'sternchen',     // das goldene Fohlen in der großen Blase
        freundEmoji: '🦄', freundName: 'Sternchen, das Einhorn-Fohlen',
        geschichte: 'Da ist Sternchen! 🦄 Die Grummelwolke hält seine Blase fest –<br>' +
            'SIE hat auch das Gewitter gemacht! Fang die bunten Funken und<br>' +
            'schieß Regenbogen-Strahlen. Lacht die Wolke, platzt die Blase!'
    };
}

// Level 11: Brummel-Biene – zweiter Boss! Gleiche Mechanik (Funken
// sammeln, Regenbogen-Strahlen schießen), aber die Biene sticht herab,
// um Bella zu piksen, und ruft ab und zu kleine Helfer-Bienen.
// Das Verhalten steckt in game.js (boss.art === 'biene').
function baueBienenBoss() {
    return {
        name: 'Brummel-Biene',
        laenge: KONFIG.BREITE,   // ein Bildschirm → keine Kamerafahrt
        objekte: [],
        boss: true,
        bossArt: 'biene',
        farben:     { himmelOben: '#bfe3ff', himmelUnten: '#fff3c4', wiese: '#a7e3a0' },
        farbenSieg: { himmelOben: '#d6f0ff', himmelUnten: '#fff7df', wiese: '#b6ecae' },
        huegel: { fern: '#c3e8bd', nah: '#b4e0ae' },
        himmelskoerper: '☀️',
        bodenDeko: ['🌻', '🌼', '🍯'],
        sammelIcon: '🌈',
        fohlen: 'rosalie',       // das rosa Fohlen in der großen Blase
        freundEmoji: '🦄', freundName: 'Rosalie, das Einhorn-Fohlen',
        geschichte: 'Da ist Rosalie! 🦄 Die brummige Brummel-Biene bewacht ihre Blase!<br>' +
            'Fang die bunten Funken und schieß Regenbogen-Strahlen aus Bellas Horn.<br>' +
            'Wird die Biene wieder froh, platzt die Zauberblase! 🫧'
    };
}

// Boss 2: Grummel-Krake – bewacht am Strand die Blase von
// Blaubeere, dem blauen Fohlen. Bewegung und Angriff nutzen die
// Wolken-Logik (game.js: art !== 'biene' → aktualisiereWolke),
// gezeichnet wird sie als lila Tintenfisch (entities.js).
function baueKrakenBoss() {
    return {
        name: 'Grummel-Krake',
        laenge: KONFIG.BREITE,   // ein Bildschirm → keine Kamerafahrt
        objekte: [],
        boss: true,
        bossArt: 'krake',
        farben:     { himmelOben: '#8fc7e8', himmelUnten: '#cdeef7', wiese: '#edd49b' }, // Strand!
        farbenSieg: { himmelOben: '#bfe3ff', himmelUnten: '#e8f8ff', wiese: '#f5e3b0' },
        huegel: { fern: '#a5d8ee', nah: '#7ec9e6' },   // Meereswellen am Horizont
        himmelskoerper: '☀️',
        tier: ['🦀', '🐚'],
        bodenDeko: ['🐚', '⭐', '🪸'],
        sammelIcon: '🌈',
        fohlen: 'blaubeere',     // das blaue Fohlen in der großen Blase
        freundEmoji: '🦄', freundName: 'Blaubeere, das Einhorn-Fohlen',
        geschichte: 'Am Strand sitzt die Grummel-Krake – und hält Blaubeeres Blase fest! 🦄<br>' +
            'Weiche ihren grauen Tintentropfen aus, fang die bunten Funken<br>' +
            'und mach sie mit Regenbogen-Strahlen wieder fröhlich!'
    };
}

// =====================================================
// Laras Reise durch das Zauberland – drei Kapitel:
// Nach jeweils ~3 Leveln wartet ein Boss, der eines der
// drei entführten Einhorn-Fohlen in seiner Blase bewacht.
// Das Regenbogen-Fest in der Wolkenwelt ist das Finale.
// =====================================================
const LEVELS = [
    // --- Kapitel 1: Die Suche beginnt ---
    baueLevel1(),      //  1  Blumenwiese     – sanfter Einstieg
    baueLevel2(),      //  2  Zauberwald
    baueLevel5(),      //  3  Schwebende Inseln
    baueBienenBoss(),  //  4  BOSS: Brummel-Biene  → Rosalie 🦄 (rosa)
    // --- Kapitel 2: Durch Nacht und Meer ---
    baueLevel3(),      //  5  Abendhimmel
    baueLevel6(),      //  6  Sternennacht
    baueLevel7(),      //  7  Unterwasserwelt
    baueKrakenBoss(),  //  8  BOSS: Grummel-Krake  → Blaubeere 🦄 (blau)
    // --- Kapitel 3: Eis und Sturm ---
    baueEis(),         //  9  Eisrutsche
    baueGewitter(),    // 10  Gewittersturm
    baueBoss(),        // 11  BOSS: Grummelwolke   → Sternchen 🦄 (gold)
    // --- Finale ---
    baueLevel4()       // 12  Wolkenwelt – das Regenbogen-Fest 🌈
];
