// =====================================================
// Leo Ella – Gegenstände zum Anfassen
//
// Alles, was Lara mit dem Finger hochheben und zu Leo bringen kann
// (Fisch, Milch, Keks, Apfel, Wasserflasche, Decke), ist ein <div class="ding">
// in index.html. Jeder Gegenstand hat einen Heimatplatz (data-heim="x,y",
// Mittelpunkt auf der Bühne). Wird er irgendwo fallen gelassen, fliegt er
// dorthin zurück. Futter hat drei Stufen (ganz, angebissen, Rest), die
// über data-stufe + CSS ein- und ausgeblendet werden.
//
// Dieses Modul kümmert sich nur um Position, Sichtbarkeit und Stufen.
// Was passiert, wenn ein Gegenstand bei Leo ankommt, entscheidet game.js.
//
// Verwendung:
//     Gegenstand.init(document.getElementById('dinge'));
//     var d = Gegenstand.unterPunkt(x, y);   // Gegenstand unter dem Finger (oder null)
//     Gegenstand.aufheben(d, x, y); Gegenstand.bewegen(x, y); Gegenstand.loslassen();
//     Gegenstand.zurueck(d); Gegenstand.ablegenBei(d, x, y);
//     Gegenstand.stufe(d, 1); Gegenstand.verstecke(d, true); Gegenstand.hinweis(d);
// =====================================================

var Gegenstand = {
    liste: [],
    inHand: null,

    // Halber Greifbereich um den Mittelpunkt (Bühnen-Pixel) – großzügig für kleine Finger
    GREIF_RADIUS: 46,
    // Der Gegenstand schwebt etwas über dem Finger, damit die Hand ihn nicht verdeckt
    FINGER_ABSTAND_Y: 34,

    init: function (container) {
        var els = container.querySelectorAll('.ding');
        for (var i = 0; i < els.length; i++) {
            var el = els[i];
            var heim = (el.getAttribute('data-heim') || '0,0').split(',');
            var d = {
                el: el,
                name: el.getAttribute('data-ding'),
                istFutter: el.classList.contains('futter'),
                heimX: parseFloat(heim[0]),
                heimY: parseFloat(heim[1]),
                x: 0, y: 0,
                stufe: 0,
                versteckt: false
            };
            this.setzePosition(d, d.heimX, d.heimY);
            this.stufe(d, 0);
            this.liste.push(d);
        }
    },

    finde: function (name) {
        for (var i = 0; i < this.liste.length; i++) if (this.liste[i].name === name) return this.liste[i];
        return null;
    },

    setzePosition: function (d, x, y) {
        d.x = x;
        d.y = y;
        d.el.style.left = x + 'px';
        d.el.style.top = y + 'px';
    },

    // Welcher sichtbare Gegenstand liegt unter dem Punkt? (der nächste gewinnt)
    unterPunkt: function (x, y) {
        var bester = null, besteDist = Infinity;
        for (var i = 0; i < this.liste.length; i++) {
            var d = this.liste[i];
            if (d.versteckt || d === this.inHand) continue;
            var dx = x - d.x, dy = y - d.y;
            var dist = dx * dx + dy * dy;
            if (dist < this.GREIF_RADIUS * this.GREIF_RADIUS && dist < besteDist) {
                bester = d;
                besteDist = dist;
            }
        }
        return bester;
    },

    aufheben: function (d, x, y) {
        this.inHand = d;
        d.el.classList.remove('fliegt', 'hinweis');
        d.el.classList.add('in-hand');
        this.bewegen(x, y);
    },

    bewegen: function (x, y) {
        if (!this.inHand) return;
        this.setzePosition(this.inHand, x, y - this.FINGER_ABSTAND_Y);
    },

    // Finger geht hoch – gibt den Gegenstand zurück, entscheidet aber nichts
    loslassen: function () {
        var d = this.inHand;
        if (!d) return null;
        d.el.classList.remove('in-hand');
        this.inHand = null;
        return d;
    },

    // Weich an eine Stelle gleiten (z. B. ans Maul)
    ablegenBei: function (d, x, y) {
        d.el.classList.add('fliegt');
        this.setzePosition(d, x, y);
    },

    // Zurück auf den Heimatplatz fliegen
    zurueck: function (d) {
        if (this.inHand === d) this.loslassen();
        d.el.classList.remove('kippt');
        this.ablegenBei(d, d.heimX, d.heimY);
    },

    // Futter-Stufe (0 = ganz, 1 = angebissen, 2 = Rest)
    stufe: function (d, n) {
        d.stufe = n;
        d.el.setAttribute('data-stufe', n);
    },

    verstecke: function (d, ja) {
        d.versteckt = !!ja;
        d.el.classList.toggle('versteckt', d.versteckt);
    },

    // Wieder frisch am Heimatplatz auftauchen (mit Plopp)
    neuAmPlatz: function (d) {
        var self = this;
        d.el.classList.remove('fliegt', 'kippt', 'in-hand');
        this.setzePosition(d, d.heimX, d.heimY);
        this.stufe(d, 0);
        this.verstecke(d, false);
        d.el.classList.remove('ploppt');
        d.el.getBoundingClientRect();
        d.el.classList.add('ploppt');
        setTimeout(function () { d.el.classList.remove('ploppt'); }, 500);
        return self;
    },

    // Kurz wackeln und leuchten: „mich kannst du nehmen"
    hinweis: function (d) {
        d.el.classList.remove('hinweis');
        d.el.getBoundingClientRect();
        d.el.classList.add('hinweis');
        setTimeout(function () { d.el.classList.remove('hinweis'); }, 1700);
    },

    // Abstand eines Gegenstands (Mittelpunkt) zu einem Punkt
    abstand: function (d, x, y) {
        var dx = d.x - x, dy = d.y - y;
        return Math.sqrt(dx * dx + dy * dy);
    }
};
