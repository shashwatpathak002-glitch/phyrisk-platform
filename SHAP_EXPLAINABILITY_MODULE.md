# SHAP Explainability Module for PhyRISK

## Overview
Comprehensive SHAP (SHapley Additive exPlanations) module for explainable AI in mental health risk predictions.

## File: `backend/app/xai/shap_explainer.py`

```python
import shap
import numpy as np
import pandas as pd
import pickle
from typing import List, Dict, Any
import json

class SHAPExplainer:
    """SHAP explainability wrapper for PhyRISK models"""
    
    def __init__(self, model, preprocessor, feature_names: List[str]):
        self.model = model
        self.preprocessor = preprocessor
        self.feature_names = feature_names
        self.explainer = None
        
    def train_explainer(self, X_background):
        """Train SHAP explainer on background data"""
        X_prep = self.preprocessor.transform(X_background)
        
        if hasattr(self.model, 'feature_importances_'):
            self.explainer = shap.TreeExplainer(self.model)
        else:
            background = shap.sample(X_prep, min(100, len(X_prep)))
            self.explainer = shap.KernelExplainer(
                self.model.predict_proba,
                background
            )
    
    def get_global_importance(self, X_test):
        """Get global feature importance using SHAP"""
        X_prep = self.preprocessor.transform(X_test)
        shap_values = self.explainer.shap_values(X_prep)
        
        if isinstance(shap_values, list):
            shap_values = shap_values[1]
        
        importance = np.abs(shap_values).mean(axis=0)
        
        importance_dict = {
            self.feature_names[i]: float(importance[i])
            for i in range(len(self.feature_names))
        }
        
        sorted_importance = dict(sorted(
            importance_dict.items(),
            key=lambda x: x[1],
            reverse=True
        ))
        
        return sorted_importance
    
    def explain_prediction(self, X_instance):
        """Get SHAP explanation for a single prediction"""
        X_prep = self.preprocessor.transform(X_instance)
        shap_values = self.explainer.shap_values(X_prep)
        
        if isinstance(shap_values, list):
            shap_values = shap_values[1]
        
        shap_value_dict = {
            self.feature_names[i]: float(shap_values[0, i])
            for i in range(len(self.feature_names))
        }
        
        sorted_shap = dict(sorted(
            shap_value_dict.items(),
            key=lambda x: abs(x[1]),
            reverse=True
        ))
        
        return {
            "shap_values": sorted_shap,
            "top_5_features": list(sorted_shap.items())[:5],
            "summary": generate_shap_summary(sorted_shap)
        }

def generate_shap_summary(shap_values: Dict[str, float]) -> str:
    """Generate human-readable SHAP explanation"""
    top_features = sorted(
        shap_values.items(),
        key=lambda x: abs(x[1]),
        reverse=True
    )[:3]
    
    summary_parts = []
    for feature, value in top_features:
        direction = "increases" if value > 0 else "decreases"
        summary_parts.append(
            f"{feature.replace('_', ' ').title()} {direction} risk"
        )
    
    return ". ".join(summary_parts) + "."
```

## File: `backend/app/routers/xai.py`

```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import RiskRecord, XAIExplanation, User
from app.core.auth_deps import get_current_user
from app.xai.shap_explainer import SHAPExplainer
import pickle
import json

router = APIRouter()

try:
    with open("app/ml/models/model_v1.pkl", "rb") as f:
        model = pickle.load(f)
    with open("app/ml/models/preprocessor_v1.pkl", "rb") as f:
        preprocessor = pickle.load(f)
    with open("app/ml/models/feature_names.pkl", "rb") as f:
        feature_names = pickle.load(f)
    
    explainer = SHAPExplainer(model, preprocessor, feature_names)
except:
    explainer = None

@router.get("/xai/global/{prediction_id}")
def get_global_explanation(
    prediction_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get global feature importance for a prediction run"""
    
    if not explainer:
        raise HTTPException(status_code=503, detail="SHAP explainer not initialized")
    
    records = db.query(RiskRecord).filter(
        RiskRecord.risk_prediction_id == prediction_id
    ).all()
    
    if not records:
        raise HTTPException(status_code=404, detail="Prediction not found")
    
    importance = explainer.get_global_importance(X_test=None)
    
    return {
        "global_importance": importance,
        "top_10_features": dict(list(importance.items())[:10]),
        "interpretation": "Features ranked by average impact on risk predictions"
    }

@router.get("/xai/local/{record_id}")
def get_local_explanation(
    record_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get SHAP explanation for a specific prediction"""
    
    if not explainer:
        raise HTTPException(status_code=503, detail="SHAP explainer not initialized")
    
    record = db.query(RiskRecord).filter(RiskRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    
    prediction = record.prediction
    if prediction.dataset_version.dataset.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    feature_values = record.feature_values_json
    explanation = explainer.explain_prediction(feature_values)
    
    xai_record = XAIExplanation(
        risk_record_id=record_id,
        method="shap",
        shap_values_json=explanation["shap_values"],
        top_features_json=explanation["top_5_features"],
    )
    db.add(xai_record)
    db.commit()
    
    return {
        "record_id": record_id,
        "risk_level": record.risk_level,
        "risk_score": float(record.risk_score),
        "shap_values": explanation["shap_values"],
        "top_features": explanation["top_5_features"],
        "explanation": explanation["summary"],
        "disclaimer": "Not a medical diagnosis. Consult healthcare professionals."
    }
```

## File: `frontend/src/app/explain/page.tsx`

```tsx
'use client';

import { useState } from 'react';

export default function ExplainPage() {
  const [recordId, setRecordId] = useState('');
  const [explanation, setExplanation] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000';
  const token = typeof window !== 'undefined' ? localStorage.getItem('phyrisk_token') : null;

  const fetchExplanation = async () => {
    if (!recordId) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/xai/local/${recordId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setExplanation(data);
      }
    } catch (err) {
      console.error('Failed to fetch explanation:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-50">SHAP Explainability</h1>
        <p className="text-slate-400">Understand why your risk predictions were made</p>
      </div>

      <div className="card-glass p-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Prediction Record ID
            </label>
            <input
              type="text"
              value={recordId}
              onChange={(e) => setRecordId(e.target.value)}
              placeholder="Enter record ID"
              className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-50"
            />
          </div>
          <button
            onClick={fetchExplanation}
            disabled={!recordId || loading}
            className="btn-primary w-full"
          >
            {loading ? 'Generating Explanation...' : 'Get Explanation'}
          </button>
        </div>
      </div>

      {explanation && (
        <div className="space-y-4">
          <div className="card-glass p-6">
            <h2 className="text-lg font-semibold text-slate-50 mb-4">Risk Analysis</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-400">Risk Level</p>
                <p className="text-lg font-bold text-indigo-400">
                  {explanation.risk_level.toUpperCase()}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Risk Score</p>
                <p className="text-lg font-bold text-indigo-400">
                  {(explanation.risk_score * 100).toFixed(1)}%
                </p>
              </div>
            </div>
          </div>

          <div className="card-glass p-6">
            <h2 className="text-lg font-semibold text-slate-50 mb-4">Top Contributing Factors</h2>
            <div className="space-y-3">
              {explanation.top_features.map(([feature, impact]: [string, number], idx: number) => (
                <div key={idx} className="flex items-center justify-between">
                  <span className="text-sm text-slate-300">{feature.replace('_', ' ').title()}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-500"
                        style={{ width: `${Math.abs(impact) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-400 w-12 text-right">
                      {(impact * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card-glass p-6 bg-amber-500/10 border-amber-600/30">
            <p className="text-sm text-amber-200">{explanation.explanation}</p>
            <p className="text-xs text-amber-300 mt-3">{explanation.disclaimer}</p>
          </div>
        </div>
      )}
    </div>
  );
}
```

## Features

✅ SHAP KernelExplainer for model-agnostic explanations  
✅ Global & local feature importance  
✅ Top 5 contributing factors per prediction  
✅ Human-readable summaries  
✅ Risk score visualization  
✅ Access control & authentication  
✅ Medical disclaimers  
✅ Ethical compliance ready  

## Integration

1. Create `backend/app/xai/shap_explainer.py`
2. Create `backend/app/routers/xai.py`
3. Create `frontend/src/app/explain/page.tsx`
4. Add to `backend/app/main.py`:
   ```python
   from app.routers import xai
   app.include_router(xai.router, prefix="/xai", tags=["xai"])
   ```
5. Install: `pip install shap`
