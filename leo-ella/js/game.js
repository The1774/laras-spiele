// =====================================================
// Leo Ella – Spiellogik
//
// Leo hat drei Bedürfnisse (satt, sauber, ausgeschlafen, je 0–100),
// die in echter Zeit langsam sinken – auch wenn das Spiel zu ist.
// Lara füttert, gibt Wasser, putzt mit dem Schwamm, streichelt,
// kitzelt und bringt Leo abends ins Bett. Jede Aktion löst eine
// kurze Reaktion aus (1–3 Sekunden), danach zeigt Leo wieder ihren
// Zustand. Es gibt kein Verlieren und nichts Dramatisches.
//
// Module: gemeinsam/{speicher,audio,skalierung,eingabe,partikel}.js,
//         js/config.js (Zahlen), js/leo.js (Figur), js/zimmer.js (Tag/Nacht)
// =====================================================

(function () {
    'use strict';

    var Ablage = Speicher.fuer('leoella');
    var partikel = Partikel.erstelle();
    var buehne, canvas, ctx;

    // ---------- Leos Bedürfnisse (wird gespeichert) ----------

    var leo = {
        satt: 80,
        sauber: 80,
        ausgeschlafen: 80,
        schlaeft: false,
        zeit: Date.now(),          // Zeitpunkt der letzten Fortschreibung
        zuletztAktion: Date.now()  // letzte Pflege durch Lara
    };

    // ---------- Laufzeit-Zustand (wird nicht gespeichert) ----------

    var spiel = {
        zustand: 'zufrieden',
        reaktion: null,
        reaktionTimer: null,
        modus: null,           // 'schwamm' während des Putzens
        schnurrt: false,
        schnurrTimer: null,
        letztesHerz: 0,
        letztesSchnurren: 0,
        tipps: [],             // Zeitpunkte der letzten Tipps auf Leo (Kitzeln)
        zzzZaehler: 0,
        speicherZaehler: 0,
        letzteZeit: 0
    };

    // ---------- Speichern und Laden ----------

    function laden() {
        var g = Ablage.get(KONFIG.SPEICHER_SCHLUESSEL, null);
        if (g) {
            for (var k in leo) if (typeof g[k] === typeof leo[k]) leo[k] = g[k];
        }
        // Zeit, die seit dem letzten Besuch vergangen ist, nachholen
        fortschreiben(Date.now(), false);
    }

    function speichern() {
        leo.zeit = Date.now();
        Ablage.set(KONFIG.SPEICHER_SCHLUESSEL, leo);
    }

    function begrenze(w, min, max) { return Math.max(min, Math.min(max, w)); }

    // Bedürfnisse anhand der vergangenen Zeit weiterrechnen.
    // imSpiel = true: pro Frame (Schlafen füllt schnell auf)
    // imSpiel = false: Nachholen nach Abwesenheit (nichts fällt unter die Untergrenze)
    function fortschreiben(jetzt, imSpiel) {
        var sekunden = (jetzt - leo.zeit) / 1000;
        leo.zeit = jetzt;
        if (sekunden <= 0) return;
        var untergrenze = imSpiel ? 0 : KONFIG.UNTERGRENZE_NACH_ABWESENHEIT;

        function sinke(name) {
            var proSekunde = 100 / (KONFIG.ABNAHME_STUNDEN[name] * 3600);
            var neu = leo[name] - proSekunde * sekunden;
            leo[name] = Math.max(Math.min(leo[name], untergrenze), neu);
        }
        sinke('satt');
        sinke('sauber');

        if (leo.schlaeft) {
            var dauer = imSpiel ? KONFIG.SCHLAF_SEKUNDEN_IM_SPIEL : KONFIG.SCHLAF_STUNDEN_GESCHLOSSEN * 3600;
            leo.ausgeschlafen = begrenze(leo.ausgeschlafen + 100 / dauer * sekunden, 0, 100);
        } else {
            sinke('ausgeschlafen');
        }
    }

    // ---------- Zustand bestimmen ----------

    function istAbend() {
        var h = new Date().getHours();
        return h >= KONFIG.ABEND_AB_UHR || h < KONFIG.MORGEN_AB_UHR;
    }

    function zustandBestimmen() {
        if (leo.schlaeft) return 'schlafend';
        var stundenSeitAktion = (Date.now() - leo.zuletztAktion) / 3600000;
        if (stundenSeitAktion >= KONFIG.TRAURIG_NACH_STUNDEN) return 'traurig';

        // Das dringendste Bedürfnis gewinnt
        var kandidaten = [];
        if (leo.satt < KONFIG.SCHWELLE_HUNGRIG) kandidaten.push({ name: 'hungrig', wert: leo.satt });
        if (leo.sauber < KONFIG.SCHWELLE_SCHMUTZIG) kandidaten.push({ name: 'schmutzig', wert: leo.sauber });
        if (leo.ausgeschlafen < KONFIG.SCHWELLE_MUEDE) kandidaten.push({ name: 'muede', wert: leo.ausgeschlafen });
        else if (istAbend() && leo.ausgeschlafen < KONFIG.ABEND_MUEDE_UNTER) kandidaten.push({ name: 'muede', wert: KONFIG.SCHWELLE_MUEDE });
        if (!kandidaten.length) return 'zufrieden';
        kandidaten.sort(function (a, b) { return a.wert - b.wert; });
        return kandidaten[0].name;
    }

    // Zustand neu berechnen und – wenn gerade keine Reaktion läuft – zeigen
    function zeigeZustand() {
        var neu = zustandBestimmen();
        var gewechselt = neu !== spiel.zustand;
        spiel.zustand = neu;
        if (!spiel.reaktion && !spiel.schnurrt) {
            if (gewechselt || !Leo.aktuellesGesicht) Leo.zeigeZustand(neu);
        }
    }

    // ---------- Reaktionen ----------

    function starteReaktion(name, dauer, danach) {
        if (spiel.reaktionTimer) clearTimeout(spiel.reaktionTimer);
        spiel.reaktion = name;
        Leo.zeigeReaktion(name, spiel.zustand);
        spiel.reaktionTimer = setTimeout(function () {
            spiel.reaktion = null;
            spiel.reaktionTimer = null;
            Leo.zeigeZustand(zustandBestimmen());
            spiel.zustand = zustandBestimmen();
            if (danach) danach();
        }, dauer);
    }

    // Lara hat sich gekümmert – zählt gegen „traurig"
    function aktion() {
        leo.zuletztAktion = Date.now();
        speichern();
    }

    // Leos Kopf auf der Bühne (Partikel-Ursprung)
    function kopfX() { return KONFIG.LEO.x + 160 * KONFIG.LEO.faktor; }
    function kopfY() { return KONFIG.LEO.y + 120 * KONFIG.LEO.faktor; }

    function beschaeftigt() {
        if (spiel.modus === 'schwamm') schwammEnde(); // eine andere Kachel beendet das Putzen
        return leo.schlaeft || spiel.reaktion !== null;
    }

    // ---------- Aktionen ----------

    function fuettern() {
        if (beschaeftigt()) return;
        leo.satt = begrenze(leo.satt + KONFIG.FUTTER_PLUS, 0, 100);
        leo.sauber = begrenze(leo.sauber - KONFIG.ESSEN_MACHT_SCHMUTZIG, 0, 100);
        aktion();
        Sound.schmatzen();
        setTimeout(function () { Sound.extraherz(); }, 700);
        partikel.herzen(kopfX(), kopfY() - 40, 3);
        partikel.funkeln(kopfX(), kopfY(), 8);
        starteReaktion('danke', KONFIG.DAUER.danke);
    }

    function trinken() {
        if (beschaeftigt()) return;
        leo.satt = begrenze(leo.satt + KONFIG.WASSER_PLUS, 0, 100);
        aktion();
        Sound.blubbern();
        partikel.blasen(kopfX() - 120, kopfY() + 80, 5);
        partikel.herzen(kopfX(), kopfY() - 40, 2);
        starteReaktion('trinken', KONFIG.DAUER.trinken);
    }

    // Schwamm: Ist Leo schmutzig, wird gewischt – sonst gleich frisch
    function schwammStart() {
        if (leo.schlaeft || spiel.reaktion) return;
        if (spiel.modus === 'schwamm') { schwammEnde(); return; }
        if (spiel.zustand !== 'schmutzig' || Leo.fleckenUebrig() === 0) {
            frischGeputzt();
            return;
        }
        spiel.modus = 'schwamm';
        buehne.classList.add('schwamm-modus');
        document.getElementById('kachel-schwamm').classList.add('aktiv');
        Sound.klick();
    }

    function schwammEnde() {
        spiel.modus = null;
        buehne.classList.remove('schwamm-modus');
        document.getElementById('kachel-schwamm').classList.remove('aktiv');
    }

    function schwammBewegen(x, y) {
        var c = document.getElementById('schwamm-cursor');
        c.style.left = x + 'px';
        c.style.top = y + 'px';
        if (!Leo.trifft(x, y)) return;
        var p = Leo.zuLeo(x, y);
        if (Leo.fleckWischen(p.x, p.y)) {
            Sound.platsch();
            partikel.tropfen(x, y, 5);
            partikel.blasen(x, y, 3);
            if (Leo.fleckenUebrig() === 0) {
                schwammEnde();
                frischGeputzt();
            }
        }
    }

    function frischGeputzt() {
        leo.sauber = 100;
        aktion();
        // erst schütteln (Tropfen fliegen), dann aufplustern und glänzen
        Sound.platsch();
        partikel.tropfen(kopfX(), kopfY() + 60, 12);
        starteReaktion('schuetteln', 750, function () {
            Sound.stern();
            partikel.funkeln(kopfX(), kopfY(), 14);
            partikel.blasen(kopfX(), kopfY() + 40, 6);
            starteReaktion('frisch', KONFIG.DAUER.frisch);
        });
    }

    // Streicheln: solange der Finger über Leo streicht, schnurrt sie
    function streichelBewegung(x, y) {
        if (leo.schlaeft || spiel.modus || (spiel.reaktion && !spiel.schnurrt)) return;
        if (!Leo.trifft(x, y)) return;
        var jetzt = performance.now();
        if (!spiel.schnurrt) {
            spiel.schnurrt = true;
            spiel.reaktion = 'schnurren';
            Leo.zeigeReaktion('schnurren', spiel.zustand);
            Sound.schnurren(1.0);
            spiel.letztesSchnurren = jetzt;
        }
        if (jetzt - spiel.letztesHerz > 180) {
            partikel.herzen(x, y - 20, 1);
            spiel.letztesHerz = jetzt;
        }
        if (jetzt - spiel.letztesSchnurren > 950) {
            Sound.schnurren(1.0);
            spiel.letztesSchnurren = jetzt;
        }
        if (spiel.schnurrTimer) clearTimeout(spiel.schnurrTimer);
        spiel.schnurrTimer = setTimeout(schnurrEnde, KONFIG.SCHNURR_NACHLAUF_MS);
    }

    function schnurrEnde() {
        if (!spiel.schnurrt) return;
        spiel.schnurrt = false;
        spiel.reaktion = null;
        aktion();
        spiel.zustand = zustandBestimmen();
        Leo.zeigeZustand(spiel.zustand);
    }

    // Kachel „Streicheln": ein kurzes Schnurren ohne Finger
    function streichelnKachel() {
        if (beschaeftigt()) return;
        aktion();
        Sound.schnurren(1.6);
        var n = 0;
        var t = setInterval(function () {
            partikel.herzen(kopfX() + (n % 2 ? 60 : -60), kopfY(), 1);
            if (++n >= 8) clearInterval(t);
        }, 200);
        starteReaktion('schnurren', 1800);
    }

    function kitzeln() {
        if (beschaeftigt()) return;
        aktion();
        Sound.kichern();
        setTimeout(function () { Sound.kichern(); }, 700);
        starteReaktion('kitzeln', KONFIG.DAUER.kitzeln);
    }

    // Antippen: dreimal schnell = Kitzeln, sonst ein kleines „Mrrp?"
    function leoAngetippt() {
        var jetzt = performance.now();
        spiel.tipps = spiel.tipps.filter(function (t) { return jetzt - t < KONFIG.KITZEL_FENSTER_MS; });
        spiel.tipps.push(jetzt);
        if (spiel.tipps.length >= KONFIG.KITZEL_TIPPS) {
            spiel.tipps = [];
            kitzeln();
            return;
        }
        if (beschaeftigt()) return;
        Sound.mrrp();
        starteReaktion('blinzeln', 180);
    }

    // Decke: Gute Nacht – Leo gähnt, das Licht dimmt, dann schläft sie
    function decke() {
        if (beschaeftigt()) return;
        aktion();
        schwammEnde();
        Sound.gaehnen();
        setTimeout(function () { Sound.schlaflied(); }, 900);
        partikel.herzen(kopfX() + 100, kopfY() - 60, 1, { groesse: 16 });
        starteReaktion('gutenacht', KONFIG.DAUER.gutenacht, schlafen);
        // Licht dimmt schon während des Gähnens
        setTimeout(function () { Zimmer.setzeDaemmerung(true); }, 1400);
    }

    function schlafen() {
        leo.schlaeft = true;
        Zimmer.setzeNacht(true);
        spiel.zustand = 'schlafend';
        Leo.zeigeZustand('schlafend');
        speichern();
    }

    // Sonne: Guten Morgen – Leo wacht ausgeschlafen auf und freut sich
    function aufwachen() {
        if (!leo.schlaeft) return;
        leo.schlaeft = false;
        leo.ausgeschlafen = 100;
        aktion();
        Zimmer.setzeNacht(false);
        partikel.leeren();
        Sound.morgen();
        spiel.zustand = zustandBestimmen();
        Leo.zeigeZustand(spiel.zustand);
        setTimeout(function () {
            partikel.herzen(kopfX(), kopfY() - 60, 1, { groesse: 34 });
            starteReaktion('wiedersehen', KONFIG.DAUER.wiedersehen);
        }, 900);
    }

    function wiedersehen() {
        Sound.extraherz();
        partikel.herzen(kopfX(), kopfY() - 60, 1, { groesse: 34 });
        partikel.funkeln(kopfX(), kopfY(), 6);
        starteReaktion('wiedersehen', KONFIG.DAUER.wiedersehen);
    }

    // ---------- Status-Ringe ----------

    var UMFANG = 289;

    function ringSetzen(id, wert, schwelle) {
        var ring = document.getElementById(id);
        ring.querySelector('.fuellung').setAttribute('stroke-dashoffset', UMFANG * (1 - wert / 100));
        ring.classList.toggle('niedrig', wert < schwelle);
    }

    function ringeAktualisieren() {
        ringSetzen('ring-satt', leo.satt, KONFIG.SCHWELLE_HUNGRIG);
        ringSetzen('ring-sauber', leo.sauber, KONFIG.SCHWELLE_SCHMUTZIG);
        ringSetzen('ring-ausgeschlafen', leo.ausgeschlafen, KONFIG.SCHWELLE_MUEDE);
    }

    // ---------- Ton ----------

    function tonAnzeigen() {
        document.getElementById('ton-knopf').classList.toggle('stumm', Sound.stumm);
    }

    // ---------- Spielschleife ----------

    function schleife(zeit) {
        var dt = spiel.letzteZeit ? Math.min((zeit - spiel.letzteZeit) / 1000, 0.1) : 0;
        spiel.letzteZeit = zeit;

        fortschreiben(Date.now(), true);

        // Zzz vom Bett aufsteigen lassen
        if (leo.schlaeft) {
            spiel.zzzZaehler += dt;
            if (spiel.zzzZaehler > 1.3) {
                spiel.zzzZaehler = 0;
                var b = Zimmer.bettPosition();
                partikel.zzz(b.x + Math.random() * 20, b.y, Math.random() < 0.3);
            }
        }

        partikel.update(dt);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        partikel.zeichne(ctx);

        // Ringe, Zustand und Speichern nur alle paar Frames
        spiel.speicherZaehler += dt;
        if (spiel.speicherZaehler > 0.5) {
            spiel.speicherZaehler = 0;
            ringeAktualisieren();
            zeigeZustand();
            // Beim Schlafen im Spiel: ausgeschlafen voll → von selbst aufwachen
            // (abends nicht – da darf Leo bis zum Sonnen-Knopf oder bis morgen schlafen)
            if (leo.schlaeft && leo.ausgeschlafen >= 100 && !spiel.reaktion && !istAbend()) aufwachen();
        }

        requestAnimationFrame(schleife);
    }

    // ---------- Start ----------

    function init() {
        buehne = document.getElementById('buehne');
        canvas = document.getElementById('partikel');
        ctx = canvas.getContext('2d');

        Skalierung.init(buehne, KONFIG.BREITE, KONFIG.HOEHE);
        Leo.init();
        Zimmer.init();
        laden();

        // Gesten auf der Bühne (Knöpfe regeln sich selbst per click)
        Eingabe.init(buehne, {
            beiTippen: function (x, y) {
                if (Leo.trifft(x, y)) leoAngetippt();
            },
            beiZiehen: function (x, y, sx, sy, phase) {
                if (spiel.modus === 'schwamm') { schwammBewegen(x, y); return; }
                if (phase !== 'ende') streichelBewegung(x, y);
            }
        });

        function knopf(id, fn) {
            document.getElementById(id).addEventListener('click', function () {
                Sound.init();
                fn();
            });
        }
        knopf('kachel-futter', fuettern);
        knopf('kachel-wasser', trinken);
        knopf('kachel-schwamm', schwammStart);
        knopf('kachel-streicheln', streichelnKachel);
        knopf('kachel-decke', decke);
        knopf('kachel-sonne', aufwachen);
        knopf('ton-knopf', function () {
            Sound.stummUmschalten();
            tonAnzeigen();
            if (!Sound.stumm) Sound.klick();
        });

        tonAnzeigen();
        Zimmer.setzeNacht(leo.schlaeft);
        spiel.zustand = zustandBestimmen();
        Leo.zeigeZustand(spiel.zustand);
        ringeAktualisieren();

        // Beim Öffnen: ausgeschlafen → Guten Morgen; nach einer Weile → Wiedersehensfreude
        var minutenWeg = (Date.now() - leo.zuletztAktion) / 60000;
        if (leo.schlaeft && leo.ausgeschlafen >= 100 && !istAbend()) {
            setTimeout(aufwachen, 800);
        } else if (!leo.schlaeft && spiel.zustand !== 'traurig' && minutenWeg >= KONFIG.WIEDERSEHEN_NACH_MINUTEN) {
            setTimeout(wiedersehen, 500);
        }

        // Speichern, wenn das Tablet die Seite wegschaltet
        document.addEventListener('visibilitychange', function () {
            if (document.hidden) speichern();
        });
        window.addEventListener('pagehide', speichern);
        setInterval(speichern, 10000);

        requestAnimationFrame(schleife);
    }

    init();
})();
