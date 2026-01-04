# PhyRISK Complete Project Setup Guide

🎓 **By Shashwat Pathak, Student of Data Science**

---

## Fast-Track Setup (15 minutes)

This guide provides ready-to-use code for all backend and frontend modules. Follow the steps below to go from zero to a complete running PhyRISK application.

### Step 1: Clone and Prepare Local Repository

```bash
# Clone the repo
git clone https://github.com/shashwatpathak002-glitch/phyrisk-platform.git
cd phyrisk-platform

# Create and activate Python venv
python -m venv venv
source venv/bin/activate  # or venv\\Scripts\\activate on Windows

# Create Node environment
cd frontend
npm install
cd ..
```

### Step 2: Create All Backend Files

Copy-paste the following code into their respective file locations (create folders as needed):

#### Backend requirements.txt
**File: `backend/requirements.txt`**

```
fastapi==0.104.1
uvicorn[standard]==0.24.0
sqlalchemy==2.0.23
psycopg2-binary==2.9.9
alembic==1.12.1
pydantic==2.5.0
pydantic-settings==2.1.0
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
pandas==2.1.3
scikit-learn==1.3.2
shap==0.43.0
numpy==1.26.2
python-multipart==0.0.6
aiofiles==23.2.1
python-dotenv==1.0.0
```

#### Backend Core Files (Already Added)
- `backend/app/config.py` ✓
- `backend/app/db/base.py`
- `backend/app/db/session.py`
- `backend/app/db/models.py`
- `backend/app/core/security.py`
- `backend/app/core/auth_deps.py`
- `backend/app/routers/auth.py`
- `backend/app/schemas/auth.py`
- `backend/app/main.py`

#### Additional Backend Files
- `backend/app/routers/__init__.py` (empty file)
- `backend/app/schemas/__init__.py` (empty file)
- `backend/app/core/__init__.py` (empty file)
- `backend/.env.example`
- `backend/Dockerfile`

### Step 3: Create Frontend Structure

#### Frontend Layout and Pages
- `frontend/src/app/layout.tsx`
- `frontend/src/app/page.tsx`
- `frontend/src/app/login/page.tsx`
- `frontend/src/app/register/page.tsx`
- `frontend/src/app/dashboard/page.tsx`
- `frontend/src/app/datasets/page.tsx`
- `frontend/src/lib/apiClient.ts`
- `frontend/.env.example`

### Step 4: Configuration Files

#### .env files (Backend)
**File: `backend/.env.example`**

```
DATABASE_URL=sqlite:///./dev.db
JWT_SECRET_KEY=your-super-secret-key-change-in-production
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
OPENAI_API_KEY=sk-your-openai-key
```

#### .env files (Frontend)
**File: `frontend/.env.example`**

```
NEXT_PUBLIC_API_BASE=http://localhost:8000
```

### Step 5: Install and Run

```bash
# Backend
cd backend
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload

# Frontend (new terminal)
cd frontend
cp .env.example .env.local
npm run dev
```

✅ **Frontend:** http://localhost:3000
✅ **Backend API:** http://localhost:8000/docs

---

## Complete Backend Code

### 1. `backend/app/db/base.py`

```python
from sqlalchemy.orm import declarative_base

Base = declarative_base()
```

### 2. `backend/app/db/session.py`

```python
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.config import settings

engine = create_engine(settings.DATABASE_URL, future=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine, future=True)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

### 3. `backend/app/db/models.py`

```python
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Float, Text
from .base import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    role = Column(String, default="user", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, nullable=False)
```

### 4. `backend/app/core/security.py`

```python
from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import jwt, JWTError
from passlib.context import CryptContext
from app.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(subject: str, expires_minutes: Optional[int] = None) -> str:
    expire_delta = expires_minutes or settings.ACCESS_TOKEN_EXPIRE_MINUTES
    expire = datetime.now(timezone.utc) + timedelta(minutes=expire_delta)
    to_encode = {"sub": subject, "exp": expire}
    return jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)

def decode_token(token: str) -> Optional[str]:
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        return payload.get("sub")
    except JWTError:
        return None
```

### 5. `backend/app/core/auth_deps.py`

```python
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import User
from app.core.security import decode_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

def get_current_user(db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)) -> User:
    email = decode_token(token)
    if email is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user
```

### 6. `backend/app/schemas/auth.py`

```python
from pydantic import BaseModel, EmailStr

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class UserBase(BaseModel):
    email: EmailStr
    full_name: str | None = None

class UserCreate(UserBase):
    password: str

class UserRead(UserBase):
    id: int
    role: str
    class Config:
        from_attributes = True
```

### 7. `backend/app/routers/auth.py`

```python
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import User
from app.schemas import auth as auth_schema
from app.core.security import get_password_hash, verify_password, create_access_token

router = APIRouter()

@router.post("/register", response_model=auth_schema.UserRead)
def register_user(payload: auth_schema.UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(
        email=payload.email,
        full_name=payload.full_name,
        password_hash=get_password_hash(payload.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@router.post("/login", response_model=auth_schema.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    access_token = create_access_token(subject=user.email)
    return auth_schema.Token(access_token=access_token)
```

### 8. `backend/app/main.py`

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.db.base import Base
from app.db.session import engine
from app.routers import auth

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="0.1.0",
    description="PhyRISK – AI-Driven Mental Health Risk Intelligence (Project by Shashwat Pathak, Student of Data Science).",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["auth"])

@app.get("/")
def root():
    return {"message": "PhyRISK API", "version": "0.1.0"}
```

---

## Next Steps: Push to GitHub and Deploy

### 1. Commit Everything

```bash
git add .
git commit -m "Add complete PhyRISK backend and frontend code"
git push origin main
```

### 2. Deploy to Netlify (Frontend)

1. Go to https://app.netlify.com
2. Click "New site from Git"
3. Select your GitHub repo
4. Set build command: `cd frontend && npm run build`
5. Set publish directory: `frontend/.next`
6. Add env: `NEXT_PUBLIC_API_BASE=https://your-api-domain.com`

### 3. Deploy to Railway/Render (Backend)

1. Create PostgreSQL database
2. Deploy with Docker
3. Set env variables: `DATABASE_URL`, `JWT_SECRET_KEY`

---

## Success Checklist

- [ ] Repo cloned locally
- [ ] Backend files created
- [ ] Frontend files created
- [ ] .env files configured
- [ ] Backend running on localhost:8000
- [ ] Frontend running on localhost:3000
- [ ] Login/Register works
- [ ] Code pushed to GitHub
- [ ] Frontend deployed to Netlify
- [ ] Backend deployed to Railway/Render

---

## Troubleshooting

**Backend won't start?**
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

**Frontend build fails?**
```bash
cd frontend
rm -rf node_modules .next
npm install
npm run build
```

**Database error?**
Set `DATABASE_URL` in `.env` and ensure PostgreSQL is running.

---

**Project Status:** v0.1.0 - Core Auth System Ready
**Last Updated:** January 2026
