// =====================================================
// Bella, das Einhorn 🦄
//
// drawBella(ctx, x, y, scale, facing, pose)
//   zeichnet Bella als niedliches Cartoon-Einhorn direkt
//   im Canvas: rundlich, freundlich, geschlossene
//   glückliche Augen, kräftige dunkle Outline, Mähne und
//   Schweif als fließende Farbbänder (Pink → Gold → Blau).
//   Überall wiederverwendbar: skalierbar über "scale",
//   spiegelbar über "facing" (1 = rechts, -1 = links).
//
// Die Klasse Bella kümmert sich um Laufen, Springen,
// Schwerkraft, Bodenkollision und Unverwundbarkeit.
// =====================================================

// ---------- Pfad-Helfer ----------

// Rechteck mit runden Ecken (weiche Formen, keine spitzen Ecken)
function pfadRundesRechteck(ctx, x, y, breite, hoehe, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + breite - radius, y);
    ctx.quadraticCurveTo(x + breite, y, x + breite, y + radius);
    ctx.lineTo(x + breite, y + hoehe - radius);
    ctx.quadraticCurveTo(x + breite, y + hoehe, x + breite - radius, y + hoehe);
    ctx.lineTo(x + radius, y + hoehe);
    ctx.quadraticCurveTo(x, y + hoehe, x, y + hoehe - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
}

// Fünfzackiger Stern (für die Flanke)
function pfadStern(ctx, cx, cy, radius) {
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
        const r = (i % 2 === 0) ? radius : radius * 0.45;
        const a = -Math.PI / 2 + i * Math.PI / 5;
        const px = cx + Math.cos(a) * r;
        const py = cy + Math.sin(a) * r;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
}

// Silhouette des fluffigen Schweifs (geschwungen, leicht wellig)
function pfadSchweif(ctx, wehen) {
    ctx.beginPath();
    ctx.moveTo(-18, -16);
    ctx.quadraticCurveTo(-40, -24 + wehen, -45, -42 + wehen); // obere Kante zur Spitze
    ctx.quadraticCurveTo(-55, -26 + wehen, -44, -10);         // fluffige Außenwölbung
    ctx.quadraticCurveTo(-36, 2, -16, -2);                    // untere Kante zurück zum Körper
    ctx.closePath();
}

// Silhouette der Mähne entlang Hals und Hinterkopf
function pfadMaehne(ctx, wehen) {
    ctx.beginPath();
    ctx.moveTo(22, -48);
    ctx.quadraticCurveTo(4, -46 + wehen, 0, -30);  // hintere, wellige Kante
    ctx.quadraticCurveTo(-4, -14, 4, -6);          // hinunter zur Schulter
    ctx.quadraticCurveTo(14, -10, 16, -20);        // innere Kante am Hals entlang
    ctx.quadraticCurveTo(16, -36, 26, -42);
    ctx.closePath();
}

// =====================================================
// drawBella – zeichnet das komplette Einhorn
// pose (optional): { zeit, laeuft, amBoden, vy, feder,
//   gleitet, stil, ohneReiterin }
//   stil         = Farb-Überschreibungen (für die Fohlen!)
//   ohneReiterin = true → Lara wird nicht mitgezeichnet
// =====================================================
function drawBella(ctx, x, y, scale, facing, pose) {
    pose = pose || {};
    const zeit = pose.zeit || 0;
    const laeuft = !!pose.laeuft;
    const amBoden = pose.amBoden !== false;
    const vy = pose.vy || 0;
    const feder = pose.feder || 0;
    const F = pose.stil
        ? Object.assign({}, KONFIG.FARBEN.einhorn, pose.stil)
        : KONFIG.FARBEN.einhorn;

    // Weiche Bluey-Konturen: jeder Teil bekommt einen Rand in einer
    // dunkleren Variante seiner EIGENEN Farbe (statt hartem Schwarz).
    // Bei den Fohlen entstehen so automatisch passende Konturen.
    const randKoerper = kontur(F.koerper, 0.42);
    const randHuf = kontur(F.huf);
    const randMaehne = kontur(F.maehnePink);
    const GESICHT = KONFIG.FARBEN.gesicht;

    // Leichtes Auf-und-Ab-Wippen beim Laufen
    let wippen = 0;
    if (laeuft && amBoden) wippen = -Math.abs(Math.sin(zeit * 0.35)) * 3 * scale;

    ctx.save();
    ctx.translate(x, y + wippen);
    if (facing === -1) ctx.scale(-1, 1); // Bella schaut in Laufrichtung
    ctx.scale(scale, scale);

    if (!amBoden) {
        // In der Luft: leicht strecken und neigen
        ctx.rotate(vy < 0 ? -0.12 : 0.1);
        ctx.scale(0.96, 1.06);
    } else if (feder > 0) {
        // Kurz nach der Landung: weiches "Federn" (Stauchen)
        const f = feder / 10;
        ctx.scale(1 + 0.08 * f, 1 - 0.1 * f);
    }

    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    // ---------- Beinstellung ----------
    // Winkel: positiv = Bein schwingt nach vorn
    // Reihenfolge: [hinten fern, vorne fern, hinten nah, vorne nah]
    let winkel;
    if (!amBoden) {
        winkel = vy < 0
            ? [0.85, -0.75, 0.65, -0.55]  // Absprung: Beine gestreckt
            : [0.45, -0.2, 0.3, -0.05];   // Landung: Beine kommen nach vorn
    } else if (laeuft) {
        const phase = zeit * 0.35; // Galopp-Takt
        winkel = [
            Math.sin(phase) * 0.7,
            Math.sin(phase + Math.PI) * 0.7,
            Math.sin(phase + Math.PI * 0.7) * 0.7,
            Math.sin(phase + Math.PI * 1.7) * 0.7
        ];
    } else {
        winkel = [0.1, -0.1, -0.06, 0.06]; // ruhiges Stehen
    }

    // Ein Bein: rundlicher weißer Schaft + lila Huf, beides mit Outline
    const bein = (hx, hy, w, fern) => {
        ctx.save();
        ctx.translate(hx, hy);
        ctx.rotate(-w);
        // Schaft
        pfadRundesRechteck(ctx, -4.5, -3, 9, 16, 4);
        ctx.fillStyle = fern ? F.koerperSchatten : F.koerper;
        ctx.fill();
        ctx.strokeStyle = randKoerper;
        ctx.lineWidth = 2.5;
        ctx.stroke();
        // Huf
        pfadRundesRechteck(ctx, -4.5, 11, 9, 7, 3);
        ctx.fillStyle = F.huf;
        ctx.fill();
        ctx.strokeStyle = randHuf;
        ctx.stroke();
        ctx.restore();
    };

    // Mähne und Schweif wehen sanft
    const wehen = Math.sin(zeit * 0.12) * 3;

    // ---------- Schweif: drei Farbbänder (Pink → Gold → Blau) ----------
    ctx.save();
    pfadSchweif(ctx, wehen);
    ctx.fillStyle = F.maehnePink;
    ctx.fill();
    ctx.clip(); // die Bänder bleiben sauber innerhalb der Schweif-Form
    ctx.lineWidth = 11;
    ctx.strokeStyle = F.maehneGold;
    ctx.beginPath();
    ctx.moveTo(-16, -10);
    ctx.quadraticCurveTo(-36, -16 + wehen, -44, -32 + wehen);
    ctx.stroke();
    ctx.strokeStyle = F.maehneBlau;
    ctx.beginPath();
    ctx.moveTo(-16, -4);
    ctx.quadraticCurveTo(-34, -6 + wehen * 0.5, -46, -16);
    ctx.stroke();
    ctx.restore();
    pfadSchweif(ctx, wehen); // weiche Kontur um den ganzen Schweif
    ctx.strokeStyle = randMaehne;
    ctx.lineWidth = 3;
    ctx.stroke();

    // ---------- Mähne (hinter Hals und Kopf) ----------
    ctx.save();
    pfadMaehne(ctx, wehen);
    ctx.fillStyle = F.maehnePink;
    ctx.fill();
    ctx.clip();
    ctx.lineWidth = 8;
    ctx.strokeStyle = F.maehneGold;
    ctx.beginPath();
    ctx.moveTo(20, -45);
    ctx.quadraticCurveTo(4, -38 + wehen * 0.5, 6, -10);
    ctx.stroke();
    ctx.lineWidth = 6;
    ctx.strokeStyle = F.maehneBlau;
    ctx.beginPath();
    ctx.moveTo(20, -42);
    ctx.quadraticCurveTo(10, -34, 10, -14);
    ctx.stroke();
    ctx.lineWidth = 4;
    ctx.strokeStyle = F.maehneLila;
    ctx.beginPath();
    ctx.moveTo(20, -40);
    ctx.quadraticCurveTo(13, -32, 13, -16);
    ctx.stroke();
    ctx.restore();
    pfadMaehne(ctx, wehen);
    ctx.strokeStyle = randMaehne;
    ctx.lineWidth = 3;
    ctx.stroke();

    // ---------- Zauber-Flügel beim Funkel-Gleiten ----------
    // Halb durchsichtige Glitzer-Flügel auf dem Rücken, die sanft
    // schlagen – sie erscheinen nur, solange Bella gleitet.
    if (pose.gleitet) {
        const flap = Math.sin(zeit * 0.45) * 0.28;
        for (const fluegel of [{ x: -10, y: -28, w: -1.05 }, { x: -3, y: -32, w: -0.65 }]) {
            ctx.save();
            ctx.translate(fluegel.x, fluegel.y);
            ctx.rotate(fluegel.w + flap);
            ctx.beginPath();
            ctx.ellipse(0, -12, 7, 14, 0, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
            ctx.fill();
            ctx.strokeStyle = 'rgba(255, 210, 74, 0.85)';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.restore();
        }
    }

    // ---------- ferne Beine (hinter dem Körper) ----------
    bein(-16, 4, winkel[0], true);
    bein(14, 4, winkel[1], true);

    // ---------- Körper: weiß, rundlich, mit weicher Kontur ----------
    ctx.beginPath();
    ctx.ellipse(0, -8, 26, 16, 0, 0, Math.PI * 2);
    ctx.fillStyle = F.koerper;
    ctx.fill();
    ctx.strokeStyle = randKoerper;
    ctx.lineWidth = 3;
    ctx.stroke();

    // ---------- kleiner rosa Stern auf der Flanke ----------
    pfadStern(ctx, -6, -7, 5);
    ctx.fillStyle = F.stern;
    ctx.fill();

    // ---------- nahe Beine (vor dem Körper) ----------
    bein(-14, 6, winkel[2], false);
    bein(16, 6, winkel[3], false);

    // ---------- Lara, die kleine Reiterin 👧 ----------
    // Sitzt auf Bellas Rücken und hält sich an der Mähne fest.
    // Wird VOR Hals und Kopf gezeichnet, damit sie hinter der
    // Mähne sitzt (schöne Tiefenwirkung).
    // Bei den Einhorn-Fohlen (ohneReiterin) entfällt sie.
    if (!pose.ohneReiterin) {
        const L = {
            haut: '#ffdfc4', haar: '#f0c96a', // helles Blond
            kleid: '#ff8fcf', schuh: '#b388eb'
        };
        ctx.save();
        ctx.translate(-4, -24); // Hüftpunkt auf Bellas Rücken
        ctx.rotate(-0.06);
        ctx.lineCap = 'round';

        // Zopf, der hinter ihr weht (mit Haargummi)
        ctx.strokeStyle = L.haar;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(-4, -22);
        ctx.quadraticCurveTo(-10, -20 + wehen * 0.6, -13, -13 + wehen);
        ctx.stroke();
        ctx.fillStyle = L.haar;
        ctx.beginPath();
        ctx.arc(-13, -13 + wehen, 2.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = F.maehnePink;
        ctx.beginPath();
        ctx.arc(-8.5, -19.5 + wehen * 0.6, 1.7, 0, Math.PI * 2);
        ctx.fill();

        // hinterer Arm (greift zur Mähne)
        ctx.strokeStyle = L.haut;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(2, -9);
        ctx.quadraticCurveTo(9, -8, 13, -4);
        ctx.stroke();

        // Bein (hängt seitlich an Bellas Flanke herab) + Schühchen
        ctx.beginPath();
        ctx.moveTo(3, 2);
        ctx.quadraticCurveTo(7, 7, 8, 12);
        ctx.stroke();
        ctx.fillStyle = L.schuh;
        ctx.beginPath();
        ctx.ellipse(9.5, 13.5, 4, 2.8, 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = kontur(L.schuh);
        ctx.lineWidth = 1.8;
        ctx.stroke();

        // Kleidchen (kleines rosa Dreieck mit rundem Saum)
        ctx.beginPath();
        ctx.moveTo(-6, 3);
        ctx.quadraticCurveTo(-4, -8, -2, -13);
        ctx.lineTo(4, -13);
        ctx.quadraticCurveTo(7, -8, 8, 3);
        ctx.quadraticCurveTo(1, 6, -6, 3);
        ctx.closePath();
        ctx.fillStyle = L.kleid;
        ctx.fill();
        ctx.strokeStyle = kontur(L.kleid);
        ctx.lineWidth = 2.2;
        ctx.stroke();

        // vorderer Arm (hält sich an der Mähne fest)
        ctx.strokeStyle = L.haut;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(3, -10);
        ctx.quadraticCurveTo(10, -9, 14, -6);
        ctx.stroke();

        // Kopf
        ctx.beginPath();
        ctx.arc(1, -19, 6.5, 0, Math.PI * 2);
        ctx.fillStyle = L.haut;
        ctx.fill();
        ctx.strokeStyle = toneFarbe(L.haut, -0.25);
        ctx.lineWidth = 2;
        ctx.stroke();

        // Haare: Pony über der Stirn + Haarschopf oben
        ctx.fillStyle = L.haar;
        ctx.beginPath();
        ctx.arc(1, -20.5, 6.6, Math.PI * 0.85, Math.PI * 1.95);
        ctx.quadraticCurveTo(6, -24.5, 6.5, -21);
        ctx.quadraticCurveTo(2, -22.5, -1, -20);
        ctx.closePath();
        ctx.fill();

        // Blümchen im Haar
        ctx.fillStyle = '#ffd24a';
        ctx.beginPath();
        ctx.arc(-3.5, -24.5, 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = F.maehnePink;
        for (let bi = 0; bi < 5; bi++) {
            const bw = bi * Math.PI * 2 / 5;
            ctx.beginPath();
            ctx.arc(-3.5 + Math.cos(bw) * 2.6, -24.5 + Math.sin(bw) * 2.6, 1.2, 0, Math.PI * 2);
            ctx.fill();
        }

        // Gesicht: geschlossenes frohes Auge + Lächeln + Wange
        ctx.strokeStyle = GESICHT;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.arc(4, -19, 1.8, Math.PI, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(4, -16.5, 1.8, Math.PI * 0.15, Math.PI * 0.85);
        ctx.stroke();
        const laAlpha = ctx.globalAlpha;
        ctx.globalAlpha = laAlpha * 0.6;
        ctx.fillStyle = F.wange;
        ctx.beginPath();
        ctx.arc(6, -17.5, 1.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = laAlpha;

        ctx.restore();
    }

    // ---------- Hals ----------
    ctx.beginPath();
    ctx.moveTo(10, -6);
    ctx.lineTo(19, -38);
    ctx.lineTo(32, -34);
    ctx.lineTo(24, -2);
    ctx.closePath();
    ctx.fillStyle = F.koerper;
    ctx.fill();
    ctx.strokeStyle = randKoerper;
    ctx.lineWidth = 3;
    ctx.stroke();

    // ---------- Kopf: rund, mit kurzer Schnauze ----------
    ctx.beginPath();
    ctx.arc(28, -38, 12, 0, Math.PI * 2);
    ctx.fillStyle = F.koerper;
    ctx.fill();
    ctx.stroke();

    // ---------- Ohr mit rosa Innenfläche ----------
    ctx.beginPath();
    ctx.moveTo(19, -47);
    ctx.quadraticCurveTo(19.5, -57, 22, -57);
    ctx.quadraticCurveTo(25.5, -56, 26, -47);
    ctx.closePath();
    ctx.fillStyle = F.koerper;
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(21, -49);
    ctx.quadraticCurveTo(21.7, -54, 22.5, -54);
    ctx.quadraticCurveTo(23.6, -53.5, 24, -49);
    ctx.closePath();
    ctx.fillStyle = F.wange;
    ctx.fill();

    // ---------- Horn: Gelb-→-Pink-Verlauf + Spirallinien ----------
    const hornVerlauf = ctx.createLinearGradient(30, -47, 31, -68);
    hornVerlauf.addColorStop(0, F.hornGelb);
    hornVerlauf.addColorStop(1, F.hornPink);
    ctx.beginPath();
    ctx.moveTo(27, -48);
    ctx.lineTo(31, -68);
    ctx.lineTo(35, -47.5);
    ctx.closePath();
    ctx.fillStyle = hornVerlauf;
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = kontur(F.hornPink);
    ctx.stroke();
    // Spiral-/Querlinien auf dem Horn
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(27.8, -53);
    ctx.lineTo(34, -54.5);
    ctx.moveTo(28.8, -58.5);
    ctx.lineTo(33, -60);
    ctx.stroke();

    // ---------- Stirnlocke über der Stirn ----------
    ctx.beginPath();
    ctx.moveTo(21, -50);
    ctx.quadraticCurveTo(28, -59, 37, -49);
    ctx.quadraticCurveTo(30, -52, 26, -46.5);
    ctx.quadraticCurveTo(22.5, -47.5, 21, -50);
    ctx.closePath();
    ctx.fillStyle = F.maehnePink;
    ctx.fill();
    ctx.strokeStyle = randMaehne;
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // ---------- Schnauze mit rosa Nüstern und Lächeln ----------
    ctx.beginPath();
    ctx.ellipse(38, -33.5, 7, 5.5, 0.1, 0, Math.PI * 2);
    ctx.fillStyle = F.koerper;
    ctx.fill();
    ctx.strokeStyle = randKoerper;
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(40.5, -34.5, 1.2, 0, Math.PI * 2);
    ctx.fillStyle = F.nuester;
    ctx.fill();
    // sanftes Lächeln
    ctx.beginPath();
    ctx.arc(38, -31.5, 3, Math.PI * 0.15, Math.PI * 0.85);
    ctx.lineWidth = 1.8;
    ctx.strokeStyle = GESICHT;
    ctx.stroke();

    // ---------- geschlossenes, glückliches Auge mit Wimpern ----------
    ctx.beginPath();
    ctx.arc(27, -39, 3.5, Math.PI, Math.PI * 2); // nach unten geschwungener Bogen
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.beginPath(); // kleine Wimpern an den Enden
    ctx.moveTo(23.5, -39);
    ctx.lineTo(22, -37.6);
    ctx.moveTo(30.5, -39);
    ctx.lineTo(32, -37.6);
    ctx.stroke();

    // ---------- rosa Wange ----------
    const altAlpha = ctx.globalAlpha;
    ctx.globalAlpha = altAlpha * 0.7;
    ctx.beginPath();
    ctx.arc(31.5, -32, 2.8, 0, Math.PI * 2);
    ctx.fillStyle = F.wange;
    ctx.fill();
    ctx.globalAlpha = altAlpha;

    // ---------- 2 Glitzer-Funken um Bella herum ----------
    const funke = (fx, fy, gr, phase) => {
        const puls = 0.4 + 0.6 * Math.abs(Math.sin(zeit * 0.08 + phase));
        const alt = ctx.globalAlpha;
        ctx.globalAlpha = alt * puls;
        ctx.strokeStyle = F.maehneGold;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(fx - gr, fy);
        ctx.lineTo(fx + gr, fy);
        ctx.moveTo(fx, fy - gr);
        ctx.lineTo(fx, fy + gr);
        ctx.stroke();
        ctx.globalAlpha = alt;
    };
    funke(-34, -54, 5, 0);
    funke(42, -56, 4, 2);

    ctx.restore();
}

// =====================================================
// drawFohlen – zeichnet eines der drei Einhorn-Fohlen
// (drawBella in eigenen Farben, ohne Reiterin)
// schluessel = 'rosalie' | 'blaubeere' | 'sternchen'
// =====================================================
function drawFohlen(ctx, x, y, scale, facing, schluessel, pose) {
    const fohlen = KONFIG.FOHLEN[schluessel];
    if (!fohlen) return;
    drawBella(ctx, x, y, scale, facing, Object.assign({}, pose || {}, {
        stil: fohlen.stil,
        ohneReiterin: true
    }));
}

// =====================================================
// Spielfigur: Physik + Aufruf von drawBella
// =====================================================

class Bella {

    constructor() {
        this.reset();
    }

    // Bella an den Levelanfang setzen
    reset() {
        this.x = 120;
        this.y = KONFIG.BODEN_Y - KONFIG.HITBOX.spieler.hoehe / 2;
        this.vy = 0;            // senkrechte Geschwindigkeit
        this.amBoden = true;
        this.richtung = 1;      // 1 = nach rechts, -1 = nach links
        this.laeuft = false;
        this.unverwundbar = 0;  // Restzeit in Frames
        this.feder = 0;         // kurzes "Federn" nach der Landung
        this.turbo = 0;         // Restzeit des Sternen-Turbos in Frames
        this.gleitet = false;   // Funkel-Gleiten (Sprungtaste in der Luft halten)
        this.spur = [];         // Punkte des Regenbogen-Bands (Turbo/Gleiten)
    }

    aktualisiere(dt, eingabe, levelLaenge, plattformen, schwebe, schwimmen, autorennen) {
        plattformen = plattformen || [];
        // schwebe < 1 (z. B. 0.55 unter Wasser) macht die Sprünge
        // langsamer und schwebender – die Sprunghöhe bleibt gleich,
        // nur die Flugzeit wird länger (wie Schwimmen!)
        schwebe = schwebe || 1;
        const warAmBoden = this.amBoden;

        // ---------- Laufen (mit Sternen-Turbo schneller) ----------
        if (autorennen) {
            // Eisrutsche: es geht automatisch nur vorwärts –
            // links/rechts werden ignoriert, nur Springen zählt.
            const rtempo = KONFIG.RUTSCH_TEMPO * (this.turbo > 0 ? KONFIG.TURBO_FAKTOR : 1);
            this.richtung = 1;
            this.laeuft = true;
            this.x += rtempo * dt;
        } else {
            const tempo = KONFIG.LAUFTEMPO * (this.turbo > 0 ? KONFIG.TURBO_FAKTOR : 1);
            let vx = 0;
            if (eingabe.links)  { vx = -tempo; this.richtung = -1; }
            if (eingabe.rechts) { vx =  tempo; this.richtung =  1; }
            this.laeuft = vx !== 0;
            this.x += vx * dt;
        }

        // Nicht aus dem Level hinauslaufen
        this.x = Math.max(30, Math.min(this.x, levelLaenge - 30));

        // ---------- Frei schwimmen (Wasser-Level) ----------
        // Statt zu springen, taucht Bella beim Drücken nach oben und
        // sinkt sonst sanft. So kann sie sich durch Spalten schlängeln.
        if (schwimmen) {
            if (eingabe.springen) this.vy -= KONFIG.SCHWIMM_AUFTRIEB * dt;
            else                  this.vy += KONFIG.SCHWIMM_SINK * dt;
            this.vy *= Math.pow(0.9, dt); // Wasserwiderstand → ruhige Kontrolle
            this.vy = Math.max(-KONFIG.SCHWIMM_MAX, Math.min(KONFIG.SCHWIMM_MAX, this.vy));
            this.y += this.vy * dt;

            const halbeHoehe = KONFIG.HITBOX.spieler.hoehe / 2;
            const obenY = KONFIG.WASSER_OBEN + halbeHoehe;
            const untenY = KONFIG.BODEN_Y - halbeHoehe;
            if (this.y < obenY) { this.y = obenY; if (this.vy < 0) this.vy = 0; }
            if (this.y > untenY) { this.y = untenY; this.vy = 0; this.amBoden = true; }
            else this.amBoden = false;

            if (this.unverwundbar > 0) this.unverwundbar -= dt;
            if (this.turbo > 0) this.turbo -= dt;
            return;
        }

        // ---------- Springen ----------
        if (eingabe.springen && this.amBoden) {
            this.vy = KONFIG.SPRUNGKRAFT * Math.sqrt(schwebe);
            this.amBoden = false;
            Sound.sprung();
        }

        // ---------- Schwerkraft + Landen ----------
        // Bella kann auf dem Boden UND auf schwebenden Plattformen
        // landen. Plattformen sind "von unten durchlässig": Beim
        // Hochspringen fliegt man durch, nur beim Herunterfallen
        // bleibt man oben stehen. Wer daneben springt, landet einfach
        // weich auf der Wiese – es gibt keine Abgründe.
        this.vy += KONFIG.SCHWERKRAFT * schwebe * dt;

        // ---------- Funkel-Gleiten ----------
        // Hält man die Sprungtaste in der Luft gedrückt, breitet Bella
        // ihre Zauber-Flügel aus und segelt ganz langsam nach unten.
        // Das macht Sprünge verzeihender und fühlt sich magisch an!
        this.gleitet = false;
        if (!this.amBoden && this.vy > 0 && eingabe.springen) {
            this.vy = Math.min(this.vy, KONFIG.GLEIT_SINKEN * schwebe);
            this.gleitet = true;
        }

        const halbeHoehe = KONFIG.HITBOX.spieler.hoehe / 2;
        const fuesseVorher = this.y + halbeHoehe;
        this.y += this.vy * dt;
        const fuesseJetzt = this.y + halbeHoehe;

        this.amBoden = false;
        if (this.vy >= 0) {
            if (fuesseJetzt >= KONFIG.BODEN_Y) {
                // fester Wiesenboden
                this.y = KONFIG.BODEN_Y - halbeHoehe;
                this.vy = 0;
                this.amBoden = true;
            } else {
                // Plattformen: nur landen, wenn die Füße in diesem
                // Frame die Oberkante von oben her kreuzen
                for (const p of plattformen) {
                    if (Math.abs(this.x - p.x) > p.breite / 2 + 6) continue;
                    if (fuesseVorher <= p.y + 1 && fuesseJetzt >= p.y) {
                        this.y = p.y - halbeHoehe;
                        this.vy = 0;
                        this.amBoden = true;
                        break;
                    }
                }
            }
        }

        // Gerade gelandet? Dann kurz "federn"
        if (this.amBoden && !warAmBoden) this.feder = 10;
        if (this.feder > 0) this.feder -= dt;

        // ---------- Unverwundbarkeit + Turbo herunterzählen ----------
        if (this.unverwundbar > 0) this.unverwundbar -= dt;
        if (this.turbo > 0) this.turbo -= dt;
    }

    zeichne(ctx, kamera, zeit) {
        const sx = this.x - kamera;

        // ---------- Regenbogen-Band (Turbo & Gleiten) ----------
        // Solange Bella mit Sternen-Turbo rennt oder mit den Zauber-
        // Flügeln gleitet, zieht sie ein buntes Band hinter sich her,
        // das sanft verblasst. Pure Einhorn-Magie!
        const bandAktiv = this.turbo > 0 || this.gleitet;
        const letzter = this.spur[0];
        if (bandAktiv && (!letzter || Math.abs(this.x - letzter.x) > 2.5)) {
            this.spur.unshift({ x: this.x - this.richtung * 18, y: this.y - 6 });
            if (this.spur.length > 24) this.spur.pop();
        } else if (this.spur.length) {
            this.spur.length = Math.max(0, this.spur.length - 2);
        }
        if (this.spur.length > 1) {
            ctx.save();
            ctx.lineCap = 'round';
            ctx.lineWidth = 3;
            for (let b = 0; b < REGENBOGEN.length; b++) {
                const dy = (b - 2.5) * 3;
                ctx.strokeStyle = REGENBOGEN[b];
                for (let i = 0; i < this.spur.length - 1; i++) {
                    ctx.globalAlpha = 0.5 * (1 - i / this.spur.length);
                    ctx.beginPath();
                    ctx.moveTo(this.spur[i].x - kamera, this.spur[i].y + dy);
                    ctx.lineTo(this.spur[i + 1].x - kamera, this.spur[i + 1].y + dy);
                    ctx.stroke();
                }
            }
            ctx.restore();
        }

        // ---------- goldenes Turbo-Leuchten ----------
        // Pulsiert sanft und blendet zum Ende hin aus, damit das
        // Kind sieht, wann der Turbo gleich vorbei ist.
        if (this.turbo > 0) {
            const ausblenden = Math.min(1, this.turbo / 60);
            const leuchten = (0.22 + 0.08 * Math.sin(zeit * 0.3)) * ausblenden;
            ctx.fillStyle = 'rgba(255, 210, 74, ' + leuchten.toFixed(3) + ')';
            ctx.beginPath();
            ctx.ellipse(sx, this.y - 12, 48, 44, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        // ---------- Schatten am Boden ----------
        // Je höher Bella springt, desto kleiner der Schatten.
        const standHoehe = KONFIG.BODEN_Y - KONFIG.HITBOX.spieler.hoehe / 2;
        const flugHoehe = Math.max(0, standHoehe - this.y);
        const schattenGroesse = Math.max(0.35, 1 - flugHoehe / 220);
        ctx.fillStyle = 'rgba(124, 58, 237, 0.15)';
        ctx.beginPath();
        ctx.ellipse(sx, KONFIG.BODEN_Y + 5, 26 * schattenGroesse, 5 * schattenGroesse, 0, 0, Math.PI * 2);
        ctx.fill();

        // Während der Unverwundbarkeit blinkt Bella
        // (halb durchsichtig statt unsichtbar – weniger erschreckend)
        let alpha = 1;
        if (this.unverwundbar > 0 && Math.floor(this.unverwundbar / 5) % 2 === 0) {
            alpha = 0.25;
        }

        ctx.save();
        ctx.globalAlpha = alpha;
        drawBella(ctx, sx, this.y, 0.9, this.richtung, {
            zeit: zeit,
            laeuft: this.laeuft,
            amBoden: this.amBoden,
            vy: this.vy,
            feder: this.feder,
            gleitet: this.gleitet
        });
        ctx.restore();
    }
}
