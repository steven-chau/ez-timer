<div align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/steven-chau/ez-timer/main/screenshots/timer-dark.png">
    <img alt="EZ Timer — free online workout timer with work/rest intervals" src="https://raw.githubusercontent.com/steven-chau/ez-timer/main/screenshots/timer-light.png">
  </picture>
</div>

# EZ Timer — Free Online Workout & HIIT Timer

**A free, no-install interval timer for workouts, HIIT, Tabata, circuit training, stretching, yoga, and any timed routine.** Runs in your browser. No sign-up, no ads, no app store. Now with workout history tracking, calendar heatmaps, and support for 5 languages.

[![License](https://img.shields.io/github/license/steven-chau/ez-timer)](LICENSE)

**[Open the Timer →](https://steven-chau.github.io/ez-timer)**

---

## Why EZ Timer?

Most workout timer apps are bloated with ads, require sign-ups, or lock features behind subscriptions. EZ Timer is different:

- **Truly free.** No ads, no accounts, no paywalls. Just a timer that works.
- **Runs in your browser.** Works on phones, tablets, and desktops. Nothing to install.
- **Works offline.** Once loaded, the timer keeps running even without internet.
- **Zero dependencies.** Vanilla HTML, CSS, and JavaScript. No frameworks, no tracking, no bloat.

## Features

### Quick Workout Setup
Set your work time, rest time, number of sets, and a get-ready countdown — then hit Start. The default 30s work / 10s rest / 3 sets gets you going in seconds.

### Save & Organise Routines
Create and name your own routines (e.g., "Morning Stretch", "Tabata 20/10", "Push-ups"). Saved to your browser — they persist across sessions. **Drag and drop** to reorder your routines, or **clone** an existing routine with one click.

### Multi-Language Support
Switch between **5 languages** from the menu: English, 廣東話 (Cantonese), 台灣中文 (Taiwanese Mandarin), 简体中文 (Simplified Chinese), and 日本語 (Japanese). All UI text updates instantly. Voice announcements adapt to the selected language with locale-specific speech synthesis.

### Full-Screen Timer with Visual Cues
- **Dynamic background colors** change per phase: blue for get-ready, red for work, green for rest
- **Circular progress ring** shows remaining time at a glance
- **Large countdown digits** — readable from across the room
- **Set counter** tracks where you are in your routine

### Celebration Effects
When your workout finishes, a **confetti cannon** fires from the bottom corners with colourful particles and a **party-popper animation** scales up to congratulate you. Because finishing a workout should feel good.

### Workout History & Activity Tracking
Every completed workout is automatically saved with the routine name, date, time, and duration. View your history in two modes:

- **Detailed View** — workouts grouped by day in reverse chronological order, with pagination
- **Calendar Heatmap** — GitHub-style contribution graph showing your workout intensity by day. Deeper greens mean longer sessions.

### Audio & Voice Announcements
- Locale-specific text-to-speech announces each phase in your chosen language
- Countdown beeps for the final 3 seconds of each interval
- Meditation-bowl gong tones during the work phase
- Completion chime when your workout is done

### Touch-Friendly Controls
- **Play / Pause** toggle
- **Skip forward / backward** between intervals
- **Screen lock** prevents accidental taps mid-workout
- **Swipe left / right** to skip intervals on mobile

### PWA-Ready
Add it to your phone's home screen and use it like a native app. Includes a web manifest and supports Apple's standalone mode.

## Use Cases

| Activity | Recommended Settings |
|----------|---------------------|
| **HIIT** | 30s work / 15s rest / 6–10 sets |
| **Tabata** | 20s work / 10s rest / 8 sets |
| **Stretching** | 45s hold / 15s rest / 5–10 sets |
| **Yoga flows** | 60s pose / 20s rest / 8–12 sets |
| **Circuit training** | 40s work / 20s rest / 5–8 sets |
| **Plank holds** | 30–60s work / 15s rest / 3–5 sets |
| **Meditation** | 10 min work / 0s rest / 1 set |
| **Physiotherapy** | 20s exercise / 10s rest / 10–15 sets |

## How to Use

1. **Open** `https://steven-chau.github.io/ez-timer` on any device
2. **Set your routine** — adjust work time, rest time, and number of sets
3. **Hit Start** — the get-ready countdown begins, then your workout starts
4. **Save routines** you like for quick access next time
5. **Track your progress** in the Track Records view — see your workout history and calendar heatmap

That's it. No account, no installation, no ads.

## Running Locally

Clone the repo and open `index.html` in any browser:

```bash
git clone https://github.com/steven-chau/ez-timer.git
cd ez-timer
open index.html  # or double-click in your file manager
```

For local development with a dev server:

```bash
python3 serve.py
# → http://localhost:8080
```

## Technology

Built with vanilla web technologies. No build step, no `node_modules`, no framework:

- **HTML** — semantic, accessible markup
- **CSS** — responsive dark theme with CSS custom properties, flexbox, and grid
- **JavaScript** — modular state machine with Web Audio API, Speech Synthesis, Canvas confetti, and HTML5 Drag and Drop
- **localStorage** — routines, workout records, language preference, and routine ordering persisted client-side

## Browser Support

Works on all modern browsers: Chrome, Firefox, Safari, Edge — on desktop and mobile.

## License

MIT

---

**[Open EZ Timer →](https://steven-chau.github.io/interval-timer)**

*No ads. No sign-up. Just press Start.*
