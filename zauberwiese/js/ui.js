// =====================================================
// UI: Bildschirme (Start, Pause, Geschafft, Nochmal),
// Level-Auswahl und das HUD (Herzen, Punkte, Blumen).
// =====================================================

const UI = {
    bildschirme: {},
    muteKnopf: null,
    pauseKnopf: null,
    vorschauCtx: null, // kleines Canvas mit Bella auf dem Startbildschirm

    init() {
        this.bildschirme = {
            start:      document.getElementById('start-bildschirm'),
            intro:      document.getElementById('intro-bildschirm'),
            geschichte: document.getElementById('geschichte-bildschirm'),
            pause:      document.getElementById('pause-bildschirm'),
            geschafft:  document.getElementById('geschafft-bildschirm'),
            nochmal:    document.getElementById('nochmal-bildschirm')
        };
        this.muteKnopf = document.getElementById('mute-knopf');
        this.pauseKnopf = document.getElementById('pause-knopf');
        this.vorschauCtx = document.getElementById('bella-vorschau').getContext('2d');
        this.geschichteFohlenCtx = document.getElementById('geschichte-fohlen').getContext('2d');
        this.geschichteFohlen = null; // Fohlen-Schlüssel des aktuellen Boss-Levels
    },

    // Erzähltext der Intro-Szene setzen (nur bei Änderung)
    setzeIntroText(text) {
        const el = document.getElementById('intro-text');
        if (el.innerHTML !== text) el.innerHTML = text;
    },

    // Zeichnet die große, animierte Bella auf dem Startbildschirm.
    // Wird vom Game-Loop aufgerufen, solange das Menü offen ist.
    zeichneVorschau(zeit) {
        const ctx = this.vorschauCtx;
        ctx.clearRect(0, 0, 220, 170);
        // Sanftes Schweben auf und ab
        const schweben = Math.sin(zeit * 0.04) * 4;
        drawBella(ctx, 105, 122 + schweben, 1.4, 1, { zeit: zeit });
    },

    // Zeigt genau einen Bildschirm – oder keinen (name = null → Spiel läuft)
    zeigeBildschirm(name) {
        for (const schluessel in this.bildschirme) {
            this.bildschirme[schluessel].classList.toggle('sichtbar', schluessel === name);
        }
        // Der Pause-Knopf ist nur sinnvoll, während gespielt wird
        this.pauseKnopf.style.visibility = (name === null || name === 'pause') ? 'visible' : 'hidden';
    },

    // Baut die Level-Auswahl auf dem Startbildschirm auf.
    // Gesperrte Level zeigen ein Schloss.
    baueLevelAuswahl(fortschritt, beiKlick) {
        const box = document.getElementById('level-auswahl');
        box.innerHTML = '';

        LEVELS.forEach((level, i) => {
            const frei = i < fortschritt.freigeschaltet;
            const knopf = document.createElement('button');
            knopf.className = 'level-knopf' + (frei ? '' : ' gesperrt');
            knopf.disabled = !frei;

            if (frei) {
                knopf.innerHTML = (i + 1) + '<small>' + level.name + '</small>';
                knopf.addEventListener('click', () => beiKlick(i));
            } else {
                knopf.innerHTML = '🔒<small>???</small>';
            }
            box.appendChild(knopf);
        });

        const anzeige = document.getElementById('highscore-anzeige');
        anzeige.textContent = fortschritt.highscore > 0
            ? '⭐ Beste Punkte: ' + fortschritt.highscore
            : '';

        // Gerettete Freunde als kleine Emoji-Reihe anzeigen
        // (das Fest-Finale hat keinen eigenen Freund → zählt nicht mit)
        const freundeBox = document.getElementById('freunde-anzeige');
        const freunde = fortschritt.freunde || {};
        const gesamt = LEVELS.filter(function (l) { return l.freundEmoji; }).length;
        const gerettet = LEVELS.map(function (l) { return freunde[l.name]; }).filter(Boolean);
        freundeBox.innerHTML = gerettet.length
            ? '💞 Gerettete Freunde: ' + gerettet.join(' ') +
              ' <small>(' + gerettet.length + ' von ' + gesamt + ')</small>'
            : '💞 Rette deine Freunde aus den Zauberblasen! 🫧';
    },

    // Füllt den Geschichte-Bildschirm vor einem Level.
    // In Boss-Leveln wird statt des Emojis das gefangene Fohlen
    // live in seine Blase gezeichnet (zeichneGeschichteFohlen).
    zeigeGeschichte(nummer, level) {
        document.getElementById('geschichte-titel').textContent = '✨ Level ' + nummer + ' ✨';
        document.getElementById('geschichte-name').textContent = level.name;
        document.getElementById('geschichte-text').innerHTML =
            level.geschichte || 'Auf geht\'s ins nächste Abenteuer!';

        this.geschichteFohlen = level.fohlen || null;
        document.getElementById('geschichte-freund').style.display = this.geschichteFohlen ? 'none' : 'block';
        document.getElementById('geschichte-fohlen').style.display = this.geschichteFohlen ? 'block' : 'none';
        document.getElementById('geschichte-freund').textContent = level.freundEmoji || '🎉';
    },

    // Zeichnet das gefangene Fohlen (animiert) auf dem Geschichte-
    // Bildschirm eines Boss-Levels. Wird vom Game-Loop aufgerufen.
    zeichneGeschichteFohlen(zeit) {
        if (!this.geschichteFohlen) return;
        const ctx = this.geschichteFohlenCtx;
        ctx.clearRect(0, 0, 170, 140);
        const y = 64 + Math.sin(zeit * 0.04) * 6;
        drawFohlen(ctx, 84, y + 14, 0.5, 1, this.geschichteFohlen, { zeit: zeit });
        zeichneGrummelBlase(ctx, 85, y, 54);
    },

    // Schwierigkeits-Knöpfe (Leicht/Normal/Schwer) bauen.
    // aktiv = aktuell gewählter Schlüssel; beiKlick(schluessel) wählt aus.
    baueSchwierigkeit(aktiv, beiKlick) {
        const box = document.getElementById('schwierigkeit-auswahl');
        if (!box) return;
        box.innerHTML = '';

        for (const schluessel in KONFIG.SCHWIERIGKEITEN) {
            const s = KONFIG.SCHWIERIGKEITEN[schluessel];
            const knopf = document.createElement('button');
            knopf.className = 'schwierigkeit-knopf' + (schluessel === aktiv ? ' aktiv' : '');
            knopf.innerHTML = s.emoji + '<small>' + s.name + '</small>';
            knopf.addEventListener('click', () => beiKlick(schluessel));
            box.appendChild(knopf);
        }
    },

    // Lautsprecher-Symbol passend zum Stumm-Zustand
    setzeStummKnopf(stumm) {
        this.muteKnopf.textContent = stumm ? '🔇' : '🔊';
    },

    // Symbol des Stimmen-Knopfes (🗣️ = an, 🤐 = aus)
    setzeStimmeKnopf(aus) {
        document.getElementById('stimme-knopf').textContent = aus ? '🤐' : '🗣️';
    },

    // Texte auf dem "Geschafft"-Bildschirm füllen
    // (sammelName z. B. "Blumen 🌸" oder "Muscheln & Seesterne")
    // eigenerText überschreibt den Standardtext (z. B. im Boss-Level).
    // freundText erzählt, ob der Zauberblasen-Freund gerettet wurde.
    zeigeGeschafft(blumen, punkte, istLetztesLevel, sammelName, eigenerText, freundText) {
        let text = eigenerText ||
            ('Du hast <b>' + blumen + ' ' + (sammelName || 'Blumen 🌸') + '</b> gesammelt!<br>Punkte: <b>' + punkte + '</b> ⭐');
        if (freundText) text = freundText + '<br>' + text;
        if (istLetztesLevel) text += '<br>🎉 Das ganze Zauberland ist gerettet! 🎉';
        document.getElementById('geschafft-text').innerHTML = text;
        document.getElementById('naechstes-level-knopf').textContent =
            istLetztesLevel ? 'Zum Menü 🏠' : 'Weiter ▶';
    },

    // Boss-Leiste: füllt sich mit jedem Treffer in Regenbogenfarben.
    // Zeigt dem Kind klar: "Noch ein bisschen, dann lacht die Wolke!"
    zeichneBossLeiste(ctx, boss) {
        const breite = 260, hoehe = 16;
        const x = (KONFIG.BREITE - breite) / 2;
        const y = 66;
        const anteil = Math.min(1, boss.treffer / boss.maxTreffer);

        // Bunter Hintergrund, grau überdeckt für den noch offenen Teil
        ctx.save();
        pfadRundesRechteck(ctx, x, y, breite, hoehe, 8);
        ctx.clip();
        const segb = breite / REGENBOGEN.length;
        for (let i = 0; i < REGENBOGEN.length; i++) {
            ctx.fillStyle = REGENBOGEN[i];
            ctx.fillRect(x + i * segb, y, segb + 1, hoehe);
        }
        ctx.fillStyle = 'rgba(120,124,140,0.85)';
        ctx.fillRect(x + breite * anteil, y, breite * (1 - anteil), hoehe);
        ctx.restore();

        // Rahmen
        pfadRundesRechteck(ctx, x, y, breite, hoehe, 8);
        ctx.strokeStyle = KONFIG.FARBEN.einhorn.outline;
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Aufmunternder Hinweis unter der Leiste
        ctx.fillStyle = KONFIG.FARBEN.textDunkel;
        ctx.font = '600 16px ' + KONFIG.SCHRIFT;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const ziel = (boss.art === 'biene') ? 'die Biene'
                   : (boss.art === 'krake') ? 'die Krake' : 'die Wolke';
        ctx.fillText('🌈 Fang die bunten Funken – dann schieß sie auf ' + ziel + '!', KONFIG.BREITE / 2, y + hoehe + 13);
    },

    // Energie-Anzeige: kleine Regenbogen-Kugeln über Bellas Kopf zeigen,
    // wie viele Schüsse sie gerade auf Vorrat hat (gefüllt = bereit).
    zeichneBossEnergie(ctx, boss) {
        const sx = bella.x - spiel.kamera;
        const y = bella.y - 82;
        for (let i = 0; i < boss.maxEnergie; i++) {
            const cx = sx - (boss.maxEnergie - 1) * 9 + i * 18;
            ctx.beginPath();
            ctx.arc(cx, y, 6, 0, Math.PI * 2);
            if (i < boss.energie) {
                const grad = ctx.createLinearGradient(cx - 6, y, cx + 6, y);
                grad.addColorStop(0, REGENBOGEN[0]);
                grad.addColorStop(1, REGENBOGEN[4]);
                ctx.fillStyle = grad;
                ctx.fill();
                ctx.lineWidth = 2;
                ctx.strokeStyle = '#ffffff';
                ctx.stroke();
            } else {
                ctx.fillStyle = 'rgba(255,255,255,0.25)';
                ctx.fill();
                ctx.lineWidth = 1.5;
                ctx.strokeStyle = 'rgba(43,43,58,0.4)';
                ctx.stroke();
            }
        }
    },

    // HUD direkt aufs Canvas zeichnen
    zeichneHUD(ctx, spiel) {
        ctx.textBaseline = 'middle';

        // Oben links: Herzen
        ctx.font = '30px ' + KONFIG.SCHRIFT;
        ctx.textAlign = 'left';
        let herzText = '';
        for (let i = 0; i < spiel.maxHerzen; i++) {
            herzText += (i < spiel.herzen ? KONFIG.SPRITES.herzVoll : KONFIG.SPRITES.herzLeer) + ' ';
        }
        ctx.fillText(herzText, 20, 36);

        // Unter den Herzen: ablaufender Sternen-Turbo-Balken
        // (bella ist die globale Spielfigur aus game.js)
        if (bella.turbo > 0) {
            const anteil = Math.min(1, Math.max(0, bella.turbo / KONFIG.TURBO_DAUER));
            ctx.font = '20px ' + KONFIG.SCHRIFT;
            ctx.fillText('⭐', 20, 64);
            ctx.fillStyle = 'rgba(43, 43, 58, 0.15)'; // Hintergrund des Balkens
            ctx.fillRect(46, 58, 100, 12);
            ctx.fillStyle = '#ffd24a';
            ctx.fillRect(46, 58, 100 * anteil, 12);
        }

        // Oben Mitte: Level-Name
        ctx.fillStyle = KONFIG.FARBEN.textDunkel;
        ctx.font = '600 26px ' + KONFIG.SCHRIFT;
        ctx.textAlign = 'center';
        ctx.fillText(spiel.level.name, KONFIG.BREITE / 2, 36);

        // Oben rechts: Blumen-Zähler + Punkte
        // (Platz für die Pause-/Ton-Knöpfe freilassen)
        ctx.textAlign = 'right';
        const sammelIcon = spiel.level.sammelIcon || '🌸';
        ctx.fillText(sammelIcon + ' ' + spiel.blumen + '   ⭐ ' + spiel.punkte, KONFIG.BREITE - 130, 36);

        ctx.fillStyle = '#000000';
    }
};
