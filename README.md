# Laras Spiele

Spielesammlung für Lara: ein Startbildschirm mit großen Kacheln, ein Symbol auf dem Tablet. Reines HTML + Vanilla JavaScript + CSS – kein Build, keine Pakete, keine ES-Module. Alles läuft per Doppelklick auf eine `index.html` (`file://`) und auf GitHub Pages.

Konzept und Regeln: [SAMMLUNG.md](SAMMLUNG.md)

## Struktur

```
laras-spiele/
├── index.html          Startbildschirm (Hub) mit den Spiele-Kacheln
├── manifest.json       „Zum Home-Bildschirm hinzufügen" (Name, Icon, Vollbild, quer)
├── icons/              logo.svg (Quelle), icon-192.png, icon-512.png
├── hub/                style.css, hub.js (Kacheln, Winken, Pling, Ton-Knopf)
├── gemeinsam/          geteilte Basis für alle Spiele
│   ├── basis.css       Fredoka + Fallback, Farbpalette, Knopf-Grundstil, Haus-Knopf
│   ├── speicher.js     localStorage mit Präfix je Spiel + Migration alter Schlüssel
│   ├── audio.js        Web-Audio-Sounds, Stumm-Zustand gemeinsam unter hub.stumm
│   ├── eingabe.js      Gerüst: Pointer Events (tippen, ziehen, wischen)
│   ├── partikel.js     Gerüst: Herzen, Funkeln, Noten, Zzz, Tropfen, Konfetti
│   └── skalierung.js   Gerüst: feste interne Auflösung → transform: scale()
├── zauberwiese/        „Lara und die Zauberwiese" (index.html, css/, js/, bella.png)
└── leo-ella/           „Leo Ella" – vorerst eine „Kommt bald"-Seite
```

## Regeln in Kürze

- Vanilla JS, klassische `<script>`-Tags, geteilter Code per `../gemeinsam/…`
- `localStorage` nur über `gemeinsam/speicher.js` mit Präfix (`zauberwiese.`, `leoella.`, `hub.`)
- Ton-Knopf: `Sound.stummUmschalten()` aus `gemeinsam/audio.js` – einmal stumm, überall stumm
- Haus-Knopf in jedem Spiel oben links (`<a class="haus-knopf" href="../index.html">`), kein Dialog
- Deutsch kommentierter Code, in der Spiel-UI möglichst keine Texte

## Ein neues Spiel hinzufügen

1. Ordner anlegen, z. B. `neues-spiel/` mit `index.html`, `css/`, `js/` und einer `DOKU.md`.
2. In der `index.html` einbinden – in dieser Reihenfolge:
   ```html
   <link rel="stylesheet" href="../gemeinsam/basis.css">
   <link rel="stylesheet" href="css/style.css">
   …
   <script src="../gemeinsam/speicher.js"></script>
   <script src="../gemeinsam/audio.js"></script>
   <script src="js/…"></script>
   ```
3. Speicher mit eigenem Präfix: `var Ablage = Speicher.fuer('neuesspiel');`
4. Haus-Knopf aus `basis.css` oben links einsetzen (siehe `zauberwiese/index.html`).
5. Im Hub (`index.html`) eine weitere `<button class="kachel" data-ziel="./neues-spiel/index.html">` mit Inline-SVG der Figur anlegen und in `hub/style.css` positionieren. Ab dem dritten Spiel: Raster 2 × 2, kleinere Kacheln.
6. Prüfen: Spiel per Doppelklick auf seine `index.html`, Hub per Doppelklick auf die Root-`index.html`, Haus-Knopf zurück.

## Icons erzeugen

Quelle ist `icons/logo.svg`. Die PNGs entstehen ohne Zusatzsoftware mit Windows PowerShell (System.Drawing), Skript: `powershell -ExecutionPolicy Bypass -File icons/icons-erzeugen.ps1`, oder mit einem beliebigen SVG-Konverter (z. B. Inkscape: `inkscape logo.svg -w 512 -o icon-512.png`).

## Auf dem Tablet installieren

Seite auf GitHub Pages öffnen, dann Safari „Zum Home-Bildschirm" bzw. Chrome „App installieren". Das Symbol startet den Hub im Vollbild, quer.
