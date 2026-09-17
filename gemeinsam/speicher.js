// =====================================================
// Gemeinsamer Speicher (localStorage) für alle Spiele
//
// Alle Spiele der Sammlung teilen sich denselben Origin – und damit
// denselben localStorage. Damit sich nichts in die Quere kommt, hat
// jedes Spiel sein eigenes Präfix:
//     zauberwiese.  leoella.  hub.
//
// Verwendung (klassisches Script-Tag, kein Modul):
//     var Ablage = Speicher.fuer('zauberwiese');
//     Ablage.set('fortschritt', { level: 3 });   // Objekte werden als JSON abgelegt
//     Ablage.get('fortschritt', null);           // → { level: 3 } oder der Standardwert
//     Ablage.remove('fortschritt');
//     Ablage.migriere('alter-schluessel', 'fortschritt'); // einmaliger Umzug alter Daten
//
// localStorage kann blockiert sein (Privatmodus, Datei-Zugriff in
// manchen Browsern) – deshalb ist alles in try/catch gepackt und
// fällt dann still auf "ohne Speichern spielen" zurück.
// =====================================================

var Speicher = {

    // Liefert ein Ablage-Objekt, dessen Schlüssel alle mit "<praefix>." beginnen
    fuer: function (praefix) {
        var voll = function (schluessel) { return praefix + '.' + schluessel; };

        return {
            praefix: praefix,

            // Wert lesen. Gibt den Standardwert zurück, wenn nichts da ist
            // oder der Speicher nicht erreichbar ist.
            get: function (schluessel, standard) {
                try {
                    var roh = localStorage.getItem(voll(schluessel));
                    if (roh === null) return standard;
                    return JSON.parse(roh);
                } catch (e) {
                    return standard;
                }
            },

            // Wert schreiben (alles wird als JSON abgelegt)
            set: function (schluessel, wert) {
                try {
                    localStorage.setItem(voll(schluessel), JSON.stringify(wert));
                    return true;
                } catch (e) {
                    return false;
                }
            },

            // Wert löschen
            remove: function (schluessel) {
                try {
                    localStorage.removeItem(voll(schluessel));
                } catch (e) { /* egal */ }
            },

            // Einmaliger Umzug: Ein alter Schlüssel OHNE Präfix (z. B. aus der
            // Zeit vor der Spielesammlung) wird unter den neuen Schlüssel MIT
            // Präfix übernommen und danach gelöscht. Passiert nur, wenn der
            // neue Schlüssel noch leer ist – vorhandene neue Daten gewinnen.
            migriere: function (alterSchluessel, neuerSchluessel) {
                try {
                    var alt = localStorage.getItem(alterSchluessel);
                    if (alt === null) return false;
                    if (localStorage.getItem(voll(neuerSchluessel)) === null) {
                        var wert;
                        try { wert = JSON.parse(alt); }   // alte Daten waren meist schon JSON …
                        catch (e) { wert = alt; }         // … sonst als Text übernehmen
                        localStorage.setItem(voll(neuerSchluessel), JSON.stringify(wert));
                    }
                    localStorage.removeItem(alterSchluessel);
                    return true;
                } catch (e) {
                    return false;
                }
            }
        };
    }
};
