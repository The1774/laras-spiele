# Leo Ella – Projektdokumentation

*Zweites Spiel der Sammlung „Laras Spiele". Ein kleiner Leopard zum Kümmern: füttern, waschen, streicheln, ins Bett bringen.*

## Über das Spiel

- **Für wen:** Lara (5 Jahre)
- **Figur:** Leo Ella, ein kleiner Leopard mit rosa Schleife – Lara hat sie auf der Design-Leinwand ausgesucht. Alle Zeichnungen liegen als SVG in `design/` (siehe `design/README.md`), sie sind die verbindliche Vorlage.
- **Spielprinzip:** Leo sitzt in ihrem Zimmer. Drei Bedürfnisse (satt, sauber, ausgeschlafen) sinken langsam in echter Zeit. Lara kümmert sich mit der Hand: Futter aus dem Korb zum Maul ziehen, Flasche hinhalten, mit dem Finger streicheln, Vorhang zuziehen, Decke über Leo legen. Leo reagiert, während Lara es tut (Blick folgt dem Finger, Maul geht auf, jede Körperzone anders). Die Kacheln rechts sind nur Hinweise. Es gibt kein Verlieren, keinen Zeitdruck und nichts Dramatisches. Warum es so gebaut ist und was noch kommt: [KONZEPT.md](KONZEPT.md).
- **Ohne Text bedienbar:** nur Icons, Ringe und Leos Gesicht. Die Sprechblasen („Mmh, danke!", „Lara!", „Hihihi!") sind Deko für die Eltern.

## Bedienung

| Was | Wie | Was passiert |
|---|---|---|
| Füttern | Fisch, Milch, Keks oder Apfel aus dem Korb (unten rechts) zum Maul ziehen | Leo schaut dem Futter nach. Nah am Maul: Maul auf. Halten oder dort loslassen: drei Bissen (Kauen, Krümel, Schmatzen), das Futter wird sichtbar kleiner, dann Herzen und satt +. Danach liegt es frisch im Korb. Woanders losgelassen: fliegt zurück. |
| … Fisch | Lieblingsessen | Herzaugen, Schnurren, Hüpfer, extra Funkeln (satt +35) |
| … Milch | | ganz normal lecker (satt +25) |
| … Keks | nur wenn Leo nicht schon ziemlich satt ist | sonst „Mmh-mm": Kopf dreht sich weg (satt +15, krümelt am meisten) |
| … Apfel | | Leo schnuppert erst misstrauisch, frisst dann doch (satt +20) |
| Zu satt | satt ≥ 92 | Leo dreht bei allem den Kopf weg |
| Bäuerchen | manchmal nach dem Aufessen | „Hicks!", kleiner Hüpfer, Bläschen |
| Trinken | Flasche aus dem Korb ans Maul halten | Flasche kippt, Pegel sinkt, Schlucken, Zunge. Leer: satt +20, Leo leckt sich das Maul, Flasche fliegt zurück und füllt sich. |
| Schwamm | Kachel tippen, dann mit dem Finger über die Flecken wischen | Flecken verschwinden einzeln; ist alles weg: Schütteln, Aufplustern, Glitzer, sauber = 100. Ohne Flecken: sofort frisch. |
| Streicheln | Mit dem Finger über Leo streichen | Jede Zone anders: **Kopf** Schnurren, Kopf lehnt sich an, Schwanz-Herz. **Kinn** Augen zu, Kopf hebt sich, lauter. **Ohr** zuckt, „Mrrp". **Rücken** Fell wellt sich, Schwanz hoch. **Bauch** Leo lehnt sich zurück, Pfoten hoch, eine strampelt, nach einer Weile Kichern. **Pfote** kitzelig. Je gleichmäßiger die Bewegung, desto lauter das Schnurren und desto mehr Herzen. |
| Kitzeln | Dreimal schnell auf Leo tippen | Kichern, Wackeln, „Hihihi!" |
| Antippen | Einmal auf Leo tippen | Kurzes „Mrrp?" und Blinzeln |
| Vorhang | Am Fenster ziehen (oder tippen) | Bahnen gleiten zu / auf, Zimmer wird dämmrig. Nachts aufziehen (tagsüber): Leo wacht auf. |
| Lampe | Stehlampe neben dem Bett antippen | An / aus, Zimmer wird dunkler, bei zugezogenem Vorhang leuchtet sie warm |
| Decke | Vom Bett über Leo ziehen | Beim Hinhalten wird Leo schläfrig; losgelassen: Gähnen, Licht dimmt, Leo schläft im Hausbett, Zzz |
| Sonne | Kachel (nachts statt der Decke) | Guten Morgen: Leo wacht ausgeschlafen auf, Vorhang auf, Lampe an, Decke liegt wieder auf dem Bett |
| Kacheln rechts | Futter / Wasser / Decke tippen | Nur Hinweis: der passende Gegenstand wackelt und leuchtet, Leo schaut hin (Futter: Maul auf, Decke: Gähnen). Streicheln-Kachel: kurzes Schnurren. |
| Haus | Knopf oben links | Zurück zum Startbildschirm, kein Dialog |
| Ton | Knopf daneben | Stumm für alle Spiele (hub.stumm) |

Alles, was Lara anfasst, folgt Leos Blick: Pupillen und Kopf drehen sich zum Finger. Ball-Kachel und Sticker-Album sind Platzhalter („kommt später", gestrichelt).

## Zustände und Reaktionen

Zustände (so sitzt Leo da): zufrieden, hungrig (satt < 35), schmutzig (sauber < 35), müde (ausgeschlafen < 30 oder abends ab 19 Uhr), traurig (über 20 Stunden keine Aktion), schlafend. Das dringendste Bedürfnis gewinnt.

Reaktionen mit Timer (1–3 Sekunden, dann zurück in den Zustand): Aufgegessen (satt / lecker), Bäuerchen, Maul ablecken, Frisch geputzt (Schütteln + Aufplustern), Wiedersehensfreude (beim Öffnen nach mehr als 10 Minuten oder nach dem Aufwachen), Kitzeln, Gute Nacht.

Gehaltene Gesichter (solange etwas am Maul ist oder der Finger streichelt): Maul auf, Schnuppern, Kauen (kurz), „Mmh-mm", Trinkt, Schläfrig, und je Streichel-Zone Schnurren / Kinn / Ohr / Rücken / Bauch / Pfote. `game.js` unterscheidet `spiel.reaktion` (mit Timer) und `spiel.gehalten` (ohne); läuft beides, gewinnt die Reaktion, danach kommt das gehaltene Gesicht zurück.

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
├── js/leo.js       Figur: blendet pro Teil (Augen, Mund, Ohren, Schwanz, Props …) eine Variante ein;
│                   Körperzonen (Leo.zone), Blick zum Finger (Leo.schauZu), Maulposition
├── js/zimmer.js    Tag / Dämmerung / Nacht, Vorhang (ziehen, einrasten), Stehlampe, Trefferbereiche
├── js/gegenstand.js Ziehbare Dinge (.ding): Heimatplatz, aufheben, bewegen, zurückfliegen, Futter-Stufen, Hinweis-Wackeln
├── js/game.js      Bedürfnisse, Zustände, Reaktionen, Füttern/Trinken/Streicheln/Abendritual, Speichern, Spielschleife
├── design/         SVG-Quellen von der Design-Leinwand (verbindlich)
└── DOKU.md
```

Geteilte Module aus `../gemeinsam/`: `speicher.js`, `audio.js` (alle Sounds, u. a. Schnurren mit Lautstärke, Biss, Hicks, Mmh-mm, Schnüffeln, Schluck, Lampe, Vorhang), `skalierung.js`, `eingabe.js` (tippen, ziehen, wischen), `partikel.js` (Herzen, Funkeln, Tropfen, Blasen, Krümel, Zzz).

### Gegenstände

Alles Anfassbare ist ein `<div class="ding" data-ding="fisch" data-heim="712,560">` in `#dinge` (über Leo, unter den Partikeln). `gegenstand.js` kennt nur Position, Sichtbarkeit und Stufen; was am Maul passiert, entscheidet `game.js`. Die Bühne bekommt alle Gesten über `eingabe.js`: beim Zieh-Start wird geschaut, ob unter dem Finger ein Ding liegt (Greifradius 46 px), sonst ob das Fenster angefasst wurde (Vorhang), sonst ist es Streicheln. Ein Ding schwebt 34 px über dem Finger, damit die Hand es nicht verdeckt. „Nah am Maul" heißt: näher als 120 px an Leo.maulPosition(). Futter-Stufen (ganz, angebissen, Rest) sind drei Gruppen `.stufe-0/1/2` im SVG, sichtbar über `data-stufe`.

Körperzonen sind keine SVG-Elemente, sondern Kreise und Ellipsen in Leo-Koordinaten (`Leo.zone`): Ohr, Kinn, Kopf, Pfote, Bauch, Rücken, in dieser Priorität. Die Pupillen sind Gruppen `.pupille` und rutschen per CSS-Transform Richtung Finger, der Kopf neigt sich bis 9° mit.

### Wie Leo gebaut ist

`design/leo-ella-standard.svg` ist einmal als Inline-SVG in `index.html` übernommen. Alles, was sich zwischen den Zuständen und Reaktionen unterscheidet, steht als eigene Gruppe mit `data-teil="augen"` und `data-variante="muede"` daneben. `Leo.setze({ augen: 'muede', mund: 'gaehnen', … })` blendet pro Teil genau eine Variante ein. Die Koordinaten aller Teile sind über alle Design-Dateien gleich (Kopf-Mitte 160/150, Augen 132/146 und 188/146), deshalb passen die Varianten ohne Verschieben. Die Schleife ist Kind der Ohren-Gruppe und wandert bei hängenden Ohren mit.

Bewegungen sind CSS-Klassen: auf `#leo-figur` (hüpfen, wackeln, schütteln, plustern, vibrieren, welle, zurueck, hicks) und auf `#kopf` (nicken, lehnen, heben, ohrzucken, wegdrehen, schnuppern, kauen). Die Fellfarbe ist die CSS-Variable `--leo-fell` (basis.css) – „Leo umfärben" ist damit später ein Einzeiler.

**Noch nicht auf der Design-Leinwand:** Maul offen, Kauen, Zunge, Herzaugen, hochgestreckte Pfoten, Vorhang, Stehlampe, Korb, Fisch/Milch/Keks/Apfel/Flasche und die Decke als Gegenstand sind direkt in `index.html` gezeichnet (im Stil der Vorlagen). Wenn Lara sie auf der Leinwand anders haben will, werden sie dort ersetzt.

### Das Zimmer

`design/zimmer/zimmer-tag.svg` als Inline-SVG; die Nacht-Teile aus `zimmer-nacht.svg` liegen als Gruppen `.nur-nacht` daneben (Fenster mit Mond, Overlay, Nachtlicht, Lichterkette, die kleine schlafende Leo im Bett). Tag → Nacht ist die Klasse `nacht` auf `#buehne`, weich geblendet per CSS. `daemmern` dimmt nur das Licht, solange Leo noch gähnt.

## Offene Ideen

Die Reihenfolge steht in [KONZEPT.md](KONZEPT.md) (Stufe 2 ff.): Leo läuft durchs Zimmer, Ball, eigenes Bad, Küche, Federangel, Sticker-Album, Garten, Besuch. Dazu weiterhin: Leo umfärben (rosa / lila Leopard), Sterne am Fenster als Schlaflied.
