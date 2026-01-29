# HubIdeas 🚀

Vom Gedanken zum Projekt – alles im Fluss.

HubIdeas ist eine minimalistische, lokale Web-App zur Organisation von Projekten, To-Dos und Gedanken. Sie ist darauf ausgelegt, schnell, privat und ablenkungsfrei zu sein.

## Features

### ⚡ Produktivität & Organisation
- **Schnelle Erfassung**: Projekte und Aufgaben im Handumdrehen anlegen.
- **Gedanken-Speicher**: Ein dedizierter Bereich für lose Ideen und Konzepte pro Projekt.
- **Project Sharing**: Teile Projekte mit anderen Nutzern und arbeite gemeinsam an Ideen. Die Urheber von Inhalten werden dabei transparent angezeigt.

### 🤖 Smart AI Features (powered by Google Gemini)
- **Dual-Mode Chat**:
    - **Unterhaltung**: Diskutiere deine Projekte im freien Dialog.
    - **To-Do Generation**: Lass dir vom Assistenten konkrete, strukturierte Aufgabenlisten erstellen, die du direkt übernehmen kannst.
- **Auto-Suggestions**: Erhalte beim Erstellen eines Projekts sofort 3 konkrete Handlungsschritte – optional deaktivierbar.
- **Resilient Resurfacing**: Intelligente Push-Erinnerungen für vergessene Projekte.
- **Transparent Limits**:
    - **Live-Token-Tracking**: Sehe jederzeit deinen aktuellen Verbrauch im Chat.
    - **Smart Blocking**: Automatische Eingabesperre bei Erreichen des Monatlimits zur Kostenkontrolle.

### 🎨 Design & UX
- **Premium UI**: Modernes Interface mit Glassmorphism, Framer Motion Animationen und "Blobby"-Inputs.
- **Clean Chat**: Kein Duplizieren von Nachrichten, stabile Ansichten auch bei Modus-Wechseln.
- **Adaptive Themes**: Wähle zwischen einem eleganten Dark-Mode ("Slate & Purple") und einem frischen Light-Mode.

### 🛡️ Administration & Sicherheit
- **Admin Dashboard**: Zentrale Verwaltung von Nutzern, Rollen und AI-Limits.
- **Privatsphäre**: Lokal hostbar, volle Datenkontrolle.
- **Blind Admin**: Technisch erzwungener Schutz der Projektinhalte – Administratoren sehen Metadaten, aber keine User-Daten.
- **Transparenz**: Klare Hinweise zur Datenverarbeitung (keine E2EE für AI-Features).

## Tech Stack

- **Framework**: [Next.js 16+](https://nextjs.org) (App Router)
- **UI**: Tailwind CSS, Framer Motion, Lucide Icons
- **Datenbank**: SQLite mit [Prisma](https://prisma.io)
- **Auth**: [Auth.js (NextAuth)](https://authjs.dev)
- **AI**: [Google Gemini 2.0 Flash Lite](https://ai.google.dev/)
- **Notifications**: Web Push Protocol

## Installation & Setup

### 1. Repository klonen
```bash
git clone https://github.com/myreal84/HubIdeas-WebApp.git
cd HubIdeas-WebApp
```

### 2. Abhängigkeiten installieren
```bash
npm install
```

### 3. Umgebungsvariablen konfigurieren
Kopiere die `.env.example` und fülle die Werte aus:
```bash
cp .env.example .env
```
Generiere einen geheimen Schlüssel für `AUTH_SECRET`:
```bash
openssl rand -base64 32
```

### 4. Datenbank initialisieren
```bash
npx prisma migrate dev --name init
```

### 5. Entwicklungsserver starten
```bash
npm run dev
```

Besuche [http://localhost:3000](http://localhost:3000) im Browser.

## Deployment

Wir nutzen eine **Push-to-Deploy** Strategie via `rsync`, um die Produktion sauber und sicher zu halten.
(Siehe `DEPLOYMENT.md` für Details, falls verfügbar).

Bei Updates:
```bash
npm run build && \
rsync -avz --exclude-from='.dockerignore' . user@server:~/hub-ideas/
```
