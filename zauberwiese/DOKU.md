# Laras Zauberwiese – Projektdokumentation

*Erstes Spiel einer geplanten kleinen Reihe von Browser-Spielen für Lara.*

## Über das Projekt

- **Für wen:** Lara (5 Jahre)
- **Lara mag:** Blumen, alles in Lila & Pink, Einhörner – ihr Lieblings-Einhorn heißt **Bella**
- **Spielprinzip:** einfaches 2D-Jump-’n’-Run wie klassisches Mario – von links nach rechts laufen, **Blumen sammeln**, über **Hindernisse springen**, am Ende jedes Levels ein **Regenbogen** als Ziel
- **Hauptfigur:** Bella das Einhorn
- **Oberstes Ziel:** Freude machen, **kein Frust** – nichts Gruseliges, keine harten Strafen

---

## Infrastruktur & Tech-Stack

### Entwicklungsumgebung
- **IDE:** PyCharm (Windows)
- **Terminal:** PowerShell im PyCharm-Terminal
- **KI-Assistent:** Claude Code
- **Versionskontrolle:** Git + GitHub
- **Projektordner (Vorschlag):** `C:\Users\FlorianHoff\Claude_Code_Projects\Laras-Zauberwiese\`

### Technik (bewusst einfach gehalten)
- **Reines HTML5 Canvas + Vanilla JavaScript**
- **Keine** Frameworks, **kein** Build-System, **keine** npm-Pakete, **kein** TypeScript
- **KEINE ES-Module** (kein `import`/`export`) – alle JS-Dateien über klassische `<script>`-Tags laden.
  *Grund:* Das Spiel muss sich **per Doppelklick auf `index.html` (file://) ohne Webserver** öffnen lassen.
- **Sound:** Web Audio API (synthetische Töne, keine Audiodateien) + **Mute-Button**
- **Fortschritt:** `localStorage` (höchstes freigeschaltetes Level + Highscore)
- **Responsiv:** feste interne Spielauflösung + Skalierung – funktioniert auf **Desktop (Tastatur)** und **Tablet (Touch)**
- **Code:** sauber, auf Deutsch kommentiert, in mehrere Dateien aufgeteilt

### Grafik-Ansatz
Sprites sind zentral in `config.js` hinterlegt, damit sie leicht austauschbar sind. Drei Wege, in der Reihenfolge unserer Überlegungen:
- **Variante A (schnell):** Emojis als Sprites via `ctx.fillText` (🦄 🌸 ⭐ …) – sofort bunt, keine Bilddateien nötig
- **Variante B (hübscher):** Bella als **freigestelltes PNG** (`assets/images/bella.png`), in Laufrichtung (rechts) gespiegelt, mit sauberem Fallback bei fehlender Datei
- **Variante C (Alternative ohne PNG):** Bella **im Canvas gezeichnet**, Cartoon-Stil mit Regenbogen-Mähne, lila Hufen, geschlossenen Glücksaugen (nah an der Bild-Vorlage)
- **Status:** läuft; Feinschliff Richtung „hübsche Bella" (PNG oder gezeichnet) noch offen → siehe *Offene Punkte*

---

## Projektstruktur

```
Laras-Zauberwiese/
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── config.js      (Sprites, Farben, Konstanten – zentral änderbar)
│   ├── input.js       (Tastatur + Touch-Steuerung)
│   ├── audio.js       (Web-Audio-Sounds + Mute)
│   ├── entities.js    (Blumen, Hindernisse, Bonus, Partikel)
│   ├── player.js      (Bella: Laufen, Springen, Schwerkraft, Doppelsprung)
│   ├── levels.js      (Level-Definitionen als Daten)
│   ├── ui.js          (Herzen, Punkte, Bildschirme/Menüs)
│   └── game.js        (Game-Loop, Zustände, verbindet alles)
└── assets/
    └── images/        (optional: bella.png)
```

---

## Spielkonzept & Regeln

- **Seitwärts-Scroller:** Bella läuft nach rechts, die Welt scrollt mit
- **Sammeln:** Blumen = Punkte · ⭐ = Extrapunkte · 💖 = Extraleben (max. 3 Herzen) · 🌈 = Ziel
- **3 Herzen:** Bei Treffer −1 Herz + **kurze Unverwundbarkeit** (~1,5 s, Bella blinkt). Bei 0 Herzen ein **freundlicher „Nochmal?"-Bildschirm** (kein hartes „Game Over")
- **Doppelsprung:** zweimal springen (`maxJumps = 2`), **Glitzer-Effekt beim zweiten Sprung**, kleine „Coyote-Zeit" für faire Sprünge
- **7 kurze Level**, je ca. 30–60 s, mit sanft steigender Schwierigkeit

### Kindgerechte Schwierigkeit (SEHR wichtig – 5 Jahre!)
- **Hitboxen kleiner als die Sprites** – Beinahe-Treffer zählen nicht
- Moderate Geschwindigkeit, niedrige Hindernisse, gut schaffbare Sprünge
- **Kein Tod durch Abgründe** – nur Hindernisse kosten ein Herz
- Nach jedem Treffer Unverwundbarkeit + Blinken
- Viel positives Feedback: **Glitzer + „Pling"** beim Sammeln, **„Super!"** bei Level-Ende

---

## Steuerung

**Tastatur (Desktop):**
- `←` / `→` = laufen
- `Leertaste` oder `↑` = springen (Doppelsprung)
- `P` = Pause · `M` = Stumm

**Touch (Tablet):**
- Große, kindgerechte Buttons am unteren Rand: links `←`/`→`, rechts ein **großer Sprung-Button**
- Touch-Buttons **nur auf Touch-Geräten** einblenden

---

## Level (7)

| # | Name | Stimmung |
|---|------|----------|
| 1 | Zauberwiese | helle Blumenwiese |
| 2 | Zauberwald | Wald, Bäume |
| 3 | Abendhimmel | warme Abendfarben |
| 4 | Wolkenwelt | über/zwischen Wolken |
| 5 | Sternennacht | dunkelblau-violett, Sterne, Mond (starker Kontrast) |
| 6 | Regenbogental | kräftige Farben, Regenbögen im Hintergrund |
| 7 | Wolkenschloss | über den Wolken, rosa-violetter Himmel |

Jedes Level endet mit dem **Ziel-Regenbogen** und einem „Geschafft"-Bildschirm.

---

## Optik & Design

- Pastell-Stimmung, viel **Lila und Pink**, Glitzer, Herzchen, Wolken
- Schrift: **Fredoka** (Google Font) mit System-Fallback (`'Fredoka', 'Comic Sans MS', sans-serif`) – bleibt auch offline lesbar
- **Kontrast-Regel (wichtig für Sichtbarkeit):**
  - **Interaktive Objekte** (Blumen, Bonus, Hindernisse, Ziel): dunkle **Outline + Glow + Schatten**, etwas größer, leichte **Puls-/Glitzer-Animation**
  - **Deko** (Wolken, Sonne, Bäume, Schmetterlinge): **halbtransparent (50–60 %)**, ohne Outline, im Hintergrund – nicht mit Sammelobjekten verwechselbar
  - Kräftigere Hintergründe, klare **Horizontlinie**, **Bodenschatten** unter Bella

### Farbpalette
| Element | Wert |
|---------|------|
| Lila | `#b388eb` |
| Pink | `#ff8fcf` |
| Hell-Pink | `#ffd6ec` |
| Himmel (Verlauf) | `#e9d5ff` → `#fce7f3` |
| Wiese | `#a7e3a0` (kräftiger: `#6cc06a`) |
| Sonne / Akzent | `#ffe066` |
| Bella-Outline / Augen | `#2b2b3a` |
| Bella Körper / Hufe / Wange | `#ffffff` / `#b59bd6` / `#ff9ec2` |
| Mähne & Schweif | Pink `#ff8fbf` · Gold `#ffd24a` · Blau `#6ec6f0` · Lila `#b388eb` |
| Horn (Verlauf) | Gelb `#ffd24a` → Pink `#ff8fb0` |

---

## Bildschirme / UI

- **Startbildschirm:** Titel, winkende Bella 🦄, großer Button **„Spielen"**, **Level-Auswahl** (nur freigeschaltete Level)
- **HUD im Spiel:** oben links 3 Herzen · oben rechts Blumen-Zähler + Punkte · oben Mitte Level-Name
- **Level geschafft:** Glitzer/Konfetti, „Toll gemacht! Du hast [X] Blumen gesammelt", Button **„Weiter"**
- **„Nochmal?"-Bildschirm** bei 0 Herzen, lieb formuliert
- Alle Texte auf **Deutsch**, groß und gut lesbar

---

## Hosting / Veröffentlichung

- **Lokal:** Doppelklick auf `index.html` – läuft ohne Server (nur die optionale Web-Font braucht Internet)
- **Online: GitHub Pages** (gewählte Lösung für dauerhafte URL)
  - ⚠️ **Kostenloses Konto → Repo muss ÖFFENTLICH sein.** Privates Repo mit Pages geht nur mit GitHub **Pro**. Die veröffentlichte Seite ist ohnehin immer öffentlich erreichbar – für ein Kinderspiel unkritisch.
  - ⚠️ **Zwei GitHub-Konten!** Immer ins **PRIVATE** Konto pushen, **nicht** ins Business-Konto **HfM-Develop**. (Beim ersten Versuch versehentlich unter `HfM-Develop/Unicorn` gelandet.)
  - Repo: `laras-zauberwiese` (privates Konto)
  - Live-URL: `https://<privater-name>.github.io/laras-zauberwiese/`
- **Alternative „sofort spielbar, ohne GitHub":** Netlify Drop – Spielordner (mit `index.html`) ins Browserfenster auf `app.netlify.com/drop` ziehen

---

## Wiederverwendbare Basis für weitere Spiele

Damit die nächsten Spiele schneller entstehen, gelten diese Punkte für **alle** Lara-Spiele:

- **Gleiche Tech-Regeln:** Vanilla JS + Canvas, keine ES-Module, per Doppelklick lauffähig
- **Gleiche kindgerechte Design-Prinzipien:** kein Frust, große Touch-Buttons, viel positives Feedback, Deko im Hintergrund / Ziele klar hervorgehoben
- **Gleiche Steuerungs-Logik:** Tastatur **und** Touch, automatisch je Gerät
- **Konstante Design-DNA:** Pastell, Lila/Pink, Bella als wiederkehrende Figur, verspielte runde Schrift
- **Empfehlung:** die Engine-Teile (Game-Loop, Eingabe, Audio, Partikel, UI/Screens, Level-Loader, `localStorage`) als **wiederverwendbare Basis** herauslösen. Ein neues Spiel besteht dann vor allem aus **neuen Leveln, Sprites und Thema** – das spart bei jedem weiteren Spiel viel Zeit.

---

## Ideen für weitere Spiele (Lara)

- **Bella-Memory** – Kartenpaare mit Blumen & Einhörnern
- **Bella-Malbuch** – Ausmalen mit Lila/Pink-Palette
- **Blumen zählen & sortieren** – spielerisch Zahlen und Farben lernen
- **Bella-Puzzle** – wenige große Teile
- **Klang-/Musikspiel** – Töne zu Tieren/Blumen
- **Bella ankleiden / Farbe wechseln**
- *Aus dem Jump-’n’-Run heraus:* mehr Level, geheime Bonuswelt, Sterne sammeln → Bellas Farbe ändern, „Für Lara" beim Start einblenden

---

## Offene Punkte / To-Do

- [ ] Finalen Grafik-Stil für Bella festlegen (PNG vs. gezeichnet)
- [ ] Kontrast/Sichtbarkeit weiter verbessern (Feedback aus Screenshots umsetzen)
- [ ] Level 5–7 einbauen (Sternennacht, Regenbogental, Wolkenschloss)
- [ ] Ins **private** GitHub-Repo pushen + GitHub Pages aktivieren
- [ ] Auf Laras Tablet testen (Touch-Steuerung, Sichtbarkeit)

---

## Wichtige Pfade / Links

```
Projektordner: C:\Users\FlorianHoff\Claude_Code_Projects\Laras-Zauberwiese\
Einstieg:      index.html
Bella-Sprite:  assets\images\bella.png (optional)
Repo:          github.com/<privater-name>/laras-zauberwiese
Live-URL:      https://<privater-name>.github.io/laras-zauberwiese/
```

---

*Erstellt am 17.09.2026 – Laras-Zauberwiese Entwicklungssession*
