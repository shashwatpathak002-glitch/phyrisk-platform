# Deployment Configuration - PhyRISK Platform

## Overview
Production-ready deployment configuration for PhyRISK using Netlify (frontend) and cloud services (backend).

## Frontend Deployment (Netlify)

### netlify.toml Configuration

```toml
[build]
  command = "npm run build"
  publish = "dist"

[build.environment]
  VITE_API_URL = "https://api.phyrisk.com"
  VITE_OPENAI_API_KEY = "sk-*"
  NODE_VERSION = "18.17.0"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/*"
  [headers.values]
    X-Content-Type-Options = "nosniff"
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    Strict-Transport-Security = "max-age=31536000"
    Content-Security-Policy = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'"

[[headers]]
  for = "/api/*"
  [headers.values]
    Access-Control-Allow-Origin = "*"
    Access-Control-Allow-Methods = "GET, POST, PUT, DELETE, OPTIONS"
```

### GitHub Actions Workflow (`.github/workflows/deploy.yml`)

```yaml
name: Deploy to Netlify

on:
  push:
    branches:
      - main
  pull_request:
    branches:
      - main

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18.17.0'
          cache: 'npm'
      
      - name: Install dependencies
        working-directory: ./frontend
        run: npm install
      
      - name: Run tests
        working-directory: ./frontend
        run: npm test -- --coverage
      
      - name: Build
        working-directory: ./frontend
        run: npm run build
      
      - name: Deploy to Netlify
        uses: nwtgck/actions-netlify@v2.0
        with:
          publish-dir: './frontend/dist'
          production-branch: main
          github-token: ${{ secrets.GITHUB_TOKEN }}
          deploy-message: 'Production deploy from GitHub Actions'
          enable-pull-request-comment: true
          enable-commit-comment: true
          overwrites-pull-request-comment: true
        env:
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
        timeout-minutes: 1
```

## Backend Deployment

### Docker Configuration (`Dockerfile`)

```dockerfile
FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Docker Compose (`docker-compose.yml`)

```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: phyrisk
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: phyrisk_db
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  backend:
    build: ./backend
    environment:
      DATABASE_URL: postgresql://phyrisk:${DB_PASSWORD}@postgres:5432/phyrisk_db
      OPENAI_API_KEY: ${OPENAI_API_KEY}
      JWT_SECRET: ${JWT_SECRET}
      ENVIRONMENT: production
    depends_on:
      - postgres
    ports:
      - "8000:8000"
    volumes:
      - ./backend:/app

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  postgres_data:
```

### Environment Variables (.env.example)

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/phyrisk_db
DB_PASSWORD=secure_password_here

# API Keys
OPENAI_API_KEY=sk-your-key-here
JWT_SECRET=your-jwt-secret-key
JWT_EXPIRATION_HOURS=24

# Server
ENVIRONMENT=production
API_HOST=api.phyrisk.com
FRONTEND_URL=https://phyrisk.com

# Security
CORS_ORIGINS=https://phyrisk.com,https://www.phyrisk.com
ALLOWED_HOSTS=phyrisk.com,www.phyrisk.com,api.phyrisk.com

# Email
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=app-password

# Redis
REDIS_URL=redis://localhost:6379/0

# Logging
LOG_LEVEL=INFO
LOG_FILE=/var/log/phyrisk/app.log
```

## AWS Deployment (Alternative)

### CloudFormation Template

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'PhyRISK Platform Infrastructure'

Resources:
  ECRRepository:
    Type: AWS::ECR::Repository
    Properties:
      RepositoryName: phyrisk-backend
      ImageScanningConfiguration:
        ScanOnPush: true

  ECSCluster:
    Type: AWS::ECS::Cluster
    Properties:
      ClusterName: phyrisk-cluster

  ECSTaskDefinition:
    Type: AWS::ECS::TaskDefinition
    Properties:
      Family: phyrisk-backend
      NetworkMode: awsvpc
      RequiresCompatibilities:
        - FARGATE
      Cpu: '1024'
      Memory: '2048'
      ContainerDefinitions:
        - Name: phyrisk-backend
          Image: !Sub '${AWS::AccountId}.dkr.ecr.${AWS::Region}.amazonaws.com/phyrisk-backend:latest'
          PortMappings:
            - ContainerPort: 8000
          Environment:
            - Name: ENVIRONMENT
              Value: production
          LogConfiguration:
            LogDriver: awslogs
            Options:
              awslogs-group: !Ref LogGroup
              awslogs-region: !Ref AWS::Region

  RDSDatabase:
    Type: AWS::RDS::DBInstance
    Properties:
      DBInstanceIdentifier: phyrisk-db
      Engine: postgres
      EngineVersion: '15.2'
      DBInstanceClass: db.t3.micro
      AllocatedStorage: '20'
      StorageType: gp3
      MasterUsername: phyrisk
      MasterUserPassword: !Sub '{{resolve:secretsmanager:phyrisk-db-password:SecretString:password}}'
      DBName: phyrisk_db
      MultiAZ: true
      StorageEncrypted: true
```

## Deployment Steps

### 1. Frontend Deployment (Netlify)
```bash
# Connect GitHub repo to Netlify
# Set environment variables in Netlify UI
# Push to main branch to trigger deployment
git add .
git commit -m "Deploy to production"
git push origin main
```

### 2. Backend Deployment (Docker)
```bash
# Build Docker image
docker build -t phyrisk-backend:latest .

# Tag image
docker tag phyrisk-backend:latest phyrisk/phyrisk-backend:latest

# Push to registry
docker push phyrisk/phyrisk-backend:latest

# Deploy with Docker Compose
docker-compose -f docker-compose.yml up -d
```

### 3. Database Migrations
```bash
# Run Alembic migrations
alembic upgrade head
```

## Monitoring & Logging

### Application Monitoring
```python
# backend/app/config/monitoring.py
from prometheus_client import Counter, Histogram
import logging

request_count = Counter('phyrisk_requests_total', 'Total requests')
request_duration = Histogram('phyrisk_request_duration_seconds', 'Request duration')

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)
```

### Health Check Endpoint
```python
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "database": check_database_connection(),
        "redis": check_redis_connection()
    }
```

## Security Considerations
- All secrets stored in environment variables
- HTTPS enforced on production
- Database encryption enabled
- Regular security audits
- WAF rules configured
- DDoS protection enabled
- Automated backups scheduled
- SSL/TLS certificates from Let's Encrypt

## Performance Optimization
- CDN enabled for static assets
- Database query optimization
- Redis caching layer
- Gzip compression enabled
- Image optimization
- Lazy loading for components
- Code splitting and tree shaking

## Continuous Integration
- Automated tests on every push
- Code coverage reports
- Linting and formatting checks
- Security scanning
- Performance benchmarks
- Deployment notifications
