# Leo Ella – SVG-Quellen von der Design-Leinwand

Alle Zeichnungen aus der Designsession als eigenständige SVG-Dateien. Sie sind die **verbindliche Vorlage** für die Figur, die Zustände, die Reaktionen, das Zimmer und die UI. Claude Code soll daraus die Ebenen-Figur bauen, nicht selbst neu zeichnen.

## Inhalt

- `leo-ella-standard.svg` – die Figur im Ruhezustand (viewBox 320 × 300). **Das ist Leo.** Alle anderen Varianten unterscheiden sich nur in Augen, Mund, Brauen, Ohren, Schwanz und Props.
- `zustaende/01…06` – Zufrieden, Hungrig, Müde, Schmutzig, Traurig, Schlafend (je 320 × 300)
- `reaktionen/01…06` – Danke fürs Essen, Schnurren, Frisch geputzt, Wiedersehensfreude, Kitzeln, Gute Nacht (je 320 × 300, Standbild vom Höhepunkt der Animation)
- `zimmer/zimmer-tag.svg`, `zimmer/zimmer-nacht.svg` – Hintergrund 856 × 768 (Bildschirm ist 1024 × 768; rechts liegt die 168 px breite Kachel-Leiste). Die Nacht-Datei enthält bereits die schlafende Leo im Bett und das Nacht-Overlay.
- `ui/` – die drei Status-Ringe (110 × 110, Füllstand über `stroke-dashoffset`, Umfang 289), Kacheln (80 × 80), Ton-, Sticker- und Sonnen-Knopf (40 × 40 bzw. 80 × 80)
- `hub/` – Startbildschirm-Hintergrund und die zwei Kacheln (420 × 520)

## So sollen die Dateien genutzt werden

1. `leo-ella-standard.svg` wird **einmal** als Inline-SVG in `leo-ella/index.html` übernommen. Danach werden die Teile in Gruppen mit IDs aufgeteilt: `augen`, `mund`, `brauen`, `ohren`, `schwanz`, `schleife` (Kind der Ohren-Gruppe!), `wangen`, `props`.
2. Die Varianten aus `zustaende/` und `reaktionen/` werden **nicht** als ganze Dateien geladen, sondern ihre abweichenden Teile (z. B. die Lid-Ellipsen bei „müde", die Bogen-Augen bei „schlafend", der Herz-Schwanz beim Schnurren, die Matschflecken bei „schmutzig") als zusätzliche Gruppen in dasselbe Inline-SVG übernommen und per `display: none` ein-/ausgeblendet.
3. Koordinaten der Teile sind über alle Dateien gleich (Kopf-Mitte 160/150, Augen 132/146 und 188/146, Nase 160/180) – Varianten lassen sich direkt vergleichen und kopieren. Ausnahmen: hängende Ohren stehen bei 90/108 und 230/108 statt 100/86 und 220/86; die Schleife wandert dann mit `translate(10 24)`.
4. Farben: Fell `#ffd98a`, Rosetten `#c98a4a` / `#5a3a22`, Outline `#2b2b3a` (4 px), Wangen `#ff9ec2`, Nase/Schleife `#ff8fcf`, Knoten `#ffd24a`, Bauch/Schnauze `#fff6e6`. Fellfarbe als CSS-Variable vorsehen (später „Leo umfärben").
5. Das Zimmer wird als Inline-SVG hinter Leo gelegt; Tag → Nacht ist kein Dateiwechsel, sondern: Fenster-Gruppe tauschen, Overlay-Rechteck einblenden, Lichter-Gruppe einblenden, Deckenlampe dimmen.
6. Textelemente (Zzz, Sprechblasen) nutzen Fredoka mit Fallback – sie stehen in den Dateien nur als Beispiel; im Spiel werden Sprechblasen dynamisch erzeugt.

Die Dateien sind gerendert exakt so, wie Lara die Figur auf der Design-Leinwand ausgesucht hat. Änderungen an Form oder Gesicht bitte nur nach Rücksprache.

## Noch nicht von der Leinwand

Für die Bade-Szene (17.09.2026) wurden direkt in `index.html` im Stil der Vorlagen gezeichnet: Badewanne mit Hahn, Hocker, Seifenflasche, Duschkopf, Föhn, Schaumberge auf Leo, Nass-Tropfen, Plansch-Pfote und die „Hatschi!“-Blase. Wenn Lara sie auf der Leinwand anders haben will, werden sie dort ersetzt.
