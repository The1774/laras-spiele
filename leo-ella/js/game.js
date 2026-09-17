// =====================================================
// Leo Ella – Spiellogik
//
// Leo hat drei Bedürfnisse (satt, sauber, ausgeschlafen, je 0–100),
// die in echter Zeit langsam sinken – auch wenn das Spiel zu ist.
//
// Die Regel für alles, was Lara tut: sie macht es mit der Hand, und Leo
// reagiert schon währenddessen.
//   - Füttern:   Fisch, Milch, Keks oder Apfel aus dem Korb zum Maul ziehen.
//                Leo schaut dem Futter nach, macht das Maul auf, beißt dreimal ab.
//                Fisch ist das Lieblingsessen, Keks gibt es nur, wenn sie nicht
//                schon satt ist, am Apfel schnuppert sie erst.
//   - Trinken:   die Flasche ans Maul halten – sie kippt, der Pegel sinkt.
//   - Streicheln: mit dem Finger über Leo – jede Körperzone reagiert anders
//                (Kopf, Kinn, Ohr, Rücken, Bauch, Pfote). Je gleichmäßiger,
//                desto lauter schnurrt sie.
//   - Schlafen:  Vorhang am Fenster zuziehen, Lampe antippen, die Decke vom
//                Bett über Leo ziehen – dann gähnt sie und schläft ein.
//   - Schwamm:   wie bisher – Kachel, dann Flecken wegwischen.
// Die Kacheln rechts sind nur noch Hinweise: sie lassen den passenden
// Gegenstand wackeln, und Leo schaut hin.
//
// Es gibt kein Verlieren und nichts Dramatisches.
//
// Module: gemeinsam/{speicher,audio,skalierung,eingabe,partikel}.js,
//         js/config.js (Zahlen), js/leo.js (Figur, Zonen, Blick),
//         js/zimmer.js (Tag/Nacht, Vorhang, Lampe), js/gegenstand.js (Dinge)
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
        reaktion: null,            // Name der laufenden Reaktion (mit Timer)
        reaktionTimer: null,
        gehalten: null,            // Gesicht, das ohne Timer gehalten wird (Maul auf, Zone …)
        modus: null,               // 'schwamm' | 'vorhang' | null
        // Streicheln
        streichelZone: null,
        streichelt: false,
        streichelTimer: null,
        streichelStart: 0,
        streichelExtra: false,
        letztePos: null,
        tempi: [],                 // letzte Fingergeschwindigkeiten (für „gleichmäßig")
        letztesHerz: 0,
        letztesSchnurren: 0,
        ohrTimer: null,
        // Füttern
        futter: null,              // { ding, amMaul, bissTimer, geschnuppert, verweigert }
        trinken: null,             // { ding, rest (ms), letzterSchluck, amMaul }
        // Vorhang ziehen
        vorhangStart: 0,
        vorhangStartX: 0,
        // Sonstiges
        blickTimer: null,
        tipps: [],                 // Zeitpunkte der letzten Tipps auf Leo (Kitzeln)
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

    // Zustand neu berechnen und – wenn gerade nichts anderes läuft – zeigen
    function zeigeZustand() {
        var neu = zustandBestimmen();
        var gewechselt = neu !== spiel.zustand;
        spiel.zustand = neu;
        if (!spiel.reaktion && !spiel.gehalten) {
            if (gewechselt || !Leo.aktuellesGesicht) Leo.zeigeZustand(neu);
        }
    }

    // Zurück zum Zustands-Gesicht (wenn nichts gehalten wird)
    function zurueckZumZustand() {
        spiel.zustand = zustandBestimmen();
        if (spiel.gehalten) Leo.zeigeReaktion(spiel.gehalten, spiel.zustand);
        else Leo.zeigeZustand(spiel.zustand);
    }

    // ---------- Reaktionen ----------

    // Reaktion mit Timer: nach `dauer` ms zurück zum Zustand (oder zum gehaltenen Gesicht)
    function starteReaktion(name, dauer, danach) {
        if (spiel.reaktionTimer) clearTimeout(spiel.reaktionTimer);
        spiel.reaktion = name;
        Leo.zeigeReaktion(name, spiel.zustand);
        spiel.reaktionTimer = setTimeout(function () {
            spiel.reaktion = null;
            spiel.reaktionTimer = null;
            zurueckZumZustand();
            if (danach) danach();
        }, dauer);
    }

    // Gesicht ohne Timer halten (solange etwas am Maul ist, solange gestreichelt wird)
    function halteGesicht(name) {
        spiel.gehalten = name;
        if (!spiel.reaktion) Leo.zeigeReaktion(name, spiel.zustand);
    }

    function gesichtLoslassen() {
        if (!spiel.gehalten) return;
        spiel.gehalten = null;
        if (!spiel.reaktion) zurueckZumZustand();
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
        if (spiel.modus === 'schwamm') schwammEnde();
        return leo.schlaeft || spiel.reaktion !== null;
    }

    // ---------- Blick ----------

    // Leo schaut kurz zu einem Punkt (oder solange, bis schauGeradeaus kommt)
    function schauZu(x, y, dauer) {
        if (leo.schlaeft) return;
        if (spiel.blickTimer) clearTimeout(spiel.blickTimer);
        spiel.blickTimer = null;
        Leo.schauZu(x, y);
        if (dauer) spiel.blickTimer = setTimeout(schauGeradeaus, dauer);
    }

    function schauGeradeaus() {
        if (spiel.blickTimer) clearTimeout(spiel.blickTimer);
        spiel.blickTimer = setTimeout(function () {
            spiel.blickTimer = null;
            Leo.schauZu(null);
        }, 900);
    }

    // =====================================================
    // Füttern
    // =====================================================

    function futterInfo(d) { return KONFIG.FUTTER[d.name]; }

    // Der Gegenstand in der Hand bewegt sich – ist er nah am Maul?
    function futterBewegt(d, x, y) {
        var maul = Leo.maulPosition();
        var nah = Gegenstand.abstand(d, maul.x, maul.y) < KONFIG.MAUL_NAEHE;
        var f = spiel.futter;
        if (nah && !f.amMaul) futterKommtAn(d);
        else if (!nah && f.amMaul) futterWegGenommen(d);
    }

    // Etwas kommt ans Maul: Maul auf – oder schnuppern – oder „Mmh-mm"
    function futterKommtAn(d) {
        var f = spiel.futter, info = futterInfo(d);
        f.amMaul = true;
        var zuSatt = leo.satt >= KONFIG.SATT_VOLL;
        var keinNaschen = info.naschen && leo.satt >= KONFIG.NASCHEN_UNTER;
        if (zuSatt || keinNaschen) {
            f.verweigert = true;
            Sound.naa();
            halteGesicht('naa');
            return;
        }
        f.verweigert = false;
        if (info.schnuppern && !f.geschnuppert) {
            f.geschnuppert = true;
            Sound.schnueffeln();
            halteGesicht('schnuppern');
            f.bissTimer = setTimeout(function () {
                if (!f.amMaul) return;
                halteGesicht('naeh');
                f.bissTimer = setTimeout(function () { beissen(d); }, 500);
            }, 1000);
            return;
        }
        halteGesicht('naeh');
        f.bissTimer = setTimeout(function () { beissen(d); }, 420);
    }

    function futterWegGenommen(d) {
        var f = spiel.futter;
        f.amMaul = false;
        if (f.bissTimer) clearTimeout(f.bissTimer);
        f.bissTimer = null;
        gesichtLoslassen();
    }

    // Ein Bissen: Stufe weiter, kauen, Krümel – bis alles weg ist
    function beissen(d) {
        var f = spiel.futter, info = futterInfo(d);
        if (!f || f.ding !== d || !f.amMaul) return;
        var maul = Leo.maulPosition();
        Sound.biss();
        setTimeout(function () { Sound.schmatzen(); }, 120);
        if (info.kruemel) partikel.kruemel(maul.x, maul.y + 10, 4 + info.kruemel, info.farbe);
        Gegenstand.stufe(d, d.stufe + 1);
        // Kauen als kurze Reaktion, dann wieder Maul auf
        spiel.reaktion = 'kauen';
        Leo.zeigeReaktion('kauen', spiel.zustand);
        if (spiel.reaktionTimer) clearTimeout(spiel.reaktionTimer);
        spiel.reaktionTimer = setTimeout(function () {
            spiel.reaktion = null;
            spiel.reaktionTimer = null;
            if (spiel.futter !== f) return;          // inzwischen etwas anderes in der Hand
            if (d.stufe >= KONFIG.BISSE) aufgegessen(d);
            else {
                zurueckZumZustand();
                if (f.amMaul) f.bissTimer = setTimeout(function () { beissen(d); }, KONFIG.BISS_MS - 450);
            }
        }, 450);
    }

    function aufgegessen(d) {
        var info = futterInfo(d);
        leo.satt = begrenze(leo.satt + info.plus, 0, 100);
        leo.sauber = begrenze(leo.sauber - info.kruemel, 0, 100);
        aktion();
        futterEnde();
        Gegenstand.verstecke(d, true);
        var maul = Leo.maulPosition();
        partikel.herzen(kopfX(), kopfY() - 40, info.lieblings ? 6 : 3);
        partikel.funkeln(kopfX(), kopfY(), info.lieblings ? 14 : 6);
        if (info.lieblings) {
            Sound.extraherz();
            setTimeout(function () { Sound.schnurren(1.2, KONFIG.SCHNURR_LAUT); }, 300);
            starteReaktion('lecker', KONFIG.DAUER.danke, vielleichtBaeuerchen);
        } else {
            Sound.extraherz();
            starteReaktion('satt', KONFIG.DAUER.danke - 600, vielleichtBaeuerchen);
        }
        // Nach einer Weile liegt wieder etwas Frisches im Korb
        setTimeout(function () { Gegenstand.neuAmPlatz(d); Sound.klick(); }, 1400);
        void maul;
    }

    function vielleichtBaeuerchen() {
        if (leo.schlaeft || Math.random() > KONFIG.BAEUERCHEN_CHANCE) return;
        setTimeout(function () {
            if (leo.schlaeft || spiel.reaktion || spiel.gehalten) return;
            Sound.hicks();
            partikel.blasen(kopfX() + 40, kopfY() - 20, 3);
            partikel.herzen(kopfX() + 60, kopfY() - 50, 1, { groesse: 14 });
            starteReaktion('baeuerchen', 900);
        }, 500);
    }

    function futterEnde() {
        var f = spiel.futter;
        if (!f) return;
        if (f.bissTimer) clearTimeout(f.bissTimer);
        spiel.futter = null;
        gesichtLoslassen();
    }

    // Angefangenes Essen/Trinken abbrechen (etwas Neues wird genommen, Gute Nacht …)
    function futterAbbrechen() {
        if (spiel.futter) {
            var alt = spiel.futter.ding;
            futterEnde();
            if (!alt.versteckt) Gegenstand.zurueck(alt);
        }
        if (spiel.trinken) {
            var fl = spiel.trinken.ding;
            spiel.trinken = null;
            fl.el.classList.remove('kippt');
            gesichtLoslassen();
            Gegenstand.zurueck(fl);
        }
    }

    // Losgelassen: am Maul → bleibt dort und Leo isst weiter; sonst zurück in den Korb
    function futterLosgelassen(d) {
        var f = spiel.futter;
        if (f && f.amMaul && !f.verweigert) {
            var maul = Leo.maulPosition();
            Gegenstand.ablegenBei(d, maul.x + 10, maul.y - 6);
            return;
        }
        futterEnde();
        Gegenstand.zurueck(d);
    }

    // =====================================================
    // Trinken (Flasche)
    // =====================================================

    function flascheBewegt(d, x, y) {
        var maul = Leo.maulPosition();
        var nah = Gegenstand.abstand(d, maul.x, maul.y) < KONFIG.MAUL_NAEHE;
        var t = spiel.trinken;
        if (nah && !t.amMaul) {
            t.amMaul = true;
            d.el.classList.add('kippt');
            halteGesicht('trinkt');
            Sound.schluck();
            t.letzterSchluck = performance.now();
        } else if (!nah && t.amMaul) {
            t.amMaul = false;
            d.el.classList.remove('kippt');
            gesichtLoslassen();
        }
    }

    // Läuft pro Frame, solange die Flasche am Maul ist
    function trinkenFortschreiben(dt) {
        var t = spiel.trinken;
        if (!t || !t.amMaul) return;
        t.rest -= dt * 1000;
        var anteil = Math.max(0, t.rest / KONFIG.TRINKEN_MS);
        // Wasserpegel in der Flasche (y 36 = voll … 76 = leer)
        document.getElementById('flasche-wasser').setAttribute('y', 36 + 40 * (1 - anteil));
        var jetzt = performance.now();
        if (jetzt - t.letzterSchluck > 450) {
            t.letzterSchluck = jetzt;
            Sound.schluck();
            var maul = Leo.maulPosition();
            partikel.blasen(maul.x - 10, maul.y, 2);
            partikel.tropfen(maul.x, maul.y + 10, 2);
        }
        if (t.rest <= 0) ausgetrunken(t.ding);
    }

    function ausgetrunken(d) {
        leo.satt = begrenze(leo.satt + KONFIG.WASSER_PLUS, 0, 100);
        aktion();
        spiel.trinken = null;
        gesichtLoslassen();
        d.el.classList.remove('kippt');
        Sound.blubbern();
        partikel.herzen(kopfX(), kopfY() - 40, 2);
        starteReaktion('lecken', 1300);
        Gegenstand.zurueck(d);
        // Flasche füllt sich am Platz wieder
        setTimeout(function () { document.getElementById('flasche-wasser').setAttribute('y', 36); }, 700);
    }

    function flascheLosgelassen(d) {
        if (spiel.trinken) {
            spiel.trinken = null;
            d.el.classList.remove('kippt');
            gesichtLoslassen();
        }
        Gegenstand.zurueck(d);
    }

    // =====================================================
    // Decke (Schlafen gehen)
    // =====================================================

    function deckeBewegt(d, x, y) {
        var ueberLeo = Leo.trifft(x, y);
        if (ueberLeo && spiel.gehalten !== 'schlaefrig') {
            halteGesicht('schlaefrig');
            Sound.gaehnen();
        } else if (!ueberLeo && spiel.gehalten === 'schlaefrig') {
            gesichtLoslassen();
        }
    }

    function deckeLosgelassen(d, x, y) {
        if (Leo.trifft(x, y) || Gegenstand.abstand(d, kopfX(), kopfY() + 120) < 200) {
            gesichtLoslassen();
            Gegenstand.verstecke(d, true);
            guteNacht();
        } else {
            gesichtLoslassen();
            Gegenstand.zurueck(d);
        }
    }

    // Gute Nacht – Leo gähnt, das Licht dimmt, dann schläft sie
    function guteNacht() {
        if (spiel.reaktionTimer) clearTimeout(spiel.reaktionTimer);
        spiel.reaktion = null;
        aktion();
        schwammEnde();
        futterAbbrechen();
        Sound.gaehnen();
        setTimeout(function () { Sound.schlaflied(); }, 900);
        partikel.herzen(kopfX() + 100, kopfY() - 60, 1, { groesse: 16 });
        starteReaktion('gutenacht', KONFIG.DAUER.gutenacht, schlafen);
        // Licht dimmt schon während des Gähnens
        setTimeout(function () { Zimmer.setzeDaemmerung(true); }, 1400);
    }

    function schlafen() {
        leo.schlaeft = true;
        Leo.schauZu(null);
        Zimmer.setzeNacht(true);
        Zimmer.setzeVorhang(1, false);
        spiel.zustand = 'schlafend';
        Leo.zeigeZustand('schlafend');
        speichern();
    }

    // Guten Morgen – Leo wacht ausgeschlafen auf und freut sich
    function aufwachen() {
        if (!leo.schlaeft) return;
        leo.schlaeft = false;
        leo.ausgeschlafen = 100;
        aktion();
        Zimmer.setzeNacht(false);
        Zimmer.setzeVorhang(0, false);
        Zimmer.setzeLampe(true);
        Gegenstand.neuAmPlatz(Gegenstand.finde('decke'));
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

    // ---------- Vorhang und Lampe ----------

    function vorhangAngetippt() {
        Sound.vorhang();
        Zimmer.vorhangUmschalten();
        nachVorhang();
    }

    // Vorhang auf, während Leo schläft und es Tag ist → sie wacht auf
    function nachVorhang() {
        if (leo.schlaeft && !Zimmer.istVorhangZu() && !istAbend()) aufwachen();
        else if (!leo.schlaeft) {
            aktion();
            schauZu(300, 140, 1400);
        }
    }

    function lampeAngetippt() {
        var an = Zimmer.lampeUmschalten();
        Sound.lampe(an);
        if (!leo.schlaeft) schauZu(622, 300, 1200);
    }

    // =====================================================
    // Schwamm (wie bisher)
    // =====================================================

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
        if (spiel.modus === 'schwamm') spiel.modus = null;
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
        Sound.platsch();
        partikel.tropfen(kopfX(), kopfY() + 60, 12);
        starteReaktion('schuetteln', 750, function () {
            Sound.stern();
            partikel.funkeln(kopfX(), kopfY(), 14);
            partikel.blasen(kopfX(), kopfY() + 40, 6);
            starteReaktion('frisch', KONFIG.DAUER.frisch);
        });
    }

    // =====================================================
    // Streicheln – jede Zone anders, gleichmäßig = lauter
    // =====================================================

    var ZONEN_GESICHT = {
        kopf: 'schnurren', kinn: 'kinn', ohr: 'ohr',
        ruecken: 'ruecken', bauch: 'bauch', pfote: 'pfote'
    };

    // Wie gleichmäßig streicht Lara gerade? 0 (ruckelig) … 1 (schön fließend)
    function gleichmaessigkeit() {
        var t = spiel.tempi;
        if (t.length < 4) return 0.5;
        var summe = 0;
        for (var i = 0; i < t.length; i++) summe += t[i];
        var mittel = summe / t.length;
        if (mittel < 20) return 0.2;
        var abw = 0;
        for (var j = 0; j < t.length; j++) abw += (t[j] - mittel) * (t[j] - mittel);
        var streuung = Math.sqrt(abw / t.length) / mittel;
        return begrenze(1 - streuung, 0, 1);
    }

    function streichelBewegung(x, y) {
        if (leo.schlaeft || spiel.modus || spiel.futter || spiel.trinken) return;
        if (spiel.reaktion && !spiel.streichelt) return;
        var zone = Leo.zone(x, y);
        var jetzt = performance.now();

        if (!zone) {
            // Finger hat Leo verlassen – Nachlauf entscheidet
            spiel.letztePos = null;
            return;
        }

        // Tempo mitschreiben
        if (spiel.letztePos) {
            var dx = x - spiel.letztePos.x, dy = y - spiel.letztePos.y;
            var dtm = Math.max(8, jetzt - spiel.letztePos.t);
            spiel.tempi.push(Math.sqrt(dx * dx + dy * dy) / dtm * 1000);
            if (spiel.tempi.length > 8) spiel.tempi.shift();
        }
        spiel.letztePos = { x: x, y: y, t: jetzt };

        if (!spiel.streichelt) {
            spiel.streichelt = true;
            spiel.streichelZone = null;
            spiel.streichelStart = jetzt;
            spiel.streichelExtra = false;
            spiel.tempi = [];
            spiel.letztesSchnurren = 0;
        }

        // Zone gewechselt → anderes Gesicht, anderer Ton
        if (zone !== spiel.streichelZone) {
            zoneBetreten(zone, x, y);
        }

        var g = gleichmaessigkeit();

        // Herzen: bei fließender Bewegung dichter
        if (jetzt - spiel.letztesHerz > KONFIG.HERZ_ABSTAND_MS / (0.5 + g)) {
            partikel.herzen(x, y - 20, 1, { groesse: 12 + g * 10 });
            spiel.letztesHerz = jetzt;
        }

        // Schnurren: Lautstärke folgt der Gleichmäßigkeit
        if (zone !== 'ohr' && zone !== 'pfote' && jetzt - spiel.letztesSchnurren > 950) {
            var laut = KONFIG.SCHNURR_LEISE + (KONFIG.SCHNURR_LAUT - KONFIG.SCHNURR_LEISE) * g;
            Sound.schnurren(1.0, laut * (zone === 'kinn' ? 1.3 : 1));
            spiel.letztesSchnurren = jetzt;
        }

        // Nach längerem Kuscheln an einer Stelle: kleine Überraschung
        if (!spiel.streichelExtra && jetzt - spiel.streichelStart > KONFIG.ZONEN_EXTRA_MS) {
            spiel.streichelExtra = true;
            if (zone === 'bauch') {
                Sound.kichern();
                partikel.herzen(kopfX(), kopfY() + 100, 5);
            } else if (zone === 'kinn') {
                Sound.schnurren(1.4, KONFIG.SCHNURR_LAUT);
                partikel.funkeln(kopfX(), kopfY() + 40, 8);
            } else if (zone === 'ruecken') {
                partikel.funkeln(x, y, 5);
            }
        }

        if (spiel.streichelTimer) clearTimeout(spiel.streichelTimer);
        spiel.streichelTimer = setTimeout(streichelEnde, KONFIG.SCHNURR_NACHLAUF_MS);
    }

    function zoneBetreten(zone, x, y) {
        spiel.streichelZone = zone;
        spiel.streichelStart = performance.now();
        spiel.streichelExtra = false;
        if (spiel.ohrTimer) clearTimeout(spiel.ohrTimer);
        halteGesicht(ZONEN_GESICHT[zone]);
        if (zone === 'ohr') {
            Sound.mrrp();
            // Ohr zuckt kurz, dann ist es einfach Kopf-Streicheln
            spiel.ohrTimer = setTimeout(function () {
                if (spiel.streichelt && spiel.streichelZone === 'ohr') halteGesicht('schnurren');
            }, 700);
        } else if (zone === 'pfote') {
            Sound.kichern();
            partikel.funkeln(x, y, 4);
        } else if (zone === 'bauch') {
            Sound.mrrp();
            setTimeout(function () { if (spiel.streichelZone === 'bauch') Sound.kichern(); }, 350);
        } else {
            Sound.schnurren(1.0, KONFIG.SCHNURR_LEISE + 0.04);
            spiel.letztesSchnurren = performance.now();
        }
    }

    function streichelEnde() {
        if (!spiel.streichelt) return;
        spiel.streichelt = false;
        spiel.streichelZone = null;
        spiel.letztePos = null;
        if (spiel.ohrTimer) clearTimeout(spiel.ohrTimer);
        aktion();
        gesichtLoslassen();
    }

    // Kachel „Streicheln": Leo bittet darum – lehnt sich vor, Herzen
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
        if (beschaeftigt() || spiel.gehalten) return;
        Sound.mrrp();
        starteReaktion('blinzeln', 180);
    }

    // =====================================================
    // Kacheln: nur noch Hinweise („nimm das hier")
    // =====================================================

    function hinweisAuf(namen, blickX, blickY) {
        Sound.klick();
        for (var i = 0; i < namen.length; i++) {
            var d = Gegenstand.finde(namen[i]);
            if (d && !d.versteckt) Gegenstand.hinweis(d);
        }
        if (!leo.schlaeft) schauZu(blickX, blickY, 1600);
    }

    function kachelFutter() {
        if (leo.schlaeft) return;
        schwammEnde();
        hinweisAuf(['fisch', 'milch', 'keks', 'apfel'], 760, 580);
        if (!spiel.reaktion && !spiel.gehalten) {
            spiel.reaktion = 'naeh';
            Leo.zeigeReaktion('naeh', spiel.zustand);
            if (spiel.reaktionTimer) clearTimeout(spiel.reaktionTimer);
            spiel.reaktionTimer = setTimeout(function () {
                spiel.reaktion = null; spiel.reaktionTimer = null; zurueckZumZustand();
            }, 1200);
        }
    }

    function kachelWasser() {
        if (leo.schlaeft) return;
        schwammEnde();
        hinweisAuf(['flasche'], 796, 600);
    }

    function kachelDecke() {
        if (leo.schlaeft) return;
        schwammEnde();
        hinweisAuf(['decke'], 790, 350);
        Sound.gaehnen();
        if (!spiel.reaktion && !spiel.gehalten) starteReaktion('gutenacht', 1400);
    }

    // =====================================================
    // Eingabe: Finger auf der Bühne
    // =====================================================

    function beiTippen(x, y) {
        if (Zimmer.istAufLampe(x, y)) { lampeAngetippt(); return; }
        if (Zimmer.istImFenster(x, y)) { vorhangAngetippt(); return; }
        var d = Gegenstand.unterPunkt(x, y);
        if (d && !leo.schlaeft) {
            Sound.klick();
            Gegenstand.hinweis(d);
            schauZu(d.x, d.y, 1300);
            return;
        }
        if (Leo.trifft(x, y)) leoAngetippt();
    }

    function ziehStart(x, y, sx, sy) {
        if (spiel.modus === 'schwamm') return;
        // Gegenstand unter dem Finger?
        var d = Gegenstand.unterPunkt(sx, sy);
        if (d && !leo.schlaeft) {
            schwammEnde();
            streichelEnde();
            futterAbbrechen();
            Gegenstand.aufheben(d, x, y);
            if (d.istFutter) spiel.futter = { ding: d, amMaul: false, bissTimer: null, geschnuppert: false, verweigert: false };
            else if (d.name === 'flasche') spiel.trinken = { ding: d, rest: KONFIG.TRINKEN_MS, letzterSchluck: 0, amMaul: false };
            spiel.modus = 'hand';
            return;
        }
        if (Zimmer.istImFenster(sx, sy)) {
            spiel.modus = 'vorhang';
            spiel.vorhangStart = Zimmer.vorhangAnteil;
            spiel.vorhangStartX = sx;
            Sound.vorhang();
        }
    }

    function ziehBewegt(x, y) {
        if (spiel.modus === 'schwamm') { schwammBewegen(x, y); return; }
        if (spiel.modus === 'vorhang') { Zimmer.vorhangZiehen(spiel.vorhangStart, spiel.vorhangStartX, x); return; }
        if (spiel.modus === 'hand') {
            var d = Gegenstand.inHand;
            if (!d) return;
            Gegenstand.bewegen(x, y);
            schauZu(d.x, d.y);
            if (d.istFutter) futterBewegt(d, x, y);
            else if (d.name === 'flasche') flascheBewegt(d, x, y);
            else if (d.name === 'decke') deckeBewegt(d, x, y);
            return;
        }
        streichelBewegung(x, y);
    }

    function ziehEnde(x, y) {
        if (spiel.modus === 'vorhang') {
            spiel.modus = null;
            Zimmer.vorhangEinrasten();
            nachVorhang();
            return;
        }
        if (spiel.modus === 'hand') {
            spiel.modus = null;
            var d = Gegenstand.loslassen();
            if (!d) return;
            if (d.istFutter) futterLosgelassen(d);
            else if (d.name === 'flasche') flascheLosgelassen(d);
            else if (d.name === 'decke') deckeLosgelassen(d, x, y);
            schauGeradeaus();
            return;
        }
        // Streicheln endet über den Nachlauf-Timer
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
        trinkenFortschreiben(dt);

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
        Gegenstand.init(document.getElementById('dinge'));
        laden();

        // Gesten auf der Bühne (Knöpfe regeln sich selbst per click)
        Eingabe.init(buehne, {
            beiTippen: beiTippen,
            beiZiehen: function (x, y, sx, sy, phase) {
                if (phase === 'start') ziehStart(x, y, sx, sy);
                else if (phase === 'bewegt') ziehBewegt(x, y);
                else ziehEnde(x, y);
            }
        });

        function knopf(id, fn) {
            document.getElementById(id).addEventListener('click', function () {
                Sound.init();
                fn();
            });
        }
        knopf('kachel-futter', kachelFutter);
        knopf('kachel-wasser', kachelWasser);
        knopf('kachel-schwamm', schwammStart);
        knopf('kachel-streicheln', streichelnKachel);
        knopf('kachel-decke', kachelDecke);
        knopf('kachel-sonne', aufwachen);
        knopf('ton-knopf', function () {
            Sound.stummUmschalten();
            tonAnzeigen();
            if (!Sound.stumm) Sound.klick();
        });

        tonAnzeigen();
        Zimmer.setzeNacht(leo.schlaeft);
        if (leo.schlaeft) {
            Zimmer.setzeVorhang(1, true);
            Gegenstand.verstecke(Gegenstand.finde('decke'), true);
        }
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
