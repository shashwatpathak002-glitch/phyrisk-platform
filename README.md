# PhyRISK – AI-Driven Mental Health Risk Intelligence

**A privacy-first SaaS platform for mental health risk prediction, explainability, and AI-powered insights.**

🎓 **Project by:** Shashwat Pathak, Student of Data Science

---

## Overview

PhyRISK is a full-stack web application that:
- **Predicts** mental health risk levels (Low/Medium/High) using machine learning
- **Explains** predictions with SHAP explainable AI for transparency
- **Tracks** risk over time with secure data versioning and history
- **Assists** users with ChatGPT-powered conversational support
- **Maintains** privacy, ethics, and WCAG accessibility standards

**Not a medical diagnosis tool** – PhyRISK is a supportive analytics platform for personal insights and well-being tracking.

---

## Tech Stack

| Component | Technology |
|-----------|------------|
| **Frontend** | Next.js 14 + React + TypeScript + Tailwind CSS |
| **Backend** | FastAPI + SQLAlchemy + PostgreSQL |
| **ML/XAI** | Pandas, Scikit-learn, SHAP, OpenAI API |
| **Auth** | JWT + bcrypt password hashing |
| **Deployment** | Netlify (frontend), Railway/Render (backend) |
| **Version Control** | Git + GitHub |

---

## Project Structure

```
phyrisk-platform/
├── backend/
│   ├── app/
│   │   ├── main.py                 # FastAPI app entry
│   │   ├── config.py               # Settings (Pydantic)
│   │   ├── db/
│   │   │   ├── base.py
│   │   │   ├── session.py
│   │   │   └── models.py           # SQLAlchemy ORM
│   │   ├── core/
│   │   │   ├── security.py         # JWT + password hashing
│   │   │   └── auth_deps.py        # Auth dependency
│   │   ├── schemas/                # Pydantic request/response
│   │   ├── routers/                # API endpoints
│   │   ├── ml/
│   │   │   ├── training/           # Model training scripts
│   │   │   └── models/             # Saved models (.pkl)
│   │   └── xai/                    # SHAP explainer
│   ├── requirements.txt
│   └── Dockerfile
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx          # Root layout + sidebar
│   │   │   ├── page.tsx            # Landing page
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   ├── dashboard/
│   │   │   ├── datasets/
│   │   │   ├── risk-center/
│   │   │   ├── explain/
│   │   │   ├── ai-assistant/
│   │   │   ├── history/
│   │   │   ├── admin/
│   │   │   └── profile/
│   │   ├── components/             # Reusable UI components
│   │   ├── lib/                    # API client, auth helpers
│   │   └── styles/
│   ├── package.json
│   ├── next.config.mjs
│   └── Dockerfile
│
├── infra/
│   ├── docker-compose.yml          # Local dev stack
│   ├── nginx.conf                  # Reverse proxy
│   └── migrations/                 # Alembic migrations
│
├── netlify.toml                    # Netlify build config
├── docker-compose.yml
├── .gitignore
└── README.md (this file)
```

---

## Quick Start (Local Development)

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL 14+ (or use SQLite for dev)
- Git

### 1. Clone Repository

```bash
git clone https://github.com/shashwatpathak002-glitch/phyrisk-platform.git
cd phyrisk-platform
```

### 2. Backend Setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # or .venv\Scripts\activate on Windows

pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env: set DATABASE_URL, JWT_SECRET_KEY

# Run migrations
alembic upgrade head

# Start server
uvicorn app.main:app --reload
```

API docs: `http://localhost:8000/docs`

### 3. Frontend Setup

```bash
cd frontend
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local: set NEXT_PUBLIC_API_BASE=http://localhost:8000

npm run dev
```

UI: `http://localhost:3000`

---

## Key Features

### 🔐 Authentication
- User registration & login with JWT
- Secure password hashing (bcrypt)
- Logout from all devices
- Rate limiting on auth endpoints

### 📊 Dataset Management
- Upload CSV/Excel datasets
- Auto-detect schema and data quality
- Version control (v1, v2, v3…)
- Compare datasets before/after

### 🧠 Risk Prediction
- Logistic Regression, Random Forest, XGBoost models
- Metrics: Accuracy, Precision, Recall, F1, ROC-AUC
- Per-user risk classification (Low/Medium/High)
- Uncertainty quantification

### 🔍 Explainable AI (SHAP)
- Global feature importance
- Local SHAP explanations per prediction
- Human-readable feature contribution
- Bias & fairness evaluation

### 🤖 AI Assistant (ChatGPT)
- Context-aware conversational support
- Explains predictions in simple language
- Suggests preventive actions
- Session history & memory

### 📈 Dashboard
- Real-time risk summaries
- Trend charts & anomaly detection
- Alert system for sudden risk spikes
- Export reports (PDF/CSV)

---

## API Endpoints (FastAPI)

### Auth
- `POST /auth/register` – Create account
- `POST /auth/login` – JWT login
- `POST /auth/logout-all` – Revoke all sessions
- `GET /auth/me` – Current user profile

### Datasets
- `GET /datasets` – List user datasets
- `POST /datasets` – Create dataset
- `POST /datasets/{id}/upload` – Upload CSV/Excel
- `GET /datasets/{id}/versions` – Dataset history

### Risk
- `POST /risk/predict/{version_id}` – Run prediction
- `GET /risk/summary/{version_id}` – Aggregate stats

### XAI
- `GET /xai/global/{prediction_id}` – Feature importance
- `GET /xai/local/{record_id}` – SHAP explanation

### Chat
- `POST /chat/start` – Create chat session
- `POST /chat/{chat_id}/message` – Send message

---

## Deployment

### Frontend → Netlify

1. Push code to GitHub
2. Connect repo to Netlify
3. Build command: `cd frontend && npm install && npm run build`
4. Publish directory: `frontend/.next`
5. Set env: `NEXT_PUBLIC_API_BASE=https://your-api.com`

### Backend → Railway / Render

1. Create Postgres instance
2. Deploy FastAPI with Docker
3. Set environment variables:
   - `DATABASE_URL`
   - `JWT_SECRET_KEY`
   - `OPENAI_API_KEY` (for AI assistant)
4. Run Alembic migrations

---

## Security & Privacy

✅ **Implemented:**
- JWT authentication with expiration
- bcrypt password hashing
- Per-user data isolation
- Encrypted sensitive columns (optional)
- Audit logs for compliance
- GDPR-style data deletion
- Rate limiting
- CORS configuration

⚠️ **Ethical Guidelines:**
- No medical diagnosis claims
- Clear consent & disclaimers
- No sensitive PII in logs
- Regular bias & fairness audits

---

## Development Roadmap

- [x] Auth system (register/login/JWT)
- [x] Database models & session management
- [ x Dataset upload & preprocessing
- [ x ML model training pipeline
- [ x SHAP explainability module
- [ x ChatGPT integration
- [ x Frontend dashboard pages
- [ x Deployment configuration
- [ x Admin analytics panel
- [ x Mobile responsiveness

---

## Contributing

PhyRISK is a student portfolio project. Contributions, suggestions, and feedback are welcome!

1. Fork the repo
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit: `git commit -m "Add your feature"`
4. Push: `git push origin feature/your-feature`
5. Open a Pull Request

---

## License

MIT License – feel free to use for educational and commercial purposes.

---

## Contact & Social

👤 **Shashwat Pathak**
- GitHub: [@shashwatpathak002-glitch](https://github.com/shashwatpathak002-glitch)
- LinkedIn: [shashwat-pathak-6b8ab3337](https://linkedin.com/in/shashwat-pathak-6b8ab3337)
- University: Banaras Hindu University (BHU), Data Science Program

---

## Disclaimer

**PhyRISK is NOT a medical device or clinical tool.** It is an educational AI project for demonstration purposes. For mental health concerns, please consult qualified healthcare professionals.

---

**Last Updated:** January 2026
**Version:** 0.1.0
