# 📰 Roadmap - Newsletter Generator

> Service de génération et d'envoi de la newsletter quotidienne Niches Hunter

---

## 🎯 Objectif

Générer automatiquement chaque jour une newsletter analysant les tendances App Store, les niches à explorer, et les opportunités pour indie devs. Envoi à tous les abonnés actifs.

---

## 📊 Workflow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                   NEWSLETTER GENERATOR WORKFLOW                          │
│                                                                          │
│  1. TRIGGER (CRON ou Manuel)                                             │
│     └── Déclenché tous les jours à 7h                                    │
│                                                                          │
│  2. GET DAILY PICKS (Supabase)                                           │
│     └── Table: daily_picks_v2                                            │
│     └── Limite: 20 apps                                                  │
│                                                                          │
│  3. FORMAT DATA (JavaScript)                                             │
│     └── Transforme les apps en texte lisible pour l'IA                   │
│                                                                          │
│  4. ANALYSE IA (OpenAI GPT-4o)                                           │
│     └── Génère JSON structuré:                                           │
│         • title, date, summary                                           │
│         • 3 insights                                                     │
│         • 3 apps max avec potentiel                                      │
│         • 2 niches à explorer                                            │
│         • 1 action du jour                                               │
│                                                                          │
│  5. GENERATE HTML (JavaScript)                                           │
│     └── Template avec dark mode support                                  │
│     └── Progress bars, couleurs par catégorie                            │
│                                                                          │
│  6. SAVE TO SUPABASE                                                     │
│     └── Table: newsletters_v2                                            │
│     └── Champs: content, run_date, title                                 │
│                                                                          │
│  7. GET SUBSCRIBERS (Supabase)                                           │
│     └── Table: newsletter_subscribers                                    │
│     └── Filter: status = 'subscribed'                                    │
│                                                                          │
│  8. SEND TO ALL (Resend)                                                 │
│     └── Batch sending (10 emails à la fois)                              │
│     └── Subject: titre de la newsletter                                  │
│                                                                          │
│  9. NOTIFY (Telegram)                                                    │
│     └── Stats: nombre envoyé, échecs                                     │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🔧 Ce qui est déjà en place

| Élément | Status | Détails |
|---------|--------|---------|
| Table `daily_picks_v2` | ✅ Existant | Source des données apps |
| Table `newsletters_v2` | ✅ Existant | Stockage des newsletters |
| Table `newsletter_subscribers` | ✅ Existant | Liste des abonnés |
| Clé API OpenAI | ✅ Existant | Pour l'analyse IA |
| Resend configuré | ✅ Existant | support@arianeconcept.fr |
| Telegram Bot | ✅ Existant | Notifications |

---

## 🚀 Migration à faire

### Phase 1 : Setup Projet
- [ ] Initialiser projet Node.js + TypeScript
- [ ] Installer dépendances
- [ ] Configurer .env
- [ ] Structure de dossiers

### Phase 2 : Services
- [ ] Client Supabase
- [ ] Client OpenAI
- [ ] Client Resend
- [ ] Client Telegram

### Phase 3 : Logique Principale
- [ ] Récupération daily_picks_v2
- [ ] Formatage données pour IA
- [ ] Appel OpenAI avec prompt
- [ ] Parsing JSON response
- [ ] Génération HTML newsletter

### Phase 4 : Envoi
- [ ] Récupération subscribers actifs
- [ ] Batch sending avec Resend
- [ ] Sauvegarde dans newsletters_v2
- [ ] Notification Telegram

### Phase 5 : API & CRON
- [ ] Endpoint `/generate` pour trigger manuel
- [ ] Endpoint `/health` pour monitoring
- [ ] Configuration CRON Railway

### Phase 6 : Déploiement
- [ ] Push GitHub
- [ ] Créer service Railway
- [ ] Configurer variables d'environnement
- [ ] Configurer CRON (7h chaque jour)
- [ ] Tester

---

## 📋 Variables d'Environnement

```env
# Server
PORT=3001
NODE_ENV=production

# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGc...

# OpenAI
OPENAI_API_KEY=sk-proj-xxxxx

# Email (Resend)
RESEND_API_KEY=re_xxxxx
EMAIL_FROM=support@arianeconcept.fr

# Telegram
TELEGRAM_BOT_TOKEN=xxxxx
TELEGRAM_CHAT_ID=1791080209
```

---

## 🎨 Structure Newsletter HTML

```typescript
interface NewsletterData {
  title: string;           // "🚀 AI Photo Editors Are Exploding"
  date: string;            // "December 12, 2024"
  summary: string;         // 2 lignes de résumé punchy
  
  insights: string[];      // 3 insights clés
  
  apps: {
    name: string;
    category: string;
    rank: number;
    market: string;
    flag: string;
    opportunity: string;
    potential: number;     // 80 (pourcentage)
  }[];
  
  niches: {
    title: string;
    competition: string;
    competitionScore: number;
    potential: string;
    potentialScore: number;
    description: string;
  }[];
  
  action: string;          // Recommandation actionnable
}
```

---

## 🎨 Couleurs par Catégorie

```javascript
const categoryColors = {
  'Entertainment': '#9B59B6',
  'Photo & Video': '#E91E63', 
  'Social Networking': '#3498DB',
  'Productivity': '#27AE60',
  'Finance': '#F39C12',
  'Health & Fitness': '#1ABC9C',
  'Games': '#E74C3C',
  'Lifestyle': '#FF6B6B',
  'Education': '#5DADE2',
  'Shopping': '#FF9F43',
  'default': '#00CC6A'
};
```

---

## 📈 Avancement

| Phase | Status | Notes |
|-------|--------|-------|
| Phase 1 - Setup | 🔴 À faire | |
| Phase 2 - Services | 🔴 À faire | |
| Phase 3 - Logique | 🔴 À faire | |
| Phase 4 - Envoi | 🔴 À faire | |
| Phase 5 - API/CRON | 🔴 À faire | |
| Phase 6 - Deploy | 🔴 À faire | |

---

## 🔗 Liens Utiles

- [OpenAI API Reference](https://platform.openai.com/docs/api-reference)
- [Railway CRON Jobs](https://docs.railway.app/reference/cron-jobs)
- [Resend Documentation](https://resend.com/docs)
- [Supabase JS Client](https://supabase.com/docs/reference/javascript)

---

## 📊 Lien avec Sign-up API

Le **Sign-up API** (autre projet) envoie la dernière newsletter aux nouveaux inscrits.
Il lit depuis `newsletters` (ou `newsletters_v2`) pour récupérer le contenu.

```
Newsletter Generator → Sauvegarde dans newsletters_v2
                              ↓
Sign-up API ← Lit la dernière newsletter pour l'envoyer aux nouveaux
```

---

*Dernière mise à jour: 12 décembre 2024*

