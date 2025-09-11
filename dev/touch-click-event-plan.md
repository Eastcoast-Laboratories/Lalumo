# Touch/Click Event Plan für Lalumo - Click Event Approach

## Neuer Ansatz: Click Event Triggering

in der AlpineJs app werden die meisten games inder app/src/index.html z.b. mit 

        @click="checkHighOrLowAnswer('low'); blurElement($event)" 

ausgeführt

der feuert aber erst onMouseUp oder touchEnd.

### Grundidee
Statt dass der click erst bei mouseUp oder touchEnd ausgelöst wird, soll bei allen game buttons die Klasse `sound-touch` hinzugefügt werden, die das Verhalten so ändert, dass schon bei touchstart oder mousedown einen **Click Event** ausgelöst wird.
Der bisherige Click Event macht bereits alles richtig (Sound, Logik, etc.).

## Gewünschtes Verhalten

### Touch-Sequenz (Mobile)
```
TOUCH START:
├── Sofortiger Click Event ✓ (gewünscht)
│   └── Click Handler führt Sound + Logik aus
└── Tooltip-Timer startet (500ms)

TOUCH HOLD:
├── Kein weiterer Click
└── Nach 500ms: Tooltip erscheint

TOUCH RELEASE:
├── Tooltip verschwindet
└── Kein zusätzlicher Click (synthetic click verhindern)
```

### Mouse-Sequenz (Desktop)
```
MOUSE DOWN:
├── Sofortiger Click Event ✓ (gewünscht)
│   └── Click Handler führt Sound + Logik aus
└── Tooltip-Timer startet (500ms)

MOUSE HOLD:
├── Kein weiterer Click
└── Nach 500ms: Tooltip erscheint

MOUSE UP:
├── Tooltip verschwindet
└── Kein zusätzlicher Click (synthetic click verhindern)
```

## Piano Keys Integration

## Palm Detection Kompatibilität

### Multi-Touch Handler bleibt unverändert
```javascript
// touch-handler.js macht bereits:
setTimeout(() => {
          // Check if target still exists before clicking
          if (targetElement && targetElement.click && typeof targetElement.click === 'function') {
            targetElement.click();
          }
        }, 10);
```

# Umsetzung:
Tausche

    @touchstart.prevent @touchend.prevent="$el.click();"


durch

    @touchstart.prevent="$el.click();" @mousedown.prevent="$el.click();"
aus