// =====================================================
// Gemeinsame Partikel-Effekte – kleine, wiederverwendbare
// Belohnungs-Effekte auf einem Canvas-Kontext.
//
// Verwendung:
//     var p = Partikel.erstelle();       // eigener Pool je Spiel
//     p.herzen(x, y, 3);                 // Teilchen hinzufügen …
//     p.funkeln(x, y, 8);
//     p.tropfen(x, y, 6);
//     p.blasen(x, y, 4);
//     p.zzz(x, y);                       // ein schwebendes „z"
//     p.noten(x, y, 2);
//     p.konfetti(x, y, 20);
//     p.update(dt);                      // … pro Frame bewegen (dt in Sekunden)
//     p.zeichne(ctx);                    // … und auf das Canvas malen
//     p.leeren();
//
// Alle Effekte sind weich und fröhlich: nichts blitzt, nichts
// erschrickt. Koordinaten sind Bühnen-Koordinaten des Canvas.
// =====================================================

var Partikel = {
    erstelle: function () { return new PartikelPool(); }
};

function PartikelPool() {
    this.liste = [];
}

// ---------- Teilchen erzeugen ----------

// Gemeinsamer Bauplan für ein Teilchen
PartikelPool.prototype.neu = function (art, x, y, extra) {
    var t = {
        art: art, x: x, y: y,
        vx: 0, vy: 0,
        groesse: 12, farbe: '#ff5fa2',
        alter: 0, leben: 1.2,
        drehung: 0, drehGeschw: 0,
        schwerkraft: 0,
        schwebeAmplitude: 0, schwebePhase: Math.random() * 6.28,
        text: ''
    };
    for (var k in extra) t[k] = extra[k];
    this.liste.push(t);
    return t;
};

function zufall(min, max) { return min + Math.random() * (max - min); }

// Rosa Herzen, die langsam aufsteigen (Streicheln, Belohnung)
PartikelPool.prototype.herzen = function (x, y, anzahl, optionen) {
    var o = optionen || {};
    for (var i = 0; i < (anzahl || 3); i++) {
        this.neu('herz', x + zufall(-30, 30), y + zufall(-10, 10), {
            vx: zufall(-25, 25), vy: zufall(-90, -50),
            groesse: o.groesse || zufall(12, 22),
            farbe: ['#ff5fa2', '#ff8fcf', '#ffb3d9'][i % 3],
            leben: zufall(1.2, 1.8), schwebeAmplitude: 18
        });
    }
};

// Kleine Sterne / Glitzer (Magie, Erfolg)
PartikelPool.prototype.funkeln = function (x, y, anzahl) {
    for (var i = 0; i < (anzahl || 8); i++) {
        var w = Math.random() * 6.28, s = zufall(40, 140);
        this.neu('stern', x, y, {
            vx: Math.cos(w) * s, vy: Math.sin(w) * s - 30,
            groesse: zufall(6, 13),
            farbe: ['#ffd24a', '#ffffff', '#b388eb', '#6ec6f0'][i % 4],
            leben: zufall(0.6, 1.1), drehGeschw: zufall(-4, 4), schwerkraft: 60
        });
    }
};

// Wassertropfen, die im Bogen fallen (Baden, Schütteln, Regen)
PartikelPool.prototype.tropfen = function (x, y, anzahl) {
    for (var i = 0; i < (anzahl || 6); i++) {
        this.neu('tropfen', x + zufall(-20, 20), y + zufall(-20, 20), {
            vx: zufall(-160, 160), vy: zufall(-180, -60),
            groesse: zufall(6, 11), farbe: '#6ec6f0',
            leben: zufall(0.6, 1.0), schwerkraft: 420
        });
    }
};

// Krümel, die vom Maul herunterrieseln (Essen)
PartikelPool.prototype.kruemel = function (x, y, anzahl, farbe) {
    for (var i = 0; i < (anzahl || 6); i++) {
        this.neu('konfetti', x + zufall(-16, 16), y + zufall(-6, 6), {
            vx: zufall(-70, 70), vy: zufall(-40, 20),
            groesse: zufall(5, 9), farbe: farbe || '#c98a4a',
            leben: zufall(0.5, 0.9), drehGeschw: zufall(-6, 6), schwerkraft: 500
        });
    }
};

// Seifenblasen, die langsam nach oben schweben und verblassen
PartikelPool.prototype.blasen = function (x, y, anzahl) {
    for (var i = 0; i < (anzahl || 4); i++) {
        this.neu('blase', x + zufall(-40, 40), y + zufall(-20, 20), {
            vx: zufall(-15, 15), vy: zufall(-60, -30),
            groesse: zufall(8, 18), farbe: '#6ec6f0',
            leben: zufall(1.5, 2.5), schwebeAmplitude: 14
        });
    }
};

// Ein schwebendes „z" (Schlafen)
PartikelPool.prototype.zzz = function (x, y, gross) {
    this.neu('text', x, y, {
        vx: 12, vy: -28, groesse: gross ? 30 : zufall(16, 24),
        farbe: '#ffd6ec', leben: 2.6, text: gross ? 'Z' : 'z', schwebeAmplitude: 10
    });
};

// Musiknoten (Singen, Musik)
PartikelPool.prototype.noten = function (x, y, anzahl) {
    for (var i = 0; i < (anzahl || 2); i++) {
        this.neu('text', x + zufall(-20, 20), y, {
            vx: zufall(-20, 20), vy: zufall(-70, -40), groesse: zufall(18, 26),
            farbe: ['#b388eb', '#ff8fcf'][i % 2], leben: 1.6,
            text: i % 2 ? '♫' : '♪', schwebeAmplitude: 12
        });
    }
};

// Bunte Schnipsel mit Schwerkraft (großer Jubel)
PartikelPool.prototype.konfetti = function (x, y, anzahl) {
    for (var i = 0; i < (anzahl || 20); i++) {
        this.neu('konfetti', x, y, {
            vx: zufall(-220, 220), vy: zufall(-360, -140),
            groesse: zufall(6, 10),
            farbe: ['#ff8fcf', '#ffd24a', '#6ec6f0', '#b388eb', '#8fd48a'][i % 5],
            leben: zufall(1.4, 2.2), drehung: Math.random() * 6.28,
            drehGeschw: zufall(-8, 8), schwerkraft: 520
        });
    }
};

// ---------- Bewegen ----------

PartikelPool.prototype.update = function (dt) {
    var uebrig = [];
    for (var i = 0; i < this.liste.length; i++) {
        var t = this.liste[i];
        t.alter += dt;
        if (t.alter >= t.leben) continue;
        t.vy += t.schwerkraft * dt;
        t.x += t.vx * dt;
        t.y += t.vy * dt;
        t.drehung += t.drehGeschw * dt;
        if (t.schwebeAmplitude) {
            // sanftes Hin und Her wie ein Blatt im Wind
            t.x += Math.sin(t.alter * 4 + t.schwebePhase) * t.schwebeAmplitude * dt;
        }
        uebrig.push(t);
    }
    this.liste = uebrig;
};

PartikelPool.prototype.leeren = function () { this.liste = []; };

// ---------- Zeichnen ----------

PartikelPool.prototype.zeichne = function (ctx) {
    for (var i = 0; i < this.liste.length; i++) {
        var t = this.liste[i];
        var rest = 1 - t.alter / t.leben;
        // in den letzten 35 % der Lebenszeit ausblenden
        var alpha = rest < 0.35 ? rest / 0.35 : 1;

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(t.x, t.y);
        ctx.rotate(t.drehung);
        ctx.fillStyle = t.farbe;
        ctx.strokeStyle = t.farbe;

        switch (t.art) {
            case 'herz':    zeichneHerz(ctx, t.groesse); break;
            case 'stern':   zeichneStern(ctx, t.groesse); break;
            case 'tropfen': zeichneTropfen(ctx, t.groesse); break;
            case 'blase':   zeichneBlase(ctx, t.groesse); break;
            case 'konfetti':
                ctx.fillRect(-t.groesse / 2, -t.groesse / 4, t.groesse, t.groesse / 2);
                break;
            case 'text':
                ctx.font = '700 ' + Math.round(t.groesse) + "px 'Fredoka', 'Comic Sans MS', sans-serif";
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(t.text, 0, 0);
                break;
        }
        ctx.restore();
    }
};

// Herz aus zwei Bögen, Spitze nach unten
function zeichneHerz(ctx, g) {
    var s = g / 20;
    ctx.beginPath();
    ctx.moveTo(0, 6 * s);
    ctx.bezierCurveTo(-14 * s, -6 * s, -4 * s, -14 * s, 0, -6 * s);
    ctx.bezierCurveTo(4 * s, -14 * s, 14 * s, -6 * s, 0, 6 * s);
    ctx.closePath();
    ctx.fill();
}

// Vierzackiger Stern
function zeichneStern(ctx, g) {
    var a = g / 2, b = g / 6;
    ctx.beginPath();
    ctx.moveTo(0, -a); ctx.lineTo(b, -b); ctx.lineTo(a, 0); ctx.lineTo(b, b);
    ctx.lineTo(0, a); ctx.lineTo(-b, b); ctx.lineTo(-a, 0); ctx.lineTo(-b, -b);
    ctx.closePath();
    ctx.fill();
}

// Tropfen: Spitze oben, runder Bauch unten
function zeichneTropfen(ctx, g) {
    var r = g / 2;
    ctx.beginPath();
    ctx.moveTo(0, -r * 1.4);
    ctx.bezierCurveTo(r, -r * 0.2, r, r, 0, r);
    ctx.bezierCurveTo(-r, r, -r, -r * 0.2, 0, -r * 1.4);
    ctx.closePath();
    ctx.fill();
}

// Seifenblase: dünner Ring mit kleinem Glanzpunkt
function zeichneBlase(ctx, g) {
    var r = g / 2;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, 6.2832);
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-r * 0.35, -r * 0.35, r * 0.22, 0, 6.2832);
    ctx.fill();
}
