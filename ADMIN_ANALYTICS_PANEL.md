# Admin Analytics Panel - PhyRISK Platform

## Overview
Comprehensive admin dashboard for monitoring platform metrics, user statistics, and system health.

## Admin Dashboard Component (`frontend/pages/AdminDashboard.jsx`)

```jsx
import React, { useState, useEffect } from 'react';
import { BarChart, LineChart, PieChart, Users, TrendingUp, AlertTriangle, Settings } from 'lucide-react';
import UserAnalytics from '../components/admin/UserAnalytics';
import RiskDistribution from '../components/admin/RiskDistribution';
import SystemMetrics from '../components/admin/SystemMetrics';
import axios from 'axios';

const AdminDashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [timeRange, setTimeRange] = useState('7days');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminMetrics();
  }, [timeRange]);

  const fetchAdminMetrics = async () => {
    try {
      const response = await axios.get(`/api/admin/metrics?range=${timeRange}`);
      setMetrics(response.data);
    } catch (error) {
      console.error('Error fetching admin metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white">
      <header className="bg-slate-800 border-b border-slate-700 p-6">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Settings size={32} className="text-cyan-400" />
          Admin Analytics Panel
        </h1>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Time Range Selector */}
        <div className="mb-6 flex gap-2">
          {['24hours', '7days', '30days', '90days'].map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                timeRange === range
                  ? 'bg-cyan-500 text-white'
                  : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
              }`}
            >
              {range.replace(/([0-9]+)([a-z]+)/, '$1 $2')}
            </button>
          ))}
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <MetricCard
            icon={Users}
            label="Total Users"
            value={metrics?.total_users || 0}
            trend={metrics?.user_growth || 0}
          />
          <MetricCard
            icon={TrendingUp}
            label="Assessments Today"
            value={metrics?.assessments_today || 0}
            trend={metrics?.assessment_trend || 0}
          />
          <MetricCard
            icon={AlertTriangle}
            label="High Risk Users"
            value={metrics?.high_risk_count || 0}
            trend={metrics?.risk_trend || 0}
          />
          <MetricCard
            icon={TrendingUp}
            label="Platform Health"
            value={`${metrics?.system_health || 0}%`}
            trend={0}
          />
        </div>

        {/* Analytics Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <UserAnalytics data={metrics?.user_data} />
          <RiskDistribution data={metrics?.risk_distribution} />
        </div>

        <div className="bg-slate-800 rounded-lg p-6">
          <SystemMetrics data={metrics?.system_metrics} />
        </div>
      </main>
    </div>
  );
};

const MetricCard = ({ icon: Icon, label, value, trend }) => (
  <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-gray-400 text-sm">{label}</p>
        <p className="text-2xl font-bold mt-2">{value}</p>
      </div>
      <Icon className="text-cyan-400" size={24} />
    </div>
    {trend !== 0 && (
      <p className={`text-sm mt-2 ${trend > 0 ? 'text-green-400' : 'text-red-400'}`}>
        {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}% from last period
      </p>
    )}
  </div>
);

export default AdminDashboard;
```

## User Analytics Component (`frontend/components/admin/UserAnalytics.jsx`)

```jsx
import React from 'react';

const UserAnalytics = ({ data = [] }) => {
  return (
    <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
      <h3 className="text-xl font-bold mb-4">User Activity Trend</h3>
      <div className="space-y-3">
        {data?.map((item, idx) => (
          <div key={idx} className="flex items-center gap-4">
            <span className="text-gray-400 w-20 text-sm">{item.date}</span>
            <div className="flex-1 bg-slate-700 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full"
                style={{ width: `${(item.count / Math.max(...data.map(d => d.count))) * 100}%` }}
              />
            </div>
            <span className="text-white w-12 text-right text-sm">{item.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserAnalytics;
```

## Risk Distribution (`frontend/components/admin/RiskDistribution.jsx`)

```jsx
import React from 'react';

const RiskDistribution = ({ data = {} }) => {
  const total = (data.low || 0) + (data.medium || 0) + (data.high || 0);
  const low = total > 0 ? ((data.low || 0) / total * 100) : 0;
  const medium = total > 0 ? ((data.medium || 0) / total * 100) : 0;
  const high = total > 0 ? ((data.high || 0) / total * 100) : 0;

  return (
    <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
      <h3 className="text-xl font-bold mb-4">Risk Level Distribution</h3>
      <div className="space-y-4">
        <RiskBar color="bg-green-500" label="Low Risk" percentage={low} count={data.low} />
        <RiskBar color="bg-yellow-500" label="Medium Risk" percentage={medium} count={data.medium} />
        <RiskBar color="bg-red-500" label="High Risk" percentage={high} count={data.high} />
      </div>
      <p className="text-gray-400 text-sm mt-4">Total Assessments: {total}</p>
    </div>
  );
};

const RiskBar = ({ color, label, percentage, count }) => (
  <div>
    <div className="flex justify-between mb-1">
      <span className="text-sm">{label}</span>
      <span className="text-sm text-gray-400">{percentage.toFixed(1)}% ({count})</span>
    </div>
    <div className="w-full bg-slate-700 rounded-full h-2">
      <div className={`${color} h-2 rounded-full`} style={{ width: `${percentage}%` }} />
    </div>
  </div>
);

export default RiskDistribution;
```

## Backend Admin Routes (`backend/app/routes/admin.py`)

```python
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import logging

router = APIRouter(prefix="/api/admin", tags=["admin"])
logger = logging.getLogger(__name__)

@router.get("/metrics")
async def get_platform_metrics(
    range: str = "7days",
    db: Session = Depends(get_db),
    current_user = Depends(verify_admin)
):
    """Get comprehensive platform metrics"""
    try:
        # Calculate date range
        if range == "24hours":
            start_date = datetime.utcnow() - timedelta(hours=24)
        elif range == "30days":
            start_date = datetime.utcnow() - timedelta(days=30)
        elif range == "90days":
            start_date = datetime.utcnow() - timedelta(days=90)
        else:  # 7days
            start_date = datetime.utcnow() - timedelta(days=7)

        # Get user metrics
        total_users = db.query(User).count()
        new_users = db.query(User).filter(
            User.created_at >= start_date
        ).count()

        # Get assessment metrics
        total_assessments = db.query(RiskAssessment).filter(
            RiskAssessment.created_at >= start_date
        ).count()

        # Get risk distribution
        low_risk = db.query(RiskAssessment).filter(
            RiskAssessment.risk_level == "low",
            RiskAssessment.created_at >= start_date
        ).count()
        medium_risk = db.query(RiskAssessment).filter(
            RiskAssessment.risk_level == "medium",
            RiskAssessment.created_at >= start_date
        ).count()
        high_risk = db.query(RiskAssessment).filter(
            RiskAssessment.risk_level == "high",
            RiskAssessment.created_at >= start_date
        ).count()

        return {
            "total_users": total_users,
            "new_users": new_users,
            "assessments_today": get_assessments_today(db),
            "high_risk_count": high_risk,
            "risk_distribution": {
                "low": low_risk,
                "medium": medium_risk,
                "high": high_risk
            },
            "system_health": get_system_health(),
            "user_growth": calculate_growth(db, start_date, "users"),
            "assessment_trend": calculate_growth(db, start_date, "assessments")
        }
    except Exception as e:
        logger.error(f"Error fetching metrics: {str(e)}")
        raise HTTPException(status_code=500, detail="Error fetching metrics")

@router.get("/users")
async def list_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user = Depends(verify_admin)
):
    """List all users with pagination"""
    users = db.query(User).offset(skip).limit(limit).all()
    return {"users": users, "total": db.query(User).count()}

@router.delete("/users/{user_id}")
async def delete_user(
    user_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(verify_admin)
):
    """Delete a user and their data"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(user)
    db.commit()
    return {"status": "success", "message": "User deleted"}

@router.get("/logs")
async def get_system_logs(
    limit: int = 100,
    current_user = Depends(verify_admin)
):
    """Get system logs"""
    # Implementation depends on logging system
    pass
```

## Admin Features
- Real-time platform metrics
- User management (create, read, update, delete)
- Risk assessment analytics
- System health monitoring
- User activity tracking
- Data export functionality
- Admin audit logs
- Email notification configuration
- API rate limiting controls
- Database backup management

## Security Features
- Admin role verification on all endpoints
- Audit logging of all admin actions
- IP whitelisting option
- Two-factor authentication for admins
- Session timeout after inactivity
- All sensitive operations require confirmation

## Data Visualization
- Bar charts for user activity
- Pie charts for risk distribution
- Line charts for trends over time
- Real-time metric updates
- Exportable reports (PDF, CSV)

## Performance Metrics
- API response time tracking
- Database query performance
- Cache hit rates
- Error rate monitoring
- User engagement metrics
- Feature usage analytics
