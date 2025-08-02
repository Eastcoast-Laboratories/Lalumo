# Chord Feedback Refactoring & Language Detection

## Notes
- Fallback-Strings für Chord-Feedback wurden entfernt, stattdessen spezifische Ressourcen für korrekt/falsch und stabil/instabil eingeführt.
- Platzhalter ({0}) in den Feedback-Strings entfernt, direkte Texte verwendet.
- JavaScript-Logik für Feedback wurde angepasst, nutzt jetzt spezifische Keys und prüft auf deren Existenz.
- Fehlerbehandlung und Debugging-Logs für fehlende Ressourcen sind vorhanden.
- Erfolgsmeldungen werden jetzt ebenfalls ohne Platzhalter und mit spezifischen Strings angezeigt.
- Debug-Logging für Sprachenerkennung und Playwright-Test zur Sprachprüfung wurden implementiert und getestet.
- Feedback-Problem bei 1_5 Memory Game Debug-Logging ergänzt und analysiert.
- Die Piano-Tasten im 1_5 Memory Game wurden fälschlicherweise vom globalen ButtonBlocker-System gesperrt, da sie die Klasse `activity-button-blocker` hatten. Diese Klasse wurde entfernt, sodass schnelles Spielen wieder möglich ist.
- Nächstes Problem: Bei 1_4 (Sound Judgment) fehlt die Feedback-Nachricht bei falscher Eingabe; Migration auf das globale Feedback-System nötig.
- Debug-Logs im Admin-Interface eingebaut, um Probleme mit Referral-Popup und fehlenden Daten zu analysieren.
- Nginx-Port-80-Konflikt erkannt und gelöst: Default-Site wird im run.sh deaktiviert, damit nur Lalumo-Site auf Port 8080 läuft und nginx korrekt startet.
- run.sh prüft jetzt, ob Docker Port 80 auf dem Host mapped und gibt ggf. eine Warnung aus.
- Info-Button im Admin-Interface (admin.php) zeigt kein Popup; JS-Logik und Debugging werden überarbeitet.
- Im Backend (referral.php) werden keine referral_details als einzelne Events gespeichert, daher gibt es im Frontend keine Details zum Anzeigen. Datenmodell muss erweitert werden.
- Migration für referral_details-Tabelle ist jetzt umgesetzt und getestet. Tabelle wird automatisch angelegt, falls sie fehlt.
- Admin-Interface lädt jetzt referral_details aus der neuen Tabelle und zeigt diese im Info-Popup an.
- Info-Button wird jetzt immer angezeigt, auch wenn keine referral_details vorhanden sind; Popup zeigt dann eine Warnung und Debug-Info an.
- referral_details-Tabelle ist leer, nächste Aufgabe: Backend-Fehleranalyse und Logging für Event-Speicherung.
- Backend-Fix für referral_details-Speicherung bei redeemCode (POST) ist jetzt implementiert und getestet.

## Task List
- [x] Fallback-Logik aus Feedback-Strings entfernen
- [x] Platzhalter aus Feedback-Strings entfernen
- [x] Feedback-Logik im JS-Code auf spezifische Ressourcen umstellen
- [x] Erfolgsmeldungen im Code und in Strings refaktorieren
- [x] Debug-Logging für Sprachenerkennung einbauen
- [x] Playwright-Test für Sprachenerkennung und Feedback-Logik schreiben/erweitern
- [x] Feedback-Problem bei 1_5 (Memory Game) Debug-Logging ergänzen
- [x] Feedback-Problem bei 1_5 (Memory Game) analysieren
- [x] Feedback-Problem bei 1_5 (Memory Game) beheben
- [x] Feedback-Problem bei 1_4 (Sound Judgment) auf unified Feedback-System migrieren
- [x] Info-Button (admin.php): JS-Popup reparieren und Debug-Logs einbauen
- [x] referral_details Backend: Einzelne Referral-Events speichern (Tabellenstruktur/Datenmodell anpassen)
- [x] referral_details im Admin-Interface ausgeben
- [x] referral_details Backend-Debugging: Speicherung und Logging der Events prüfen

## Current Goal
Admin-UI und referral_details Backend-Debugging/Fehleranalyse