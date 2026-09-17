# Laras Spiele – Spielesammlung

*Dachprojekt für alle Browser-Spiele für Lara. Ein Repo, ein Startbildschirm, ein Symbol auf dem Tablet. Enthält zunächst „Laras Zauberwiese" und „Leo Ella".*

## Idee

Lara öffnet **ein** Symbol auf dem Tablet und sieht einen Startbildschirm mit großen Kacheln – eine pro Spiel. Tippen startet das Spiel, ein kleiner Haus-Knopf im Spiel führt zurück. Jedes Spiel bleibt technisch eigenständig (eigener Ordner, eigene `index.html`, läuft per Doppelklick), teilt sich aber Basis-Code und Design-DNA mit den anderen.

Design-Leinwand (Startbildschirm ganz unten): `https://claude.ai/artifact/BxpP9mC6kNekaz79CUkDBC`

---

## Repo-Struktur

Das bestehende Repo `laras-zauberwiese` wird zu **`laras-spiele`** umbenannt (GitHub leitet die alte URL um, Historie bleibt). Die Zauberwiese wandert per `git mv` in einen Unterordner.

```
laras-spiele/
├── index.html                 ← Startbildschirm (Hub)
├── manifest.json              ← für „Zum Home-Bildschirm hinzufügen"
├── icons/
│   ├── icon-192.png
│   └── icon-512.png
├── hub/
│   ├── style.css
│   └── hub.js                 (Kacheln, Winken beim Start, Klick → Spiel)
├── gemeinsam/                 ← geteilte Basis für alle Spiele
│   ├── basis.css              (Fredoka + Fallback, Farben, Button-Grundstil, Haus-Knopf)
│   ├── audio.js               (Web-Audio-Sounds, Mute mit gemeinsamem Speicher)
│   ├── eingabe.js             (Pointer Events: tippen, ziehen, wischen – Touch + Maus)
│   ├── partikel.js            (Herzen, Funkeln, Noten, Zzz, Tropfen, Konfetti)
│   ├── speicher.js            (localStorage mit Präfix je Spiel)
│   └── skalierung.js          (feste interne Auflösung → transform: scale())
├── zauberwiese/
│   ├── index.html
│   ├── css/  js/  assets/     (Struktur unverändert)
│   └── DOKU.md
└── leo-ella/
    ├── index.html
    ├── css/  js/
    └── DOKU.md
```

**Warum kein Single-Page-Router:** Ein Router würde beide Spiele in eine Seite pressen, mit gemeinsamem Game-Loop, gemeinsamen Event-Listenern und Aufräum-Problemen beim Wechsel. Verlinkte `index.html`-Seiten sind schlicht, robust, und jedes Spiel lässt sich einzeln testen.

---

## Technische Regeln (gelten für alle Spiele)

- Vanilla JS + HTML + CSS, keine Frameworks, kein Build, keine npm-Pakete, kein TypeScript
- **Keine ES-Module** – klassische `<script>`-Tags, geteilter Code per relativem Pfad (`../gemeinsam/audio.js`), damit alles unter `file://` läuft
- Feste interne Auflösung je Spiel, skaliert per CSS (`skalierung.js`)
- **localStorage mit Präfix je Spiel** (`zauberwiese.`, `leoella.`, `hub.`), weil alle Spiele denselben Origin teilen. Nur `hub.stumm` ist bewusst gemeinsam – einmal stumm, überall stumm.
- Alle Texte Deutsch; in der Spiel-UI möglichst keine Texte, nur Icons und Figuren
- Deutsch kommentierter Code

---

## Startbildschirm (Hub)

- Hintergrund: Flieder-zu-Rosa-Verlauf, sanfte Wolken, drei kleine Sterne
- Überschrift **„Laras Spiele"** (für Eltern; Lara orientiert sich an den Kacheln)
- **Zwei große Kacheln** (420 × 520, abgerundet, weißer Rand, lila Schattenkante):
  - **Zauberwiese:** Himmel, Sonne, Regenbogen, Blumenwiese, Bella winkt
  - **Leo Ella:** Pünktchen-Tapete, Hausbett-Ecke, altrosa Teppich, Leo sitzt
- Beim Öffnen winken beide Figuren kurz; Tippen auf eine Kachel: Kachel drückt sich ein, kurzer Pling, dann Wechsel
- Ton-Knopf oben links (klein), sonst nichts
- Ab dem dritten Spiel: Raster aus 2 × 2 Kacheln; mehr als vier Spiele sollten es für eine Fünfjährige nicht gleichzeitig sein

---

## Haus-Knopf in jedem Spiel

- Oben links, 64 px, weiß mit dunkler Outline, Haus-Icon
- Führt zu `../index.html`
- Zauberwiese: weit weg von der Sprung-Taste (die liegt rechts unten). Leo Ella: an der Stelle des bisherigen Ton-Knopfs; der Ton-Knopf rückt daneben.
- Kein Bestätigungsdialog – der Spielstand ist ohnehin gespeichert

---

## Tablet als „App"

`manifest.json` im Root mit Name „Laras Spiele", Icon (Bella + Leo oder nur das Regenbogen-Logo), `display: standalone`, `orientation: landscape`, Startseite `./index.html`. Dann auf dem Tablet: Safari „Zum Home-Bildschirm" bzw. Chrome „App installieren" → Symbol auf dem Startbildschirm, Vollbild ohne Browserleiste.

*Hinweis:* Für Vollbild auf iPad zusätzlich `<meta name="apple-mobile-web-app-capable" content="yes">` und ein `apple-touch-icon`. Ein Service Worker (Offline-Fähigkeit) ist optional und kommt erst, wenn alles läuft – er macht das Debuggen sonst unnötig schwer (Cache).

---

## Umbau-Reihenfolge

1. Repo umbenennen, Zauberwiese in Unterordner verschieben, Hub anlegen → alles läuft wie vorher, nur eine Ebene tiefer
2. `gemeinsam/` anlegen und **nur** `audio.js` und `speicher.js` aus der Zauberwiese herausziehen; Rest der Zauberwiese unverändert lassen
3. Haus-Knopf in die Zauberwiese
4. `manifest.json` + Icons
5. GitHub Pages neu prüfen (Root des umbenannten Repos)
6. Erst dann Leo Ella in `leo-ella/` starten – mit `gemeinsam/` von Anfang an

---

## Claude-Code-Prompt: Umbau der Zauberwiese zur Sammlung

Kompletten Block kopieren, in Claude Code im Ordner des bestehenden Zauberwiese-Projekts einfügen. Diese Datei vorher als `SAMMLUNG.md` in den Ordner legen.

```
Wir bauen das Projekt „Laras Zauberwiese" zu einer Spielesammlung „Laras Spiele" um. Lies zuerst SAMMLUNG.md komplett und halte dich an die Struktur und die Regeln darin. Die Zauberwiese selbst soll dabei so wenig wie möglich verändert werden – sie funktioniert, und das soll so bleiben.

Harte technische Regeln:
- Reines HTML + Vanilla JavaScript + CSS. Keine Frameworks, kein Build-System, keine npm-Pakete, kein TypeScript.
- KEINE ES-Module. Geteilter Code aus gemeinsam/ wird per klassischem <script src="../gemeinsam/…"> geladen. Alles muss per Doppelklick auf eine index.html (file://) laufen – der Hub und jedes Spiel einzeln.
- localStorage mit Präfix je Spiel (zauberwiese., leoella., hub.). Bestehende Zauberwiese-Speicherschlüssel einmalig migrieren, damit Laras Fortschritt nicht verloren geht.
- Deutsch kommentierter Code.

Mache das in dieser Reihenfolge und zeige mir nach jedem Schritt die Git-Befehle und was ich im Browser prüfen soll:

1. Alle Dateien der Zauberwiese mit git mv in den Unterordner zauberwiese/ verschieben (Struktur darin unverändert). Prüfen, dass zauberwiese/index.html per Doppelklick läuft und alle relativen Pfade heil sind.
2. Root-index.html als Startbildschirm nach der Beschreibung in SAMMLUNG.md: Verlauf-Hintergrund, Überschrift „Laras Spiele", zwei große Kacheln (Zauberwiese mit Bella auf der Wiese, Leo Ella im Zimmer – die Leo-Kachel vorerst als Platzhalter mit der Beschreibung aus SAMMLUNG.md), kleiner Ton-Knopf oben links. Figuren als Inline-SVG, kurzes Winken beim Laden, Kachel drückt sich beim Tippen ein, Pling, dann Wechsel zu ./zauberwiese/index.html bzw. ./leo-ella/index.html (letzteres darf vorerst auf eine „Kommt bald"-Seite mit Leo zeigen). Dateien: hub/style.css, hub/hub.js.
3. gemeinsam/ anlegen: basis.css (Fredoka mit System-Fallback, Farbpalette als CSS-Variablen, Grundstil für Buttons und den Haus-Knopf), speicher.js (get/set/remove mit Präfix, Migration alter Schlüssel), audio.js (die vorhandenen Web-Audio-Sounds der Zauberwiese hierher verschieben, Mute-Zustand unter hub.stumm gemeinsam für alle Spiele), eingabe.js, partikel.js und skalierung.js zunächst nur als Gerüst mit Kommentar, was hineingehört. Die Zauberwiese auf gemeinsam/audio.js und gemeinsam/speicher.js umstellen – sonst nichts an ihr ändern.
4. Haus-Knopf in die Zauberwiese: oben links, 64 px, Haus-Icon, führt zu ../index.html, weit weg von den Touch-Steuerungs-Buttons. Kein Bestätigungsdialog.
5. manifest.json im Root (Name „Laras Spiele", display standalone, orientation landscape, start_url ./index.html), Icons in icons/ (192 und 512 px – generiere ein einfaches Regenbogen-Logo als SVG und daraus die PNGs, oder sag mir, wie ich sie erzeuge), Meta-Tags für iPad-Vollbild und apple-touch-icon. Kein Service Worker.
6. README.md im Root kurz aktualisieren (Struktur, wie man ein neues Spiel hinzufügt), zauberwiese/DOKU.md unverändert lassen.
7. Am Ende: Checkliste zum Umbenennen des Repos auf GitHub in laras-spiele, Anpassung des Remotes, GitHub Pages-Prüfung (Root) und die neue Live-URL.

Wichtig: Nach jedem Schritt muss die Zauberwiese weiterhin spielbar sein. Stelle Rückfragen, wenn etwas in SAMMLUNG.md fehlt, statt zu raten.
```

---

*Erstellt am 17.09.2026 – Konzept Spielesammlung*
