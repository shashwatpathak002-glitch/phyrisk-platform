# 🚀 START HERE - PhyRISK Quick Launch Guide

**PhyRISK – AI-Driven Mental Health Risk Intelligence**  
Project by **Shashwat Pathak**, Student of Data Science

---

## ✅ What's Ready

Your GitHub repository **is now live** with:

✅ **Complete README** - Full project documentation  
✅ **Backend config.py** - Foundation for FastAPI app  
✅ **COMPLETE_PROJECT_SETUP.md** - All code templates ready to copy-paste  
✅ **.gitignore** - Python project exclusions  

---

## 🏑 Build It Locally (20 minutes)

### 1️⃣ Clone Your Repo

```bash
git clone https://github.com/shashwatpathak002-glitch/phyrisk-platform.git
cd phyrisk-platform
```

### 2️⃣ Read the Setup Guide

Open **`COMPLETE_PROJECT_SETUP.md`** in your editor.  
This file has **all the code you need** organized and ready to use.

### 3️⃣ Create Backend Structure

```bash
# Create folders
mkdir -p backend/app/{db,core,schemas,routers}
cd backend

# Create Python venv
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Copy requirements.txt from COMPLETE_PROJECT_SETUP.md
# Then install
pip install -r requirements.txt
```

### 4️⃣ Copy Code from COMPLETE_PROJECT_SETUP.md

For each file section in that document (base.py, session.py, etc.):
- Create the file in the right folder
- Copy-paste the code from the guide
- Save it

**Files to create:**
```
backend/
├── app/
│   ├── config.py ✅ (already exists)
│   ├── main.py
│   ├── db/
│   │   ├── base.py
│   │   ├── session.py
│   │   └── models.py
│   ├── core/
│   │   ├── security.py
│   │   ├── auth_deps.py
│   │   └── __init__.py
│   ├── routers/
│   │   ├── auth.py
│   │   └── __init__.py
│   └── schemas/
│       ├── auth.py
│       └── __init__.py
├── .env.example
└── requirements.txt
```

### 5️⃣ Run Backend

```bash
cp .env.example .env
uvicorn app.main:app --reload
```

✅ **Check:** Go to http://localhost:8000/docs

### 6️⃣ Create Frontend (Next.js)

```bash
# Go back to root
cd ..

# If you haven't created frontend yet
npx create-next-app@latest frontend --typescript --app --src-dir --tailwind

cd frontend
npm install
cp .env.example .env.local
```

### 7️⃣ Run Frontend

```bash
npm run dev
```

✅ **Check:** Go to http://localhost:3000

---

## 🚀 Push to GitHub

Once everything is working locally:

```bash
# From repo root
git add .
git commit -m "Add complete PhyRISK backend and frontend implementation"
git push origin main
```

---

## 🌐 Deploy (Optional Next Step)

### Deploy Frontend to Netlify

1. Go to https://app.netlify.com
2. Click "New site from Git"
3. Select your GitHub repo
4. **Build command:** `cd frontend && npm run build`
5. **Publish directory:** `frontend/.next`
6. **Environment variable:**
   - `NEXT_PUBLIC_API_BASE` = `http://localhost:8000` (for now)

### Deploy Backend to Railway/Render

1. Create free account on Railway.app or Render.com
2. Create PostgreSQL database
3. Deploy this repo with Docker
4. Set environment variables:
   - `DATABASE_URL` = your_postgres_url
   - `JWT_SECRET_KEY` = generate_a_strong_key

---

## 📚 Next Documentation

Read in this order:

1. **START_HERE.md** ← You are here
2. **README.md** ← Project overview
3. **COMPLETE_PROJECT_SETUP.md** ← All code templates

---

## ❓ Stuck?

**Q: Backend won't start?**
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

**Q: Port already in use?**
```bash
uvicorn app.main:app --reload --port 8001
```

**Q: Frontend build fails?**
```bash
cd frontend
rm -rf node_modules .next
npm install
npm run build
```

---

## 📊 Progress Checklist

- [ ] Cloned repo locally
- [ ] Created backend folder structure
- [ ] Installed Python dependencies
- [ ] Created all backend files (db, core, routers, schemas)
- [ ] Backend runs on localhost:8000
- [ ] Created frontend with Next.js
- [ ] Frontend runs on localhost:3000
- [ ] Can register/login via http://localhost:3000/register
- [ ] Pushed code back to GitHub
- [ ] Deployed frontend to Netlify
- [ ] Deployed backend to Railway/Render

---

## 🎯 Your GitHub Repo

**https://github.com/shashwatpathak002-glitch/phyrisk-platform**

---

## 🎓 About This Project

**PhyRISK** is a full-stack SaaS platform for mental health risk prediction with:
- Machine Learning risk classification (Low/Medium/High)
- Explainable AI using SHAP
- ChatGPT-powered insights
- Secure JWT authentication
- Dark-mode responsive UI
- Privacy-first design

**Status:** v0.1.0 - Core auth system ready  
**Built by:** Shashwat Pathak, BHU Data Science Student  
**Last Updated:** January 2026

---

**Ready to build? Open `COMPLETE_PROJECT_SETUP.md` and start copying code!** 🚀
