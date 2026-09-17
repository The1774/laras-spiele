# Leo Ella – Projektdokumentation

*Zweites Spiel der Sammlung „Laras Spiele". Ein kleiner Leopard zum Kümmern: füttern, waschen, streicheln, ins Bett bringen.*

## Über das Spiel

- **Für wen:** Lara (5 Jahre)
- **Figur:** Leo Ella, ein kleiner Leopard mit rosa Schleife – Lara hat sie auf der Design-Leinwand ausgesucht. Alle Zeichnungen liegen als SVG in `design/` (siehe `design/README.md`), sie sind die verbindliche Vorlage.
- **Spielprinzip:** Leo sitzt in ihrem Zimmer. Drei Bedürfnisse (satt, sauber, ausgeschlafen) sinken langsam in echter Zeit. Lara kümmert sich über die Kacheln rechts und mit dem Finger direkt an Leo. Es gibt kein Verlieren, keinen Zeitdruck und nichts Dramatisches.
- **Ohne Text bedienbar:** nur Icons, Ringe und Leos Gesicht. Die Sprechblasen („Mmh, danke!", „Lara!", „Hihihi!") sind Deko für die Eltern.

## Bedienung

| Was | Wie | Was passiert |
|---|---|---|
| Futter | Kachel tippen | Schüssel füllt sich, Leo nickt, Herzen, satt +45 (sauber −8, Krümel) |
| Wasser | Kachel tippen | Blubbern, satt +20 |
| Schwamm | Kachel tippen, dann mit dem Finger über die Flecken wischen | Flecken verschwinden einzeln; ist alles weg: Schütteln, Aufplustern, Glitzer, sauber = 100. Ohne Flecken: sofort frisch. |
| Streicheln | Mit dem Finger über Leo streichen (oder Kachel) | Schnurren mit Herzen, Kopf lehnt sich in den Finger, Schwanz formt ein Herz |
| Kitzeln | Dreimal schnell auf Leo tippen | Kichern, Wackeln, „Hihihi!" |
| Antippen | Einmal auf Leo tippen | Kurzes „Mrrp?" und Blinzeln |
| Decke | Kachel tippen | Gute Nacht: Gähnen, Licht dimmt, Leo schläft im Hausbett, Zzz |
| Sonne | Kachel (nachts statt der Decke) | Guten Morgen: Leo wacht ausgeschlafen auf und freut sich |
| Haus | Knopf oben links | Zurück zum Startbildschirm, kein Dialog |
| Ton | Knopf daneben | Stumm für alle Spiele (hub.stumm) |

Ball-Kachel und Sticker-Album sind Platzhalter („kommt später", gestrichelt).

## Zustände und Reaktionen

Zustände (so sitzt Leo da): zufrieden, hungrig (satt < 35), schmutzig (sauber < 35), müde (ausgeschlafen < 30 oder abends ab 19 Uhr), traurig (über 20 Stunden keine Aktion), schlafend. Das dringendste Bedürfnis gewinnt.

Reaktionen (1–3 Sekunden, dann zurück in den Zustand): Danke fürs Essen, Trinken, Schnurren, Frisch geputzt (Schütteln + Aufplustern), Wiedersehensfreude (beim Öffnen nach mehr als 10 Minuten oder nach dem Aufwachen), Kitzeln, Gute Nacht.

Alle Zahlen stehen in `js/config.js`.

## Zeit

- Bedürfnisse sinken auch bei geschlossener App: satt in 5 h, sauber in 8 h, ausgeschlafen in 14 h von 100 auf 0. Nach langer Abwesenheit bleibt jeder Wert mindestens bei 12 – Leo ist dann hungrig, aber nie verwahrlost.
- Schlafen füllt „ausgeschlafen" im Spiel in 40 s auf, bei geschlossener App in 8 h. Tagsüber wacht Leo dann von selbst auf; abends schläft sie, bis Lara die Sonne drückt oder es Morgen ist.
- Gespeichert wird unter `leoella.leo` (über `gemeinsam/speicher.js`).

## Aufbau

```
leo-ella/
├── index.html      Bühne 1024 × 768: Zimmer-SVG, Leo-SVG, Ringe, Knöpfe, Kachel-Leiste, Partikel-Canvas
├── css/style.css   Layout, Tag/Nacht-Blende, alle Bewegungen (atmen, nicken, hüpfen, wackeln, schütteln …)
├── js/config.js    alle Zahlen
├── js/leo.js       Figur: blendet pro Teil (Augen, Mund, Ohren, Schwanz, Props …) eine Variante ein
├── js/zimmer.js    Tag / Dämmerung / Nacht
├── js/game.js      Bedürfnisse, Zustände, Reaktionen, Aktionen, Speichern, Spielschleife
├── design/         SVG-Quellen von der Design-Leinwand (verbindlich)
└── DOKU.md
```

Geteilte Module aus `../gemeinsam/`: `speicher.js`, `audio.js` (alle Sounds), `skalierung.js`, `eingabe.js` (tippen, ziehen, wischen), `partikel.js` (Herzen, Funkeln, Tropfen, Blasen, Zzz).

### Wie Leo gebaut ist

`design/leo-ella-standard.svg` ist einmal als Inline-SVG in `index.html` übernommen. Alles, was sich zwischen den Zuständen und Reaktionen unterscheidet, steht als eigene Gruppe mit `data-teil="augen"` und `data-variante="muede"` daneben. `Leo.setze({ augen: 'muede', mund: 'gaehnen', … })` blendet pro Teil genau eine Variante ein. Die Koordinaten aller Teile sind über alle Design-Dateien gleich (Kopf-Mitte 160/150, Augen 132/146 und 188/146), deshalb passen die Varianten ohne Verschieben. Die Schleife ist Kind der Ohren-Gruppe und wandert bei hängenden Ohren mit.

Bewegungen sind CSS-Klassen: auf `#leo-figur` (hüpfen, wackeln, schütteln, plustern, vibrieren) und auf `#kopf` (nicken, lehnen). Die Fellfarbe ist die CSS-Variable `--leo-fell` (basis.css) – „Leo umfärben" ist damit später ein Einzeiler.

### Das Zimmer

`design/zimmer/zimmer-tag.svg` als Inline-SVG; die Nacht-Teile aus `zimmer-nacht.svg` liegen als Gruppen `.nur-nacht` daneben (Fenster mit Mond, Overlay, Nachtlicht, Lichterkette, die kleine schlafende Leo im Bett). Tag → Nacht ist die Klasse `nacht` auf `#buehne`, weich geblendet per CSS. `daemmern` dimmt nur das Licht, solange Leo noch gähnt.

## Offene Ideen

- Ball-Kachel (Spielen) und Sticker-Album
- Leo umfärben (rosa / lila Leopard)
- Fütter-Animation mit Schüssel-Ziehen statt Kachel-Tipp
