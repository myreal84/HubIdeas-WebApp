# HubIdeas 🚀

Vom Gedanken zum Projekt – alles im Fluss.

HubIdeas ist eine minimalistische, lokale Web-App zur Organisation von Projekten, To-Dos und Gedanken. Sie ist darauf ausgelegt, schnell, privat und ablenkungsfrei zu sein.

## Features

### ⚡ Produktivität & Organisation
- **Schnelle Erfassung**: Projekte und Aufgaben im Handumdrehen anlegen.
- **Gedanken-Speicher**: Ein dedizierter Bereich für lose Ideen und Konzepte pro Projekt.
- **Project Sharing**: Teile Projekte mit anderen Nutzern und arbeite gemeinsam an Ideen. Die Urheber von Inhalten werden dabei transparent angezeigt.

### 🤖 Smart AI Features (powered by Google Gemini)
- **Auto-Suggestions**: Erhalte beim Erstellen eines Projekts sofrott 3 konkrete Handlungsschritte – optional deaktivierbar.
- **Kontext-Chat**: Diskutiere deine Ideen mit einem KI-Assistenten, der den vollen Kontext deiner Notizen kennt.
- **Resilient Resurfacing**: Intelligente Push-Erinnerungen für vergessene Projekte.
    - *Smart Fallback*: Wenn das AI-Limit erreicht ist, motiviert das System mit charmanten Standard-Texten.
- **Fair Use Limits**: Monatliche Token-Kontingente pro Nutzer sorgen für Kostenkontrolle.

### 🎨 Design & UX
- **Premium UI**: Modernes Interface mit Glassmorphism, Framer Motion Animationen und "Blobby"-Inputs.
- **Adaptive Themes**: Wähle zwischen einem eleganten Dark-Mode ("Slate & Purple") und einem frischen Light-Mode.

### 🛡️ Administration & Sicherheit
- **Admin Dashboard**: Zentrale Verwaltung von Nutzern, Rollen und AI-Limits.
- **Privatsphäre**: Lokal hostbar, volle Datenkontrolle.
- **Blind Admin**: Technisch erzwungener Schutz der Projektinhalte – Administratoren sehen Metadaten, aber keine User-Daten.
- **Transparenz**: Klare Hinweise zur Datenverarbeitung (keine E2EE für AI-Features).

## Tech Stack

- **Framework**: [Next.js 15+](https://nextjs.org) (App Router)
- **UI**: Tailwind CSS, Framer Motion
- **Datenbank**: SQLite mit [Prisma](https://prisma.io)
- **Auth**: [Auth.js (NextAuth)](https://authjs.dev)
- **AI**: [Google AI SDK](https://ai.google.dev/)
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

Das Projekt enthält ein `start.sh`-Skript und ist für den Betrieb in einem Docker-Container oder direkt auf einem Linux-Server optimiert.
Bei Updates einfach `git pull` und `./start.sh` (wenn vorhanden) oder `npm run build` ausführen.
