# HubIdeas 🚀

Vom Gedanken zum Projekt – alles im Fluss.

HubIdeas ist eine minimalistische, lokale Web-App zur Organisation von Projekten, To-Dos und Gedanken. Sie ist darauf ausgelegt, schnell, privat und ablenkungsfrei zu sein.

## Features

- ⚡ **Schnelle Erfassung**: Projekte und Aufgaben im Handumdrehen anlegen.
- 🧠 **Gedanken-Speicher**: Ein dedizierter Bereich für lose Ideen und Konzepte pro Projekt.
- 🌓 **Design-Switch**: Wähle zwischen einem eleganten Dark-Mode und einem frischen Light-Mode.
- 🤖 **KI-Assistent**: Integriertes Gemini-Modell für To-Do-Vorschläge und Projekt-Impulse.
- 🔔 **Push-Erinnerungen**: Lass dich sanft an Projekte erinnern, die du länger nicht geöffnet hast.
- 🛡️ **Privatsphäre**: Lokal hostbar, keine Cloud-Abhängigkeit für deine Daten.

## Tech Stack

- **Framework**: [Next.js 15+](https://nextjs.org) (App Router)
- **Styling**: Tailwind CSS
- **Datenbank**: SQLite mit [Prisma](https://prisma.io)
- **Authentifizierung**: [Auth.js (NextAuth)](https://authjs.dev)
- **KI**: [Google SDK](https://ai.google.dev/) (Gemini API)

## Installation & Setup

### 1. Repository klonen
```bash
git clone https://github.com/dein-username/hub-ideas.git
cd hub-ideas
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

Das Projekt enthält ein `start.sh`-Skript und ist für den Betrieb in einem Docker-Container oder direkt auf einem Linux-Server optimiert.
Stelle sicher, dass alle Variablen in der `.env` gesetzt sind.
```
