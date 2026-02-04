# HubIdeas 🚀

Vom Gedanken zum Projekt – alles im Fluss.

HubIdeas ist eine minimalistische, lokale Web-App zur Organisation von Projekten, To-Dos und Gedanken. Sie ist darauf ausgelegt, schnell, privat und ablenkungsfrei zu sein.

## Features

### ⚡ Produktivität & Organisation
- **Schnelle Erfassung**: Projekte und Aufgaben im Handumdrehen anlegen.
- **Gedanken-Speicher**: Ein dedizierter Bereich für lose Ideen und Konzepte pro Projekt.
- **Global-Suche**: Schnelles Finden von Projekten, Aufgaben und Gedanken über die zentrale Suchleiste im Menü.
- **Project Sharing**: Teile Projekte mit anderen Nutzern und arbeite gemeinsam an Ideen. Die Urheber von Inhalten werden dabei transparent angezeigt.
- **Warteraum & Status-Check**: Verbesserter Flow für die Freischaltung neuer Nutzer mit Echtzeit-Statusüberprüfung.

### 📱 PWA & Mobile
- **Installierbar**: Nutze HubIdeas als native App auf deinem Smartphone oder Desktop (PWA).
- **Home-Screen Button**: Eigener Installations-Button im Menü für schnellen Zugriff.
- **Background Push**: Erhalte Benachrichtigungen auch wenn die App geschlossen ist.
- **Slim Mobile UI**: Optimierte Navigation und Eingabefelder für mobile Nutzung.

### 🤖 Smart AI Features (powered by Google Gemini)
- **Idee entwickeln (Brainstorming)**: Ein dedizierter Modus, um Gedanken mit der KI zu strukturieren und direkt in Projekte zu verwandeln.
- **Dual-Mode Chat**: Diskutiere Projekte oder lass dir To-Do Listen generieren.
- **Live-Token-Tracking**: Behalte deinen KI-Verbrauch im Header immer im Blick.

---

## 🛠️ Installation & Setup (Lokal)

### 1. Repository klonen & Installieren
```bash
git clone https://github.com/myreal84/HubIdeas-WebApp.git
cd HubIdeas-WebApp
npm install
```

### 2. Konfiguration
Kopiere die `.env.example` zu `.env` und setze `AUTH_SECRET` sowie deinen `GOOGLE_GENERATION_AI_API_KEY`.

### 3. Starten
```bash
npx prisma migrate dev --name init
npm run dev
```

---

## 🚀 Server Installation (Neu / Docker)

Um HubIdeas auf einem frischen Linux-Server (z.B. Debian/Ubuntu) aufzusetzen, folge diesen Schritten:

### 1. Server Vorbereitung
Stelle sicher, dass du SSH-Zugriff hast (ggf. `PermitRootLogin yes` in der `/etc/ssh/sshd_config` aktivieren, falls du als root arbeitest).

Installiere notwendige Tools:
```bash
apt update && apt install -y curl rsync
```

### 2. Docker Setup
Zuerst Docker auf dem Server installieren:
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
```

### 3. Verzeichnisstruktur anlegen
Bevor du den Code hochlädst, erstelle den Ordner für die persistente Datenbank, um Dateisystem-Fehler beim ersten Docker-Start zu vermeiden:
```bash
mkdir -p ~/hub-ideas/prisma/data
```

### 4. Deployment (vom lokalen Rechner)
Nutze `rsync`, um den Code auf den Server zu schieben. Exkludiere dabei lokale Abhängigkeiten:

```bash
rsync -avz --exclude 'node_modules' --exclude '.next' --exclude '.git' --exclude '.env' . root@DEINE_IP:~/hub-ideas/
```

### 5. Umgebungsvariablen am Server
Erstelle die `.env` direkt auf dem Server:
```bash
ssh root@DEINE_IP "nano ~/hub-ideas/.env"
```

### 6. Starten
```bash
cd ~/hub-ideas
docker compose up -d --build
```
Die Datenbank wird beim ersten Start automatisch initialisiert.

---

## 📂 Tech Stack

- **Framework**: [Next.js 16+](https://nextjs.org) (App Router)
- **UI**: Tailwind CSS, Framer Motion, Lucide Icons
- **Datenbank**: SQLite mit [Prisma](https://prisma.io)
- **Auth**: [Auth.js (NextAuth)](https://authjs.dev)
- **AI**: [Google Gemini 2.0 Flash Lite](https://ai.google.dev/)
- **PWA**: Service Worker & Web Push Protocol

