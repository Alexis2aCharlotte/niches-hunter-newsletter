# 📰 Niches Hunter Newsletter Generator

Service de génération et d'envoi de la newsletter quotidienne Niches Hunter.

## 🚀 Features

- **AI Analysis** - Analyse les données App Store avec GPT-4o
- **HTML Generation** - Génère un email responsive avec dark mode
- **Batch Sending** - Envoi à tous les subscribers via Resend
- **Telegram Notifications** - Alertes en temps réel

## 📦 Installation

```bash
# Cloner le repo
git clone https://github.com/your-username/niches-hunter-newsletter.git
cd niches-hunter-newsletter

# Installer les dépendances
npm install

# Configurer l'environnement
cp .env.example .env
# Éditer .env avec vos clés API
```

## 🔧 Configuration

Copier `.env.example` vers `.env` et remplir :

| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | URL de votre projet Supabase |
| `SUPABASE_SERVICE_KEY` | Clé service role Supabase |
| `OPENAI_API_KEY` | Clé API OpenAI |
| `RESEND_API_KEY` | Clé API Resend |
| `TELEGRAM_BOT_TOKEN` | Token du bot Telegram |
| `TELEGRAM_CHAT_ID` | ID du chat pour les notifications |

## 🏃 Utilisation

### Lancer le serveur

```bash
npm run dev
```

Le serveur démarre sur `http://localhost:3001`

### Générer manuellement

```bash
npm run generate
```

### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| POST | `/generate` | Déclenche la génération |

## 🚂 Déploiement Railway

```bash
# Login Railway
railway login

# Déployer
railway up
```

### CRON Configuration

Dans Railway, configurer un CRON job pour exécuter à 7h :
```
0 7 * * *
```

## 📁 Structure

```
src/
├── index.ts              # Serveur Express
├── generate.ts           # Script principal
├── services/
│   ├── supabase.ts       # Client Supabase
│   ├── openai.ts         # Client OpenAI
│   ├── email.ts          # Client Resend
│   └── telegram.ts       # Notifications
└── templates/
    └── newsletter.ts     # Générateur HTML
```

## 📊 Workflow

```
1. Fetch daily_picks_v2 (Supabase)
2. Format data for AI
3. Analyze with GPT-4o
4. Generate HTML
5. Save to newsletters_v2
6. Send to all subscribers
7. Notify via Telegram
```

## 📄 License

MIT

