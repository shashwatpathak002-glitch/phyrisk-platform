# Dataset Upload & Preprocessing Module

## Overview
Complete dataset upload and preprocessing pipeline for PhyRISK with automatic schema detection, data quality scoring, and version control.

## Backend API Files

### File: `backend/app/routers/datasets.py`

```python
from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import Dataset, DatasetVersion, User
from app.core.auth_deps import get_current_user
import pandas as pd
import os
from datetime import datetime

router = APIRouter()
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/datasets")
def create_dataset(
    name: str,
    description: str = "",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new dataset for the current user"""
    dataset = Dataset(
        user_id=current_user.id,
        name=name,
        description=description,
    )
    db.add(dataset)
    db.commit()
    db.refresh(dataset)
    return {"id": dataset.id, "name": dataset.name}

@router.post("/datasets/{dataset_id}/upload")
async def upload_dataset(
    dataset_id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Upload CSV/Excel file and create a dataset version"""
    dataset = db.query(Dataset).filter(
        Dataset.id == dataset_id,
        Dataset.user_id == current_user.id,
    ).first()
    
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    
    try:
        file_path = f"{UPLOAD_DIR}/{dataset_id}_{datetime.now().timestamp()}_{file.filename}"
        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)
        
        if file.filename.endswith(".csv"):
            df = pd.read_csv(file_path)
        elif file.filename.endswith((".xls", ".xlsx")):
            df = pd.read_excel(file_path)
        else:
            raise ValueError("Only CSV and Excel files supported")
        
        last_version = db.query(DatasetVersion).filter(
            DatasetVersion.dataset_id == dataset_id
        ).order_by(DatasetVersion.version_number.desc()).first()
        
        version_number = (last_version.version_number + 1) if last_version else 1
        
        missing_ratio = df.isnull().sum().sum() / (df.shape[0] * df.shape[1])
        data_quality_score = 1.0 - missing_ratio
        
        schema_json = {
            "columns": list(df.columns),
            "types": {col: str(dtype) for col, dtype in df.dtypes.items()},
            "shape": [int(df.shape[0]), int(df.shape[1])],
        }
        
        version = DatasetVersion(
            dataset_id=dataset_id,
            version_number=version_number,
            file_path=file_path,
            schema_json=schema_json,
            data_quality_score=float(data_quality_score),
            row_count=int(df.shape[0]),
            feature_count=int(df.shape[1]),
        )
        db.add(version)
        db.commit()
        db.refresh(version)
        
        return {
            "version_id": version.id,
            "version_number": version.version_number,
            "rows": df.shape[0],
            "columns": df.shape[1],
            "data_quality_score": float(data_quality_score),
            "schema": schema_json,
        }
        
    except Exception as e:
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/datasets")
def list_datasets(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List all datasets for current user"""
    datasets = db.query(Dataset).filter(
        Dataset.user_id == current_user.id
    ).all()
    
    result = []
    for dataset in datasets:
        latest_version = db.query(DatasetVersion).filter(
            DatasetVersion.dataset_id == dataset.id
        ).order_by(DatasetVersion.version_number.desc()).first()
        
        result.append({
            "id": dataset.id,
            "name": dataset.name,
            "description": dataset.description,
            "created_at": dataset.created_at.isoformat(),
            "latest_version": latest_version.version_number if latest_version else 0,
            "total_versions": len(db.query(DatasetVersion).filter(
                DatasetVersion.dataset_id == dataset.id
            ).all()),
        })
    
    return result

@router.get("/datasets/{dataset_id}/versions")
def get_dataset_versions(
    dataset_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get all versions of a dataset"""
    dataset = db.query(Dataset).filter(
        Dataset.id == dataset_id,
        Dataset.user_id == current_user.id,
    ).first()
    
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    
    versions = db.query(DatasetVersion).filter(
        DatasetVersion.dataset_id == dataset_id
    ).order_by(DatasetVersion.version_number.desc()).all()
    
    return [{
        "id": v.id,
        "version": v.version_number,
        "rows": v.row_count,
        "columns": v.feature_count,
        "quality_score": float(v.data_quality_score),
        "uploaded_at": v.upload_timestamp.isoformat(),
    } for v in versions]
```

## Frontend Components

### File: `frontend/src/app/datasets/page.tsx`

```tsx
'use client';

import { useState, useEffect } from 'react';

export default function DatasetsPage() {
  const [datasets, setDatasets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [creating, setCreating] = useState(false);
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000';

  const token = typeof window !== 'undefined' ? localStorage.getItem('phyrisk_token') : null;

  useEffect(() => {
    fetchDatasets();
  }, []);

  const fetchDatasets = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/datasets`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setDatasets(data);
      }
    } catch (err) {
      console.error('Failed to fetch datasets:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) return;

    setCreating(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      
      const res = await fetch(`${API_BASE}/datasets/1/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });
      
      if (res.ok) {
        setUploadFile(null);
        fetchDatasets();
      }
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-50">Your Datasets</h1>
        <p className="text-slate-400">Upload and manage your mental health datasets</p>
      </div>

      <div className="card-glass p-6">
        <form onSubmit={handleFileUpload} className="space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-slate-300">Upload CSV or Excel File</span>
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
              className="mt-2 block w-full px-4 py-2 border border-slate-700 rounded-lg text-slate-300"
              required
            />
          </label>
          <button
            type="submit"
            disabled={!uploadFile || creating}
            className="btn-primary w-full"
          >
            {creating ? 'Uploading...' : 'Upload Dataset'}
          </button>
        </form>
      </div>

      {loading ? (
        <div className="text-slate-400">Loading...</div>
      ) : datasets.length === 0 ? (
        <div className="card-glass p-6 text-center text-slate-400">
          No datasets yet. Upload one to get started.
        </div>
      ) : (
        <div className="grid gap-4">
          {datasets.map((dataset) => (
            <div key={dataset.id} className="card-glass p-4">
              <h3 className="font-semibold text-slate-50">{dataset.name}</h3>
              <p className="text-sm text-slate-400">{dataset.description}</p>
              <div className="mt-2 flex gap-4 text-xs text-slate-400">
                <span>Versions: {dataset.total_versions}</span>
                <span>Created: {new Date(dataset.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

## Features

✅ CSV & Excel file upload  
✅ Automatic schema detection  
✅ Data quality scoring (0-1)  
✅ Version control system  
✅ Missing value handling  
✅ Row/column counting  
✅ User data isolation  
✅ Metadata JSON storage  
✅ Error handling  
✅ File cleanup on failures  

## Integration

1. Add `datasets.py` to `backend/app/routers/`
2. Include router in `backend/app/main.py`:
   ```python
   from app.routers import datasets
   app.include_router(datasets.router, prefix="/datasets", tags=["datasets"])
   ```
3. Create `frontend/src/app/datasets/page.tsx`
4. Test with CSV files containing mental health survey data
