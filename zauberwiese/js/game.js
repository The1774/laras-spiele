// =====================================================
// Hauptdatei: Game-Loop, Spielzustände, Kamera,
// Kollisionen, Fortschritt (localStorage) – verbindet
// alle Module miteinander.
//
// Zustände: 'start' | 'spiel' | 'pause' | 'geschafft' | 'nochmal'
// =====================================================

const canvas = document.getElementById('spiel-canvas');
const ctx = canvas.getContext('2d');

// ---------- Gespeicherter Fortschritt ----------

// Ablage mit Präfix "zauberwiese." (gemeinsam/speicher.js). Alte
// Speicherstände aus der Zeit vor der Spielesammlung werden einmalig
// umgezogen, damit Laras Fortschritt erhalten bleibt.
const Ablage = Speicher.fuer('zauberwiese');
Ablage.migriere(KONFIG.SPEICHER_SCHLUESSEL_ALT, KONFIG.SPEICHER_SCHLUESSEL);

function ladeFortschritt() {
    // localStorage blockiert oder leer? Dann einfach ohne Speicherstand starten.
    let fortschritt = Ablage.get(KONFIG.SPEICHER_SCHLUESSEL, null);
    if (!fortschritt) {
        fortschritt = { freigeschaltet: 1, highscore: 0, schwierigkeit: KONFIG.SCHWIERIGKEIT_STANDARD };
    }
    // freunde = { levelName: emoji } aller schon geretteten Freunde
    if (!fortschritt.freunde) fortschritt.freunde = {};
    return fortschritt;
}

// Die aktuell gewählte Schwierigkeitsstufe (Objekt aus KONFIG)
function aktiveSchwierigkeit() {
    return KONFIG.SCHWIERIGKEITEN[spiel.fortschritt.schwierigkeit]
        || KONFIG.SCHWIERIGKEITEN[KONFIG.SCHWIERIGKEIT_STANDARD];
}

function speichereFortschritt() {
    Ablage.set(KONFIG.SPEICHER_SCHLUESSEL, spiel.fortschritt);
}

// ---------- Zentraler Spielzustand ----------

const spiel = {
    zustand: 'start',
    levelNr: 0,
    level: null,      // aktuelle Level-Daten aus LEVELS
    objekte: [],      // Kopien der Level-Objekte (mit "eingesammelt"-Flag)
    plattformen: [],  // schwebende Inseln des aktuellen Levels
    deko: null,       // Wolken, Schmetterlinge, Boden-Schmuck
    partikel: [],
    popups: [],       // "+10"-Belohnungen, die beim Einsammeln aufsteigen
    boss: null,       // nur im Boss-Level gesetzt (Wolke/Biene/Krake)
    fohlenBlase: null,// das gefangene Einhorn-Fohlen im Boss-Level
    introT: 0,        // Zeit-Zähler der Intro-Szene
    strahlen: [],     // Regenbogen-Strahlen aus Bellas Horn
    tropfen: [],      // graue Grummel-Tropfen der Wolke
    funken: [],       // bunte Energie-Funken zum Einsammeln (Boss-Level)
    geschosse: [],    // Matschbälle der Werfer-Gegner
    bonusHerzen: [],  // Herzen, die die Sonne im Boss-Level fallen lässt
    minibienen: [],   // kleine Helfer-Bienen des Bienen-Bosses
    rutschBegonnen: false, // hat die Eisrutsche schon begonnen?
    kamera: 0,
    punkte: 0,
    blumen: 0,
    herzen: KONFIG.MAX_HERZEN,
    maxHerzen: KONFIG.MAX_HERZEN, // je nach Schwierigkeit (siehe ladeLevel)
    zeit: 0,          // läuft immer weiter (für Animationen)
    fortschritt: ladeFortschritt()
};

const bella = new Bella();

// ---------- Level laden & starten ----------

function ladeLevel(nr) {
    spiel.levelNr = nr;
    spiel.level = LEVELS[nr];
    // Objekte kopieren, damit das Original-Level unverändert bleibt
    spiel.objekte = spiel.level.objekte.map(function (o) {
        return Object.assign({}, o, { eingesammelt: false });
    });
    // Bewegliche Gegner bekommen ihren Lauf-/Flatter-/Wurf-Zustand
    spiel.objekte.forEach(function (o) {
        if (o.typ !== 'gegner') return;
        o.startX = o.x;
        o.basisY = o.y;
        o.richtung = -1; // läuft/fliegt erst nach links (Bella entgegen)
        o.blick = -1;
        o.t = Math.random() * 6;                 // Flatter-Phase
        o.wurfTimer = 70 + Math.random() * 80;   // bis zum ersten Wurf
        // Fledermäuse fliegen schräg los (zufällige Richtung)
        o.vx = Math.random() < 0.5 ? -1 : 1;
        o.vy = Math.random() < 0.5 ? -1 : 1;
    });
    spiel.plattformen = spiel.level.plattformen || [];
    spiel.deko = erzeugeDeko(spiel.level);
    spiel.partikel = [];
    spiel.popups = [];
    spiel.strahlen = [];
    spiel.tropfen = [];
    spiel.funken = [];
    spiel.geschosse = [];
    spiel.bonusHerzen = [];
    spiel.minibienen = [];
    spiel.rutschBegonnen = false;
    spiel.boss = spiel.level.boss ? erzeugeBoss(spiel.level.bossArt) : null;
    // Im Boss-Level schwebt das entführte Fohlen in seiner großen Blase
    spiel.fohlenBlase = spiel.level.fohlen ? { befreit: false } : null;
    spiel.kamera = 0;
    spiel.punkte = 0;
    spiel.blumen = 0;
    spiel.maxHerzen = aktiveSchwierigkeit().herzen;
    spiel.herzen = spiel.maxHerzen;
    bella.reset();
}

// Dateiname-Schlüssel für eigene Aufnahmen (siehe stimme.js):
// "Zauberwald" → "zauberwald", "Brummel-Biene" → "brummel-biene"
function stimmSchluessel(name) {
    return name.toLowerCase()
        .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
        .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// Level starten – zuerst wird die kleine Geschichte des Levels
// gezeigt (das Level ist dahinter schon als Kulisse zu sehen)
// und vom Erzähler vorgelesen.
function starteLevel(nr) {
    ladeLevel(nr);
    spiel.zustand = 'geschichte';
    UI.zeigeGeschichte(nr + 1, spiel.level);
    UI.zeigeBildschirm('geschichte');
    Stimme.sprich(spiel.level.geschichte, 'erzaehler', 'geschichte-' + stimmSchluessel(spiel.level.name));
}

// Welcher Musik-Stil passt zum Level?
function musikStil(level) {
    if (level.fest) return 'fest';
    if (level.boss) return 'boss';
    if (level.schwimmen || level.wasser) return 'wasser';
    if (level.nachts) return 'nacht';
    if (level.eis || level.schnee) return 'eis';
    if (level.gewitter || level.regen) return 'sturm';
    return 'wiese';
}

// "Los geht's!"-Knopf auf dem Geschichte-Bildschirm
function geschichteWeiter() {
    Stimme.stopp(); // falls der Erzähler noch mittendrin ist
    spiel.zustand = 'spiel';
    UI.zeigeBildschirm(null);
    Musik.start(musikStil(spiel.level));
}

// Neustart nach "Nochmal?" – OHNE die Geschichte noch einmal zu zeigen
function starteLevelOhneGeschichte(nr) {
    ladeLevel(nr);
    spiel.zustand = 'spiel';
    UI.zeigeBildschirm(null);
    Musik.start(musikStil(spiel.level));
}

// =====================================================
// Die Intro-Szene: Lara und Bella spielen mit den drei
// Einhorn-Fohlen – da kommen Grummel-Blasen vom Himmel
// und tragen die Fohlen davon! Läuft als kleine Animation
// direkt im Spielfeld (Level 1 als Kulisse).
// =====================================================

const INTRO_FOHLEN = ['rosalie', 'blaubeere', 'sternchen'];

function starteIntro() {
    ladeLevel(0);
    spiel.zustand = 'intro';
    spiel.introT = 0;
    spiel.introPhase = -1; // damit der erste Erzähltext gesprochen wird
    UI.zeigeBildschirm('intro');
}

function beendeIntro() {
    Stimme.stopp();
    spiel.fortschritt.introGesehen = true;
    speichereFortschritt();
    starteLevel(spiel.fortschritt.freigeschaltet - 1);
}

// Nummer der aktuellen Intro-Phase (für Text + Sprache)
function introPhase(t) {
    if (t < 150) return 0;
    if (t < 270) return 1;
    if (t < 480) return 2;
    return 3;
}

// Der passende Erzähl-Text zur aktuellen Intro-Phase
function introText(t) {
    if (t < 150) return '🌸 Lara und Bella spielen mit ihren Einhorn-Freunden auf der Zauberwiese.';
    if (t < 270) return '🫧 Doch plötzlich... Grummel-Zauberblasen kommen vom Himmel!';
    if (t < 480) return '😢 Die Blasen schnappen sich die Fohlen und tragen sie davon!';
    return '💪 Rettet die Fohlen! Eure Reise durch das Zauberland beginnt...';
}

// Zeichnet die Intro-Szene (nach der Spielwelt aufgerufen)
function zeichneIntro(ctx) {
    const t = spiel.introT;
    for (let i = 0; i < INTRO_FOHLEN.length; i++) {
        const x = 330 + i * 115;
        const ti = t - i * 22;             // jedes Fohlen etwas versetzt
        const bodenY = KONFIG.BODEN_Y - 14;

        if (ti < 150) {
            // fröhlich auf der Wiese hüpfen
            const hops = Math.abs(Math.sin((spiel.zeit + i * 17) * 0.1)) * 8;
            drawFohlen(ctx, x, bodenY - hops, 0.55, i === 1 ? -1 : 1, INTRO_FOHLEN[i], { zeit: spiel.zeit });
        } else if (ti < 270) {
            // die Grummel-Blase senkt sich über das Fohlen
            drawFohlen(ctx, x, bodenY, 0.55, 1, INTRO_FOHLEN[i], { zeit: spiel.zeit });
            const anteil = (ti - 150) / 120;
            const by = -80 + anteil * (KONFIG.BODEN_Y - 44 + 80);
            zeichneGrummelBlase(ctx, x, by, 46);
        } else {
            // gefangen! Die Blase steigt schwankend davon
            const by = (KONFIG.BODEN_Y - 44) - (ti - 270) * 1.7;
            if (by > -90) {
                const bx = x + Math.sin(ti * 0.05) * 14;
                drawFohlen(ctx, bx, by + 12, 0.42, 1, INTRO_FOHLEN[i], { zeit: spiel.zeit });
                zeichneGrummelBlase(ctx, bx, by, 46);
            }
        }
    }
}

// Im Finale (Wolkenwelt, fest:true) feiern die drei geretteten
// Fohlen am Ziel-Regenbogen mit!
function zeichneFestFohlen(ctx, kamera, zeit, laenge) {
    const plaetze = [laenge - 530, laenge - 430, laenge - 340];
    for (let i = 0; i < INTRO_FOHLEN.length; i++) {
        const sx = plaetze[i] - kamera;
        if (sx < -80 || sx > KONFIG.BREITE + 80) continue;
        const hops = Math.abs(Math.sin(zeit * 0.11 + i * 1.4)) * 10;
        drawFohlen(ctx, sx, KONFIG.BODEN_Y - 14 - hops, 0.55, i === 2 ? -1 : 1, INTRO_FOHLEN[i], { zeit: zeit });
    }
}

function zeigeStartbildschirm() {
    Stimme.stopp();
    Musik.stopp();
    spiel.zustand = 'start';
    UI.baueLevelAuswahl(spiel.fortschritt, function (nr) {
        Sound.init(); Sound.klick();
        starteLevel(nr);
    });
    baueSchwierigkeitsAuswahl();
    UI.zeigeBildschirm('start');
}

// Schwierigkeits-Knöpfe (Leicht/Normal/Schwer) bauen + Auswahl speichern
function baueSchwierigkeitsAuswahl() {
    UI.baueSchwierigkeit(spiel.fortschritt.schwierigkeit || KONFIG.SCHWIERIGKEIT_STANDARD, function (schluessel) {
        Sound.init(); Sound.klick();
        spiel.fortschritt.schwierigkeit = schluessel;
        speichereFortschritt();
        baueSchwierigkeitsAuswahl(); // neu zeichnen, damit die Wahl hervorgehoben ist
    });
}

// ---------- Spiellogik ----------

function aktualisiere(dt) {
    spiel.zeit += dt;

    // Deko und Partikel laufen auch hinter den Menüs weiter (wirkt lebendig)
    if (spiel.deko) aktualisiereDeko(spiel.deko, dt, spiel.level);
    aktualisierePartikel(spiel.partikel, dt);
    aktualisierePopups(spiel.popups, dt);

    // Konfetti-Regen auf dem "Geschafft"-Bildschirm
    if (spiel.zustand === 'geschafft' && Math.random() < 0.25) {
        erzeugePartikel(
            spiel.partikel,
            spiel.kamera + Math.random() * KONFIG.BREITE,
            40 + Math.random() * 200,
            2,
            KONFIG.SPRITES.glitzer
        );
    }

    // Intro-Szene: Zeitachse weiterlaufen lassen, Erzähltext setzen
    // und jede neue Phase vom Erzähler sprechen lassen.
    // WICHTIG: Die nächste Phase wartet, bis der Erzähler den Satz
    // zu Ende gesprochen hat – sonst wird er mittendrin abgebrochen.
    if (spiel.zustand === 'intro') {
        spiel.introT += dt;
        const grenzen = [150, 270, 480, 660];
        const grenze = grenzen[Math.max(0, spiel.introPhase)];
        if (Stimme.sprichtGerade() && spiel.introT >= grenze - 1) {
            spiel.introT = grenze - 1; // kurz vor der Phasengrenze warten
        }
        UI.setzeIntroText(introText(spiel.introT));
        const phase = introPhase(spiel.introT);
        if (phase !== spiel.introPhase) {
            spiel.introPhase = phase;
            Stimme.sprich(introText(spiel.introT), 'erzaehler', 'intro-' + (phase + 1));
        }
        if (spiel.introT > 660) beendeIntro();
        return;
    }

    if (spiel.zustand !== 'spiel') return;

    // Eisrutsche: ab rutschAb geht es automatisch nur noch vorwärts
    const autorennen = !!(spiel.level.eis && bella.x >= spiel.level.rutschAb);

    const warAmBoden = bella.amBoden;
    bella.aktualisiere(dt, Eingabe, spiel.level.laenge, spiel.plattformen, spiel.level.schwebe, spiel.level.schwimmen, autorennen);
    if (spiel.level.schwimmen) pruefeSpalten();

    // Lande-Sternchen: Bei jeder Landung stiebt ein wenig Glitzer auf
    if (bella.amBoden && !warAmBoden && !spiel.level.schwimmen) {
        erzeugePartikel(spiel.partikel, bella.x, bella.y + 16, 3, ['✨', '⭐']);
    }

    // Beim ersten Erreichen der Rutsche: Schnee-Wirbel + Sound
    if (autorennen && !spiel.rutschBegonnen) {
        spiel.rutschBegonnen = true;
        erzeugePartikel(spiel.partikel, bella.x, bella.y, 18, ['❄️', '✨', '🌨️', '⭐']);
        Sound.stern();
    }
    // Schnee-Wirbel an den Hufen während der Rutsche
    if (autorennen && bella.amBoden && Math.random() < 0.4) {
        erzeugePartikel(spiel.partikel, bella.x - 22, KONFIG.BODEN_Y - 8, 1, ['❄️', '✨']);
    }

    // Funkel-Gleiten: Glitzer rieselt unter Bellas Zauber-Flügeln
    if (bella.gleitet && Math.random() < 0.4) {
        erzeugePartikel(spiel.partikel, bella.x - 18 * bella.richtung, bella.y + 8, 1, ['✨', '⭐', '💫']);
    }

    // Gerettete Freunde feiern noch einen Moment (Sprechblasen-Timer).
    // Gefangene Freunde rufen einmal um Hilfe, sobald Lara näher kommt.
    for (const o of spiel.objekte) {
        if (o.typ !== 'freund') continue;
        if (o.feier > 0) o.feier -= dt;
        if (!o.gerettet && !o.gerufen && Math.abs(bella.x - o.x) < 420) {
            o.gerufen = true;
            Stimme.sprich('Hilfe! Hilf mir, Lara!', 'freund');
        }
    }

    // Kleine Glitzer-Spur an den Hufen, wenn Bella galoppiert –
    // mit Sternen-Turbo deutlich dichter und sternig
    if (bella.laeuft && bella.amBoden) {
        if (bella.turbo > 0 && Math.random() < 0.35) {
            erzeugePartikel(spiel.partikel, bella.x - 25 * bella.richtung, KONFIG.BODEN_Y - 14, 1, ['⭐', '✨']);
        } else if (Math.random() < 0.1) {
            erzeugePartikel(spiel.partikel, bella.x - 25 * bella.richtung, KONFIG.BODEN_Y - 8, 1, ['✨']);
        }
    }

    // Kamera folgt Bella (Bella steht etwas links der Bildmitte)
    spiel.kamera = Math.max(0, Math.min(
        bella.x - KONFIG.BREITE * 0.35,
        spiel.level.laenge - KONFIG.BREITE
    ));

    if (spiel.boss) aktualisiereBoss(dt);
    // Auch ohne Boss können Strahlen fliegen (z. B. der Sonnen-Strahl,
    // der das Gewitter auflöst)
    else if (spiel.strahlen.length) aktualisiereStrahlen(spiel.strahlen, dt);

    aktualisiereGegner(dt);

    pruefeObjekte();
}

// =====================================================
// Boss-Level: die Grummelwolke
// Bella schießt mit der Sprung-Taste Regenbogen-Strahlen (die von
// selbst auf die Wolke zielen), weicht den grauen Tropfen aus und
// macht die Wolke so Stück für Stück wieder fröhlich.
// =====================================================

function erzeugeBoss(art) {
    return {
        art: art || 'wolke',    // 'wolke' (Grummelwolke) oder 'biene' (Brummel-Biene)
        x: KONFIG.BREITE / 2,
        basisY: 120,            // Mittel-Höhe; schwebt sanft auf und ab
        y: 120,
        richtung: 1,
        tempo: 0.7,
        treffer: 0,
        maxTreffer: KONFIG.BOSS_TREFFER,
        zittern: 0,             // kurzes Wackeln nach einem Treffer
        trefferCooldown: 0,     // ein Strahl = ein Treffer
        tropfenTimer: 90,       // Frames bis zum nächsten grauen Tropfen (Wolke)
        funkeTimer: 70,         // Frames bis zum nächsten Energie-Funken
        herzTimer: 360,         // Frames bis die Sonne ein Herz fallen lässt
        sonneTimer: 0,          // wie lange die Sonne gerade zu sehen ist
        feierTimer: 0,          // Takt für die Feuerwerk-Wellen beim Sieg
        fanfare2: false,        // zweite Sieges-Melodie schon gespielt?
        energie: 0,             // so viele Schüsse hat Bella gerade auf Vorrat
        maxEnergie: KONFIG.BOSS_ENERGIE_MAX,
        warSpringen: false,     // für die "steigende Flanke" der Sprung-Taste
        besiegt: false,
        siegTimer: 0,           // kleine Jubel-Animation, bevor "Geschafft" kommt
        // --- nur Bienen-Boss ---
        stichPhase: 'schweben', // 'schweben' | 'warnung' | 'sturz' | 'zurueck'
        stichTimer: 200,        // Frames bis zum nächsten Pieks-Sturz
        stichT: 0,              // Restdauer der aktuellen Phase
        zielX: KONFIG.BREITE / 2,
        rufTimer: 360           // Frames bis zum nächsten Helfer-Bienen-Ruf
    };
}

function aktualisiereBoss(dt) {
    const boss = spiel.boss;
    const phase = Math.floor(boss.treffer / 3);

    if (boss.zittern > 0) boss.zittern -= dt;
    if (boss.trefferCooldown > 0) boss.trefferCooldown -= dt;

    // ---------- Sieg: ausgiebig feiern, dann "Geschafft" ----------
    if (boss.besiegt) {
        boss.y = boss.basisY + Math.sin(spiel.zeit * 0.18) * 16; // fröhliches Hüpfen
        boss.siegTimer -= dt;

        // Dauer-Konfetti, das von oben über den ganzen Bildschirm rieselt
        if (Math.random() < 0.9) {
            erzeugePartikel(
                spiel.partikel,
                spiel.kamera + Math.random() * KONFIG.BREITE,
                10 + Math.random() * 170,
                2, ['💖', '🌸', '✨', '🌈', '💗', '⭐', '🎉', '💜', '🌟']
            );
        }

        // Feuerwerk-Wellen + Regenbogen-Strahlen-Fächer aus der Wolke
        boss.feierTimer -= dt;
        if (boss.feierTimer <= 0) {
            boss.feierTimer = 20 + Math.random() * 16;

            // Feuerwerk an einer zufälligen Stelle
            const fx = spiel.kamera + 110 + Math.random() * (KONFIG.BREITE - 220);
            const fy = 50 + Math.random() * 190;
            erzeugePartikel(spiel.partikel, fx, fy, 16, ['✨', '🌟', '⭐', '💖', '🌈', '🎉']);

            // Strahlen sprühen rundum aus der jubelnden Wolke
            for (let i = 0; i < 7; i++) {
                const w = -Math.PI / 2 + (i - 3) * 0.32;
                spiel.strahlen.push({
                    x: boss.x, y: boss.y,
                    vx: Math.cos(w) * 9, vy: Math.sin(w) * 9,
                    farbe: i % REGENBOGEN.length, leben: 55, spur: []
                });
            }
            if (Math.random() < 0.5) Sound.sammeln();
        }

        // Zweite Sieges-Fanfare zur Hälfte der Feier
        if (!boss.fanfare2 && boss.siegTimer < 170) {
            boss.fanfare2 = true;
            Sound.sieg();
        }

        aktualisiereStrahlen(spiel.strahlen, dt);

        if (boss.siegTimer <= 0) levelGeschafft();
        return;
    }

    // ---------- Bewegung + Angriff je nach Boss-Art ----------
    if (boss.art === 'biene') aktualisiereBiene(dt, phase);
    else aktualisiereWolke(dt, phase);

    // ---------- Schießen: NUR mit Energie (steigende Flanke der Sprung-Taste) ----------
    // Bella hüpft wie gewohnt; ein Strahl kommt aber nur, wenn sie vorher
    // einen Funken eingefangen hat. So bringt bloßes Drücken nichts.
    if (Eingabe.springen && !boss.warSpringen) {
        if (boss.energie > 0) {
            boss.energie -= 1;
            feuereStrahl();
        } else {
            fehlschuss();
        }
    }
    boss.warSpringen = Eingabe.springen;

    aktualisiereStrahlen(spiel.strahlen, dt);
    pruefeStrahlTreffer();

    // ---------- Bunte Energie-Funken (einsammeln zum Nachladen!) ----------
    boss.funkeTimer -= dt;
    if (boss.funkeTimer <= 0) {
        spiel.funken.push({
            x: boss.x + (Math.random() - 0.5) * 130,
            y: boss.y + 30,
            vx: (Math.random() - 0.5) * 1.2,
            vy: 1.5 + Math.random() * 0.5,
            farbe: Math.floor(Math.random() * REGENBOGEN.length),
            phase: Math.random() * 6
        });
        boss.funkeTimer = 105 + Math.random() * 70;
    }
    aktualisiereFunken(dt);

    // ---------- Ab und zu kommt die Sonne und lässt ein Herz fallen ----------
    if (boss.sonneTimer > 0) boss.sonneTimer -= dt;
    boss.herzTimer -= dt;
    if (boss.herzTimer <= 0) {
        boss.herzTimer = 540 + Math.random() * 300; // ~9–14 Sekunden
        boss.sonneTimer = 150;                        // Sonne ~2,5 s sichtbar
        spiel.bonusHerzen.push({ x: boss.x, y: boss.y - 70, vy: 1.3 });
        Sound.stern(); // heller Hinweis: schau nach oben!
    }
    aktualisiereBonusHerzen(dt);
}

// Grummelwolke: schwebt, wandert und lässt graue Tropfen fallen.
function aktualisiereWolke(dt, phase) {
    const boss = spiel.boss;
    boss.tempo = 0.7 + phase * 0.35;
    boss.x += boss.richtung * boss.tempo * dt;
    if (boss.x < 175) { boss.x = 175; boss.richtung = 1; }
    if (boss.x > KONFIG.BREITE - 175) { boss.x = KONFIG.BREITE - 175; boss.richtung = -1; }
    boss.y = boss.basisY + Math.sin(spiel.zeit * 0.04) * 14;

    boss.tropfenTimer -= dt;
    if (boss.tropfenTimer <= 0) {
        spiel.tropfen.push({
            x: boss.x + (Math.random() - 0.5) * 90,
            y: boss.y + 30,
            vy: 2.0 + Math.random() * 0.6
        });
        boss.tropfenTimer = (100 - phase * 16 + Math.random() * 50) * aktiveSchwierigkeit().wurfPause;
    }
    aktualisiereTropfen(dt);
}

// Brummel-Biene: schwebt, stürzt zum Piksen herab und ruft Helfer-Bienen.
function aktualisiereBiene(dt, phase) {
    const boss = spiel.boss;
    const s = aktiveSchwierigkeit();

    if (boss.stichPhase === 'schweben') {
        boss.tempo = 0.8 + phase * 0.3;
        boss.x += boss.richtung * boss.tempo * dt;
        if (boss.x < 175) { boss.x = 175; boss.richtung = 1; }
        if (boss.x > KONFIG.BREITE - 175) { boss.x = KONFIG.BREITE - 175; boss.richtung = -1; }
        boss.y = boss.basisY + Math.sin(spiel.zeit * 0.05) * 14;

        boss.stichTimer -= dt;
        if (boss.stichTimer <= 0 && Math.abs(boss.x - bella.x) < 600) {
            boss.stichPhase = 'warnung';
            boss.stichT = 32;
        }

    } else if (boss.stichPhase === 'warnung') {
        // über Bella ziehen und zittern (Vorwarnung)
        boss.x += (bella.x - boss.x) * 0.08 * dt;
        boss.y = boss.basisY + Math.sin(spiel.zeit * 0.7) * 4;
        boss.stichT -= dt;
        if (boss.stichT <= 0) boss.stichPhase = 'sturz';

    } else if (boss.stichPhase === 'sturz') {
        // herabstürzen, um zu piksen
        boss.y += 9 * dt;
        boss.x += (bella.x - boss.x) * 0.04 * dt;
        if (bella.unverwundbar <= 0 && pruefeKollision(
            bella.x, bella.y, KONFIG.HITBOX.spieler.breite, KONFIG.HITBOX.spieler.hoehe,
            boss.x, boss.y, 40, 40)) {
            trefferDurchHindernis();
        }
        if (boss.y >= KONFIG.BODEN_Y - 55) boss.stichPhase = 'zurueck';

    } else { // 'zurueck'
        boss.y -= 6 * dt;
        if (boss.y <= boss.basisY) {
            boss.y = boss.basisY;
            boss.stichPhase = 'schweben';
            boss.stichTimer = (190 + Math.random() * 160) * s.wurfPause;
        }
    }

    // Ab und zu kleine Helfer-Bienen rufen (die kurz mithelfen)
    boss.rufTimer -= dt;
    if (boss.rufTimer <= 0) {
        boss.rufTimer = (430 + Math.random() * 240) * s.wurfPause;
        const anzahl = 2 + (phase >= 2 ? 1 : 0);
        for (let i = 0; i < anzahl; i++) {
            spiel.minibienen.push({
                x: boss.x + (Math.random() - 0.5) * 70,
                y: boss.y + (Math.random() - 0.5) * 30,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 1.4,
                leben: 280 + Math.random() * 120,
                t: Math.random() * 6
            });
        }
        Sound.stern();
    }
    aktualisiereMinibienen(dt, s);
}

// Kleine Helfer-Bienen: schwirren sanft Richtung Bella, piksen bei
// Berührung und verschwinden nach kurzer Zeit wieder.
function aktualisiereMinibienen(dt, s) {
    const hb = KONFIG.HITBOX;
    for (let i = spiel.minibienen.length - 1; i >= 0; i--) {
        const m = spiel.minibienen[i];
        m.t += dt;
        m.vx += (bella.x > m.x ? 1 : -1) * 0.02 * dt;
        m.vy += (bella.y > m.y ? 1 : -1) * 0.02 * dt;
        m.vx = Math.max(-2.2, Math.min(2.2, m.vx));
        m.vy = Math.max(-2.0, Math.min(2.0, m.vy));
        m.x += m.vx * s.gegnerTempo * dt;
        m.y += m.vy * s.gegnerTempo * dt;
        if (m.y < 70) { m.y = 70; m.vy = Math.abs(m.vy); }
        if (m.y > KONFIG.BODEN_Y - 20) { m.y = KONFIG.BODEN_Y - 20; m.vy = -Math.abs(m.vy); }

        if (bella.unverwundbar <= 0 && pruefeKollision(
            bella.x, bella.y, hb.spieler.breite, hb.spieler.hoehe,
            m.x, m.y, 22, 22)) {
            trefferDurchHindernis();
        }

        m.leben -= dt;
        if (m.leben <= 0) {
            erzeugePartikel(spiel.partikel, m.x, m.y, 3, ['✨']);
            spiel.minibienen.splice(i, 1);
        }
    }
}

// Herzen, die die Sonne fallen lässt: einfangen heilt ein Herz,
// verpasst man sie (Boden), sind sie weg.
function aktualisiereBonusHerzen(dt) {
    const hb = KONFIG.HITBOX;
    for (let i = spiel.bonusHerzen.length - 1; i >= 0; i--) {
        const h = spiel.bonusHerzen[i];
        h.y += h.vy * dt;

        if (pruefeKollision(
            bella.x, bella.y, hb.spieler.breite, hb.spieler.hoehe,
            h.x, h.y, 54, 54
        )) {
            spiel.bonusHerzen.splice(i, 1);
            if (spiel.herzen < spiel.maxHerzen) spiel.herzen += 1;
            spiel.punkte += KONFIG.PUNKTE_STERN;
            Sound.extraherz();
            erzeugePartikel(spiel.partikel, h.x, h.y, 10, ['💖', '💗', '✨']);
            continue;
        }

        if (h.y >= KONFIG.BODEN_Y - 6) {
            erzeugePartikel(spiel.partikel, h.x, KONFIG.BODEN_Y - 6, 3, ['💔', '✨']);
            spiel.bonusHerzen.splice(i, 1);
        }
    }
}

// Einen Regenbogen-Strahl aus Bellas Horn abfeuern.
// Der Strahl zielt automatisch auf die Wolke – so klappt es immer.
function feuereStrahl() {
    const boss = spiel.boss;
    const hornX = bella.x + bella.richtung * 25;
    const hornY = bella.y - 58;

    const dx = boss.x - hornX;
    const dy = boss.y - hornY;
    const dist = Math.max(1, Math.hypot(dx, dy));
    const tempo = 13;

    spiel.strahlen.push({
        x: hornX, y: hornY,
        vx: dx / dist * tempo,
        vy: dy / dist * tempo,
        farbe: Math.floor(Math.random() * REGENBOGEN.length),
        leben: 90,
        spur: []
    });

    Sound.strahl();
    erzeugePartikel(spiel.partikel, hornX, hornY, 3, ['✨', '🌈']);
}

// Prüft, ob ein Strahl die Wolke trifft.
function pruefeStrahlTreffer() {
    const boss = spiel.boss;
    if (boss.besiegt) return;

    for (let i = spiel.strahlen.length - 1; i >= 0; i--) {
        const s = spiel.strahlen[i];
        if (boss.trefferCooldown <= 0 && Math.hypot(s.x - boss.x, s.y - boss.y) < 60) {
            spiel.strahlen.splice(i, 1);
            trefferAufBoss(s.x, s.y);
        }
    }
}

function trefferAufBoss(x, y) {
    const boss = spiel.boss;
    boss.treffer += 1;
    boss.zittern = 12;
    boss.trefferCooldown = 8;
    spiel.punkte += KONFIG.PUNKTE_BOSS_TREFFER;
    Sound.bossTreffer();
    erzeugePartikel(spiel.partikel, x, y, 10, ['✨', '💖', '🌈', '⭐']);

    if (boss.treffer >= boss.maxTreffer) {
        boss.besiegt = true;
        boss.siegTimer = 320; // ~5,3 Sekunden ausgiebig feiern
        spiel.tropfen = []; // alle fallenden Tropfen verschwinden
        spiel.funken = [];  // ebenso die Energie-Funken
        spiel.bonusHerzen = [];
        spiel.minibienen = [];
        // Das befreite Fohlen zählt als geretteter Freund!
        spiel.fortschritt.freunde[spiel.level.name] = spiel.level.freundEmoji || '💖';
        speichereFortschritt();
        // Die große Zauberblase platzt – das Fohlen ist frei! 🫧
        if (spiel.fohlenBlase) {
            spiel.fohlenBlase.befreit = true;
            Sound.rettung();
            const fohlen = KONFIG.FOHLEN[spiel.level.fohlen];
            if (fohlen) {
                Stimme.sprich('Danke, Lara! Ihr habt mich gerettet!', 'fohlen',
                    'befreit-' + stimmSchluessel(fohlen.name));
            }
            erzeugePartikel(spiel.partikel, 92, 195, 20, ['🫧', '💖', '✨', '🌟', '💜']);
        }
        Sound.sieg();
        Musik.start('fest'); // Jubel-Musik zur Sieges-Feier!
        erzeugePartikel(spiel.partikel, boss.x, boss.y, 46, ['🌈', '💖', '🌸', '✨', '💗', '⭐', '🎉', '🌟']);
    }
}

// Tropfen fallen lassen – trifft einer Bella, kostet das ein Herz
// (gleiche freundliche Behandlung wie ein Hindernis).
function aktualisiereTropfen(dt) {
    const hb = KONFIG.HITBOX;
    for (let i = spiel.tropfen.length - 1; i >= 0; i--) {
        const t = spiel.tropfen[i];
        t.y += t.vy * dt;

        if (pruefeKollision(
            bella.x, bella.y, hb.spieler.breite, hb.spieler.hoehe,
            t.x, t.y, 18, 22
        )) {
            spiel.tropfen.splice(i, 1);
            trefferDurchHindernis();
            continue;
        }

        if (t.y >= KONFIG.BODEN_Y) {
            erzeugePartikel(spiel.partikel, t.x, KONFIG.BODEN_Y - 6, 2, ['💧']);
            spiel.tropfen.splice(i, 1);
        }
    }
}

// Energie-Funken fallen lassen – fängt Bella einen, lädt das ihr Horn
// (eine Energie = ein Schuss). Verpasste Funken zerplatzen am Boden.
function aktualisiereFunken(dt) {
    const boss = spiel.boss;
    const hb = KONFIG.HITBOX;
    for (let i = spiel.funken.length - 1; i >= 0; i--) {
        const f = spiel.funken[i];
        f.x += f.vx * dt;
        f.y += f.vy * dt;

        // Eingefangen? (großzügige Sammel-Hitbox, kindgerecht)
        if (pruefeKollision(
            bella.x, bella.y, hb.spieler.breite, hb.spieler.hoehe,
            f.x, f.y, 54, 54
        )) {
            spiel.funken.splice(i, 1);
            if (boss.energie < boss.maxEnergie) boss.energie += 1;
            spiel.punkte += KONFIG.PUNKTE_BLUME;
            Sound.energie();
            erzeugePartikel(spiel.partikel, f.x, f.y, 8, ['✨', '🌈', '⭐', '💖']);
            continue;
        }

        if (f.y >= KONFIG.BODEN_Y - 6) {
            erzeugePartikel(spiel.partikel, f.x, KONFIG.BODEN_Y - 6, 2, ['✨']);
            spiel.funken.splice(i, 1);
        }
    }
}

// Bella drückt, hat aber keine Energie: nur ein kleines "Pfft"-Wölkchen
// am Horn, damit das Kind merkt "ich brauche erst einen Funken".
function fehlschuss() {
    const hornX = bella.x + bella.richtung * 25;
    const hornY = bella.y - 58;
    erzeugePartikel(spiel.partikel, hornX, hornY, 2, ['💨']);
    Sound.leer();
}

// =====================================================
// Bewegliche Gegner in den Lauf-Leveln
// =====================================================

function aktualisiereGegner(dt) {
    const s = aktiveSchwierigkeit();
    for (const o of spiel.objekte) {
        if (o.typ !== 'gegner') continue;

        if (o.art === 'krabbler' || o.art === 'pinguin') {
            // Watschelt/rutscht zwischen startX ± spanne hin und her
            o.x += o.richtung * (o.tempo || 1.4) * s.gegnerTempo * dt;
            if (o.x < o.startX - o.spanne) { o.x = o.startX - o.spanne; o.richtung = 1; }
            if (o.x > o.startX + o.spanne) { o.x = o.startX + o.spanne; o.richtung = -1; }

        } else if (o.art === 'flieger') {
            // Fliegt seitlich hin und her UND wippt auf und ab
            o.t += dt;
            o.x += o.richtung * (o.tempo || 1.1) * s.gegnerTempo * dt;
            if (o.x < o.startX - o.spanne) { o.x = o.startX - o.spanne; o.richtung = 1; }
            if (o.x > o.startX + o.spanne) { o.x = o.startX + o.spanne; o.richtung = -1; }
            o.y = o.basisY + Math.sin(o.t * 0.06) * (o.amplitude || 22);

        } else if (o.art === 'fledermaus') {
            // Schwirrt frei umher und prallt an den Rändern ihres Bereichs ab
            o.x += o.vx * (o.tempoX || 1.7) * s.gegnerTempo * dt;
            o.y += o.vy * (o.tempoY || 1.2) * s.gegnerTempo * dt;
            if (o.x < o.startX - o.spanneX) { o.x = o.startX - o.spanneX; o.vx = 1; }
            if (o.x > o.startX + o.spanneX) { o.x = o.startX + o.spanneX; o.vx = -1; }
            if (o.y < o.yMin) { o.y = o.yMin; o.vy = 1; }
            if (o.y > o.yMax) { o.y = o.yMax; o.vy = -1; }
            o.richtung = o.vx > 0 ? 1 : -1;

        } else if (o.art === 'werfer') {
            // Schaut Richtung Bella und wirft, wenn sie in der Nähe ist
            o.blick = bella.x >= o.x ? 1 : -1;
            o.wurfTimer -= dt;
            if (o.wurfTimer <= 0 && Math.abs(o.x - bella.x) < 520) {
                wirf(o);
                o.wurfTimer = (110 + Math.random() * 70) * s.wurfPause;
            }
        }
    }

    aktualisiereGeschosse(dt);
}

// Ein Werfer schleudert einen Matschball im Bogen Richtung Bella
function wirf(o) {
    const richtung = bella.x >= o.x ? 1 : -1;
    spiel.geschosse.push({
        x: o.x,
        y: KONFIG.BODEN_Y - 42,
        vx: richtung * (2.2 + Math.random() * 0.7),
        vy: -8.6,            // erst hoch, dann (durch Schwerkraft) wieder runter
        dreh: 0,
        drehTempo: (Math.random() - 0.5) * 0.6
    });
    Sound.wurf();
}

// Matschbälle fliegen im Bogen; sie treffen Bella oder zerplatzen am Boden
function aktualisiereGeschosse(dt) {
    const hb = KONFIG.HITBOX;
    for (let i = spiel.geschosse.length - 1; i >= 0; i--) {
        const g = spiel.geschosse[i];
        g.x += g.vx * dt;
        g.vy += KONFIG.SCHWERKRAFT * dt;
        g.y += g.vy * dt;
        g.dreh += g.drehTempo * dt;

        if (pruefeKollision(
            bella.x, bella.y, hb.spieler.breite, hb.spieler.hoehe,
            g.x, g.y, hb.geschoss.breite, hb.geschoss.hoehe
        )) {
            spiel.geschosse.splice(i, 1);
            trefferDurchHindernis();
            continue;
        }

        // Am Boden zerplatzt oder aus dem Bild geflogen
        if (g.y >= KONFIG.BODEN_Y - 4) {
            erzeugePartikel(spiel.partikel, g.x, KONFIG.BODEN_Y - 6, 3, ['💨']);
            spiel.geschosse.splice(i, 1);
        } else if (g.x < spiel.kamera - 80 || g.x > spiel.kamera + KONFIG.BREITE + 80) {
            spiel.geschosse.splice(i, 1);
        }
    }
}

// Kollisionen zwischen Bella und allen Level-Objekten
function pruefeObjekte() {
    const hb = KONFIG.HITBOX;

    for (const obj of spiel.objekte) {
        if (obj.eingesammelt) continue;
        if (obj.typ === 'spalt') continue; // Spalten werden separat geprüft

        let box;
        if (obj.typ === 'hindernis') box = hb.hindernis;
        else if (obj.typ === 'ziel') box = hb.ziel;
        else if (obj.typ === 'gegner') box = (obj.art === 'flieger' || obj.art === 'fledermaus') ? hb.gegnerFlug : hb.gegnerBoden;
        else if (obj.typ === 'freund') box = hb.freund;
        else box = hb.sammel;

        const trifft = pruefeKollision(
            bella.x, bella.y, hb.spieler.breite, hb.spieler.hoehe,
            obj.x, obj.y, box.breite, box.hoehe
        );
        if (!trifft) continue;

        if (obj.typ === 'blume') {
            obj.eingesammelt = true;
            spiel.blumen += 1;
            spiel.punkte += KONFIG.PUNKTE_BLUME;
            Sound.sammeln();
            erzeugePartikel(spiel.partikel, obj.x, obj.y, 6, KONFIG.SPRITES.glitzer);
            erzeugePopup(spiel.popups, obj.x, obj.y, '+' + KONFIG.PUNKTE_BLUME, '#ff6fb0');

        } else if (obj.typ === 'stern') {
            obj.eingesammelt = true;
            spiel.punkte += KONFIG.PUNKTE_STERN;
            bella.turbo = KONFIG.TURBO_DAUER; // Sternen-Turbo: kurz schneller rennen!
            Sound.stern();
            erzeugePartikel(spiel.partikel, obj.x, obj.y, 14, ['⭐', '✨', '🌟']);
            erzeugePopup(spiel.popups, obj.x, obj.y, '+' + KONFIG.PUNKTE_STERN + ' ⭐', '#f5a11a');

        } else if (obj.typ === 'herz') {
            obj.eingesammelt = true;
            if (spiel.herzen < spiel.maxHerzen) spiel.herzen += 1;
            Sound.extraherz();
            erzeugePartikel(spiel.partikel, obj.x, obj.y, 10, ['💖', '💗', '✨']);
            erzeugePopup(spiel.popups, obj.x, obj.y, '+ 💗', '#ff5d8f');

        } else if (obj.typ === 'sonne') {
            obj.eingesammelt = true;
            spiel.punkte += KONFIG.PUNKTE_STERN;
            loeseGewitterAuf();

        } else if (obj.typ === 'freund') {
            // Die Zauberblase zerplatzt – der Freund ist gerettet! 🫧
            if (!obj.gerettet) {
                obj.gerettet = true;
                obj.feier = 220; // so lange bleibt die "Danke, Lara!"-Sprechblase
                spiel.punkte += KONFIG.PUNKTE_FREUND;
                spiel.fortschritt.freunde[spiel.level.name] = obj.emoji;
                speichereFortschritt();
                Sound.rettung();
                const dankeSaetze = ['Danke, Lara!', 'Juchhu, ich bin frei!', 'Danke! Du bist die Beste!'];
                Stimme.sprich(dankeSaetze[Math.floor(Math.random() * dankeSaetze.length)], 'freund');
                erzeugePartikel(spiel.partikel, obj.x, obj.y, 18, ['🫧', '💖', '✨', '🌟', '💜']);
                erzeugePopup(spiel.popups, obj.x, obj.y - 20, '+' + KONFIG.PUNKTE_FREUND + ' 💖', '#9b7bea');
            }

        } else if (obj.typ === 'hindernis' || obj.typ === 'gegner') {
            trefferDurchHindernis();

        } else if (obj.typ === 'ziel') {
            levelGeschafft();
            return;
        }
    }
}

// Korallen-Spalten im Wasser-Level: die Säulen sind feste Wände.
// Ist Bella nicht im Spalt-Fenster, wird sie sanft davor gestoppt –
// sie muss also hoch-/runterschwimmen, um durchzukommen (kein Herz weg).
function pruefeSpalten() {
    const halbBreiteSp = KONFIG.HITBOX.spieler.breite / 2;
    const halbHoeheSp = KONFIG.HITBOX.spieler.hoehe / 2;

    for (const obj of spiel.objekte) {
        if (obj.typ !== 'spalt') continue;

        const halbWand = obj.breite / 2;
        const dx = bella.x - obj.x;
        if (Math.abs(dx) > halbWand + halbBreiteSp) continue;

        // Liegt Bella senkrecht im offenen Spalt?
        const imSpalt = Math.abs(bella.y - obj.gapY) < (obj.gapHeight / 2 - halbHoeheSp);
        if (imSpalt) continue;

        // Sonst: an der Seite, von der sie kommt, herausschieben
        if (dx <= 0) bella.x = obj.x - (halbWand + halbBreiteSp);
        else         bella.x = obj.x + (halbWand + halbBreiteSp);
    }
}

// Bella ist gegen ein Hindernis gelaufen
function trefferDurchHindernis() {
    if (bella.unverwundbar > 0) return; // gerade unverwundbar → nichts passiert

    spiel.herzen -= 1;
    bella.unverwundbar = KONFIG.UNVERWUNDBAR_DAUER * aktiveSchwierigkeit().unverwundbar;
    bella.vy = -6; // kleiner Hopser nach oben als sichtbares Feedback
    bella.amBoden = false;
    Sound.treffer();

    if (spiel.herzen <= 0) {
        spiel.zustand = 'nochmal';
        UI.zeigeBildschirm('nochmal');
    }
}

// Bella hat die Zauber-Sonne eingesammelt: Sie schießt einen Fächer
// aus Regenbogen-Strahlen nach oben, das Gewitter beginnt sich
// aufzulösen und die Sonne geht auf (siehe deko.gewitter.aufloesen).
function loeseGewitterAuf() {
    if (spiel.deko && spiel.deko.gewitter) spiel.deko.gewitter.aufloesen = true;

    // Der Sturm weicht der Sonne – auch in der Musik!
    // (beendet zugleich das Regenrauschen)
    Musik.start('wiese');

    const hornX = bella.x + bella.richtung * 25;
    const hornY = bella.y - 58;

    // Strahlen-Fächer schräg nach oben
    for (let i = 0; i < 9; i++) {
        const winkel = -Math.PI / 2 + (i - 4) * 0.14;
        const tempo = 11;
        spiel.strahlen.push({
            x: hornX, y: hornY,
            vx: Math.cos(winkel) * tempo,
            vy: Math.sin(winkel) * tempo,
            farbe: i % REGENBOGEN.length,
            leben: 75,
            spur: []
        });
    }

    erzeugePartikel(spiel.partikel, hornX, hornY, 22, ['🌈', '✨', '☀️', '💛', '⭐']);
    Sound.strahl();
    Sound.sieg();
}

// Mischt zwei #rrggbb-Farben (t = 0 → a, t = 1 → b) und gibt rgb() zurück.
// Wird für das sanfte Aufhellen des Himmels beim Auflösen genutzt.
function mischeFarben(a, b, t) {
    const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
    const ar = (pa >> 16) & 255, ag = (pa >> 8) & 255, ab = pa & 255;
    const br = (pb >> 16) & 255, bg = (pb >> 8) & 255, bb = pb & 255;
    const r = Math.round(ar + (br - ar) * t);
    const g = Math.round(ag + (bg - ag) * t);
    const bl = Math.round(ab + (bb - ab) * t);
    return 'rgb(' + r + ',' + g + ',' + bl + ')';
}

// Der Ziel-Regenbogen wurde erreicht
function levelGeschafft() {
    spiel.punkte += KONFIG.PUNKTE_LEVEL;

    // Nächstes Level freischalten + Highscore merken
    spiel.fortschritt.freigeschaltet = Math.max(
        spiel.fortschritt.freigeschaltet,
        Math.min(spiel.levelNr + 2, LEVELS.length)
    );
    spiel.fortschritt.highscore = Math.max(spiel.fortschritt.highscore, spiel.punkte);
    speichereFortschritt();

    Sound.sieg();
    erzeugePartikel(spiel.partikel, bella.x, bella.y - 40, 25, KONFIG.SPRITES.glitzer);

    const istLetztesLevel = spiel.levelNr >= LEVELS.length - 1;
    let bossText = null;
    if (spiel.level.boss) {
        let bossSatz = 'Die Grummelwolke lacht wieder! ⛅';
        if (spiel.boss && spiel.boss.art === 'biene') bossSatz = 'Die Brummel-Biene summt jetzt ganz lieb! 🐝';
        if (spiel.boss && spiel.boss.art === 'krake') bossSatz = 'Die Grummel-Krake winkt fröhlich mit allen Armen! 🐙';
        const fohlen = spiel.level.fohlen && KONFIG.FOHLEN[spiel.level.fohlen];
        bossText = (fohlen ? '🦄 <b>' + fohlen.name + '</b> ist frei – die Zauberblase ist geplatzt!<br>' : '') +
            bossSatz + '<br>Punkte: <b>' + spiel.punkte + '</b> ⭐';
    }

    // Wurde der Zauberblasen-Freund gerettet – oder wartet er noch?
    const levelFreund = spiel.objekte.find(function (o) { return o.typ === 'freund'; });
    let freundText = null;
    if (levelFreund) {
        freundText = levelFreund.gerettet
            ? '🫧 ' + levelFreund.name + ' ist wieder frei! 💖'
            : '🫧 ' + levelFreund.name + ' wartet noch in der Zauberblase – probier es gleich nochmal!';
    }

    UI.zeigeGeschafft(spiel.blumen, spiel.punkte, istLetztesLevel, spiel.level.sammelName || 'Blumen 🌸', bossText, freundText);
    spiel.zustand = 'geschafft';
    UI.zeigeBildschirm('geschafft');
}

// ---------- Pause & Ton ----------

function pauseUmschalten() {
    if (spiel.zustand === 'spiel') {
        spiel.zustand = 'pause';
        UI.zeigeBildschirm('pause');
    } else if (spiel.zustand === 'pause') {
        spiel.zustand = 'spiel';
        UI.zeigeBildschirm(null);
    }
}

function stummUmschalten() {
    UI.setzeStummKnopf(Sound.stummUmschalten());
}

// Stimmen an/aus – die Wahl wird gespeichert, damit sie beim
// nächsten Spielstart erhalten bleibt
function stimmeUmschalten() {
    const aus = Stimme.stummUmschalten();
    UI.setzeStimmeKnopf(aus);
    spiel.fortschritt.stimmeAus = aus;
    speichereFortschritt();
}

// ---------- Zeichnen ----------

function zeichneHimmel() {
    let farben = spiel.level
        ? spiel.level.farben
        : { himmelOben: '#e9d5ff', himmelUnten: '#fce7f3' };

    // Boss-Level: Sobald die Wolke besiegt ist, hellt der Himmel auf
    if (spiel.boss && spiel.boss.besiegt && spiel.level.farbenSieg) {
        farben = spiel.level.farbenSieg;
    }

    // Gewitter-Level: Beim Auflösen vom Sturm-Himmel zur Sonne überblenden
    const g = spiel.deko && spiel.deko.gewitter;
    if (g && g.t > 0 && spiel.level.farbenSonne) {
        farben = {
            himmelOben: mischeFarben(spiel.level.farben.himmelOben, spiel.level.farbenSonne.himmelOben, g.t),
            himmelUnten: mischeFarben(spiel.level.farben.himmelUnten, spiel.level.farbenSonne.himmelUnten, g.t)
        };
    }

    const verlauf = ctx.createLinearGradient(0, 0, 0, KONFIG.BODEN_Y);
    verlauf.addColorStop(0, farben.himmelOben);
    verlauf.addColorStop(1, farben.himmelUnten);
    ctx.fillStyle = verlauf;
    ctx.fillRect(0, 0, KONFIG.BREITE, KONFIG.HOEHE);
}

// Dunkelheit über der Nacht-Szene – mit einem hellen Lichtkreis,
// den Bellas Horn dorthin wirft, wo sie gerade hinläuft.
function zeichneNachtLicht() {
    const sx = bella.x - spiel.kamera;

    // Der Lichtkegel liegt etwas VOR Bella (in Laufrichtung),
    // damit man sieht, wo es hingeht
    const lichtX = sx + bella.richtung * 60;
    const lichtY = bella.y - 55;
    const dunkel = ctx.createRadialGradient(lichtX, lichtY, 80, lichtX, lichtY, 320);
    dunkel.addColorStop(0, 'rgba(16, 12, 48, 0)');
    dunkel.addColorStop(1, 'rgba(16, 12, 48, 0.78)');
    ctx.fillStyle = dunkel;
    ctx.fillRect(0, 0, KONFIG.BREITE, KONFIG.HOEHE);

    // Warmes, pulsierendes Glühen direkt an der Hornspitze
    const hornX = sx + bella.richtung * 28;
    const hornY = bella.y - 58;
    const puls = 0.5 + 0.12 * Math.sin(spiel.zeit * 0.15);
    const glut = ctx.createRadialGradient(hornX, hornY, 2, hornX, hornY, 55);
    glut.addColorStop(0, 'rgba(255, 230, 140, ' + puls.toFixed(3) + ')');
    glut.addColorStop(1, 'rgba(255, 230, 140, 0)');
    ctx.fillStyle = glut;
    ctx.fillRect(hornX - 60, hornY - 60, 120, 120);
}

function zeichneBoden() {
    const siegBoden = spiel.boss && spiel.boss.besiegt && spiel.level.farbenSieg;
    let wiese = siegBoden ? spiel.level.farbenSieg.wiese : spiel.level.farben.wiese;

    // Gewitter-Level: nasse Wiese hellt beim Auflösen zu saftigem Grün auf
    const g = spiel.deko && spiel.deko.gewitter;
    if (g && g.t > 0 && spiel.level.farbenSonne) {
        wiese = mischeFarben(spiel.level.farben.wiese, spiel.level.farbenSonne.wiese, g.t);
    }

    // Sanfter Verlauf statt flacher Fläche: oben hell und saftig,
    // nach unten satter/dunkler – gibt dem Boden richtig Tiefe
    const verlauf = ctx.createLinearGradient(0, KONFIG.BODEN_Y, 0, KONFIG.HOEHE);
    verlauf.addColorStop(0, toneFarbe(wiese, 0.16));
    verlauf.addColorStop(1, toneFarbe(wiese, -0.22));
    ctx.fillStyle = verlauf;
    ctx.fillRect(0, KONFIG.BODEN_Y, KONFIG.BREITE, KONFIG.HOEHE - KONFIG.BODEN_Y);

    // Heller Streifen als Wiesen-Oberkante
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.fillRect(0, KONFIG.BODEN_Y, KONFIG.BREITE, 6);

    if (spiel.level.eis) {
        // Eis glänzt: schräge helle Schlieren, die mit der Welt scrollen
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.beginPath();
        for (let wx = Math.floor(spiel.kamera / 130) * 130; wx < spiel.kamera + KONFIG.BREITE + 130; wx += 130) {
            const sx = wx - spiel.kamera + pseudoZufall(wx) * 60;
            const y = KONFIG.BODEN_Y + 18 + pseudoZufall(wx + 7) * 46;
            ctx.moveTo(sx, y);
            ctx.lineTo(sx + 34, y - 9);
        }
        ctx.stroke();
        return;
    }

    // Kleine Grasbüschel entlang der Oberkante (scrollen mit der Welt;
    // unter Wasser wächst stattdessen Seegras auf dem Sand). In der
    // Wolkenwelt (fest) wächst kein Gras auf den Wolken!
    if (spiel.level.fest) return;
    ctx.save();
    ctx.globalAlpha = 0.55;
    ctx.strokeStyle = spiel.level.wasser ? '#4da894' : toneFarbe(wiese, -0.22);
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (let wx = Math.floor(spiel.kamera / 46) * 46; wx < spiel.kamera + KONFIG.BREITE + 46; wx += 46) {
        const sx = wx - spiel.kamera + pseudoZufall(wx) * 34;
        const h = 5 + pseudoZufall(wx + 3) * 5;
        // Drei kurze Halme, die fächerförmig auseinanderneigen
        for (let k = -1; k <= 1; k++) {
            const neig = k * (3 + pseudoZufall(wx + k * 17) * 2.5);
            ctx.moveTo(sx, KONFIG.BODEN_Y + 6);
            ctx.quadraticCurveTo(
                sx + neig * 0.3, KONFIG.BODEN_Y + 6 - h * 0.6,
                sx + neig, KONFIG.BODEN_Y + 4 - h - (k === 0 ? 2 : 0));
        }
    }
    ctx.stroke();
    ctx.restore();
}

function zeichne() {
    zeichneHimmel();

    if (spiel.level) {
        zeichneHimmelDeko(ctx, spiel.deko, spiel.kamera, spiel.zeit, spiel.level);

        // Parallax-Hügel am Horizont (im Gewitter-Level blenden sie
        // beim Auflösen sanft zu den Sonnen-Farben über)
        let huegel = spiel.level.huegel;
        const gw = spiel.deko && spiel.deko.gewitter;
        if (huegel && gw && gw.t > 0 && spiel.level.huegelSonne) {
            huegel = {
                fern: mischeFarben(spiel.level.huegel.fern, spiel.level.huegelSonne.fern, gw.t),
                nah: mischeFarben(spiel.level.huegel.nah, spiel.level.huegelSonne.nah, gw.t)
            };
        }
        zeichneHuegel(ctx, spiel.kamera, huegel, spiel.level);

        // Boss-Level: Wolke bzw. Biene schwebt am Himmel (+ Bonus-Sonne)
        if (spiel.boss) {
            zeichneBoss(ctx, spiel.boss, spiel.zeit);
            zeichneBonusSonne(ctx, spiel.boss);
        }

        zeichneBoden();
        zeichneBodenDeko(ctx, spiel.deko, spiel.kamera, spiel.zeit);

        for (const p of spiel.plattformen) {
            zeichnePlattform(ctx, p, spiel.kamera, spiel.level);
        }

        for (const obj of spiel.objekte) {
            if (!obj.eingesammelt) zeichneObjekt(ctx, obj, spiel.kamera, spiel.zeit);
        }

        // Fallende Grummel-Tropfen + bunte Energie-Funken + Bonus-Herzen
        if (spiel.boss) {
            // Das entführte Fohlen in seiner großen Blase (bzw. befreit)
            if (spiel.fohlenBlase) {
                zeichneFohlenBlase(ctx, spiel.fohlenBlase, spiel.zeit, spiel.level.fohlen);
            }
            zeichneTropfen(ctx, spiel.tropfen, spiel.kamera);
            zeichneFunken(ctx, spiel.funken, spiel.kamera, spiel.zeit);
            zeichneBonusHerzen(ctx, spiel.bonusHerzen, spiel.kamera, spiel.zeit);
            zeichneMinibienen(ctx, spiel.minibienen, spiel.kamera, spiel.zeit);
        }

        // Finale: die drei geretteten Fohlen feiern am Regenbogen mit
        if (spiel.level.fest) {
            zeichneFestFohlen(ctx, spiel.kamera, spiel.zeit, spiel.level.laenge);
        }

        // Geworfene Matschbälle der Werfer-Gegner
        if (spiel.geschosse.length) zeichneGeschosse(ctx, spiel.geschosse, spiel.kamera);

        bella.zeichne(ctx, spiel.kamera, spiel.zeit);

        // Intro-Szene: die Fohlen und die Grummel-Blasen
        if (spiel.zustand === 'intro') zeichneIntro(ctx);

        zeichnePartikel(ctx, spiel.partikel, spiel.kamera);

        // "+10"-Belohnungen steigen über den Partikeln auf
        zeichnePopups(ctx, spiel.popups, spiel.kamera);

        // Zauberstaub funkelt über der ganzen Szene
        zeichneZauberstaub(ctx, spiel.deko, spiel.zeit);

        // Regenbogen-Strahlen liegen über allem (Boss-Strahlen wie auch
        // der Sonnen-Strahl im Gewitter-Level)
        if (spiel.strahlen.length) zeichneStrahlen(ctx, spiel.strahlen, spiel.kamera);

        // Gewitter-Level: Regen + Blitze, Eis-Level: Schneetreiben
        if (spiel.level.regen || spiel.level.schnee) zeichneRegen(ctx, spiel.deko);

        // Nacht-Level: Dunkelheit + Bellas leuchtendes Horn
        if (spiel.level.nachts) {
            zeichneNachtLicht();
        }

        // Sanfte Vignette über der ganzen Szene (unter dem HUD)
        zeichneVignette(ctx);

        if (spiel.zustand === 'spiel' || spiel.zustand === 'pause') {
            UI.zeichneHUD(ctx, spiel);
            if (spiel.boss && !spiel.boss.besiegt) {
                UI.zeichneBossLeiste(ctx, spiel.boss);
                UI.zeichneBossEnergie(ctx, spiel.boss);
            }
        }
    }

    // Animierte Bella auf dem Startbildschirm
    if (spiel.zustand === 'start') {
        UI.zeichneVorschau(spiel.zeit);
    }

    // Boss-Geschichte: das gefangene Fohlen in seiner Blase (animiert)
    if (spiel.zustand === 'geschichte') {
        UI.zeichneGeschichteFohlen(spiel.zeit);
    }
}

// ---------- Game-Loop ----------

let letzteZeit = 0;

function schleife(zeitstempel) {
    // dt = 1 entspricht einem Frame bei 60 fps; nach Tab-Wechseln
    // wird der Wert begrenzt, damit nichts "springt".
    const dt = Math.min((zeitstempel - letzteZeit) / 16.667, 3);
    letzteZeit = zeitstempel;

    aktualisiere(dt);
    zeichne();
    requestAnimationFrame(schleife);
}

// ---------- Skalierung (responsiv) ----------

function skaliere() {
    const faktor = Math.min(
        window.innerWidth / KONFIG.BREITE,
        window.innerHeight / KONFIG.HOEHE
    );
    document.getElementById('spiel-container').style.transform = 'scale(' + faktor + ')';
}

// ---------- Start ----------

function init() {
    UI.init();

    Eingabe.init({
        beiPause: pauseUmschalten,
        beiStumm: stummUmschalten,
        beiStimme: stimmeUmschalten
    });

    // Gespeicherte Stimmen-Einstellung wiederherstellen
    Stimme.aus = !!spiel.fortschritt.stimmeAus;
    UI.setzeStimmeKnopf(Stimme.aus);

    // Gemeinsamer Stumm-Zustand aller Spiele (hub.stumm) – Symbol angleichen
    UI.setzeStummKnopf(Sound.stumm);

    // Menü-Knöpfe verdrahten
    function knopf(id, aktion) {
        document.getElementById(id).addEventListener('click', function () {
            Sound.init();
            Stimme.init();
            Sound.klick();
            aktion();
        });
    }

    // "Spielen": Beim allerersten Mal läuft die Intro-Szene,
    // danach geht es direkt ins höchste freigeschaltete Level.
    knopf('spielen-knopf', function () {
        if (!spiel.fortschritt.introGesehen) starteIntro();
        else starteLevel(spiel.fortschritt.freigeschaltet - 1);
    });
    knopf('intro-knopf', starteIntro);
    knopf('intro-weiter-knopf', beendeIntro);
    knopf('pause-knopf', pauseUmschalten);
    knopf('mute-knopf', stummUmschalten);
    knopf('stimme-knopf', stimmeUmschalten);
    knopf('weiter-spielen-knopf', pauseUmschalten);
    knopf('pause-menue-knopf', zeigeStartbildschirm);
    knopf('geschichte-los-knopf', geschichteWeiter);
    // Nach "Ohje" direkt neu starten – die Geschichte kennt das Kind schon
    knopf('nochmal-knopf', function () { starteLevelOhneGeschichte(spiel.levelNr); });
    knopf('nochmal-menue-knopf', zeigeStartbildschirm);
    knopf('naechstes-level-knopf', function () {
        if (spiel.levelNr >= LEVELS.length - 1) {
            zeigeStartbildschirm();
        } else {
            starteLevel(spiel.levelNr + 1);
        }
    });

    // Level 1 als hübsche Kulisse hinter dem Startbildschirm laden
    ladeLevel(0);
    zeigeStartbildschirm();

    window.addEventListener('resize', skaliere);
    skaliere();

    requestAnimationFrame(schleife);
}

init();
