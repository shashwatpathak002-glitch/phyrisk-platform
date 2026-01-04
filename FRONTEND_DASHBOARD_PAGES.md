# Frontend Dashboard Pages - PhyRISK Platform

## Overview
Comprehensive React-based dashboard with responsive UI components for mental health risk assessment visualization and user interaction.

## Main Dashboard Layout (`frontend/pages/Dashboard.jsx`)

```jsx
import React, { useState, useEffect } from 'react';
import { BarChart, LineChart, PieChart, AlertCircle, User, Settings, LogOut } from 'lucide-react';
import RiskAssessmentWidget from '../components/RiskAssessmentWidget';
import HealthMetricsCard from '../components/HealthMetricsCard';
import RecommendationsPanel from '../components/RecommendationsPanel';
import ChatInterface from '../components/ChatInterface';
import axios from 'axios';

const Dashboard = () => {
  const [userData, setUserData] = useState(null);
  const [riskData, setRiskData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [userRes, riskRes] = await Promise.all([
          axios.get('/api/users/me'),
          axios.get('/api/assessments/latest')
        ]);
        setUserData(userRes.data);
        setRiskData(riskRes.data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"></div>
            <h1 className="text-2xl font-bold">PhyRISK</h1>
          </div>
          <nav className="flex items-center gap-4">
            <button className="hover:text-cyan-400 transition-colors">Dashboard</button>
            <button className="hover:text-cyan-400 transition-colors">Reports</button>
            <button className="hover:text-cyan-400 transition-colors">Help</button>
            <div className="flex items-center gap-2 ml-4">
              <User size={20} />
              <span>{userData?.name}</span>
            </div>
            <button className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
              <Settings size={20} />
            </button>
            <button className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
              <LogOut size={20} />
            </button>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-slate-700">
          {['overview', 'history', 'insights', 'support'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 capitalize border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-cyan-500 text-cyan-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Risk Assessment Widget */}
            <div className="lg:col-span-1">
              <RiskAssessmentWidget riskData={riskData} />
            </div>

            {/* Health Metrics */}
            <div className="lg:col-span-2 grid grid-cols-2 gap-4">
              <HealthMetricsCard
                title="Stress Level"
                value={riskData?.stress_level || 0}
                unit="/10"
                icon={AlertCircle}
              />
              <HealthMetricsCard
                title="Sleep Quality"
                value={riskData?.sleep_quality || 0}
                unit="/10"
                icon={AlertCircle}
              />
              <HealthMetricsCard
                title="Activity"
                value={riskData?.activity_level || 0}
                unit="days/week"
                icon={AlertCircle}
              />
              <HealthMetricsCard
                title="Mood Trend"
                value={riskData?.mood_trend || "Stable"}
                icon={AlertCircle}
              />
            </div>

            {/* Recommendations */}
            <div className="lg:col-span-3">
              <RecommendationsPanel recommendations={riskData?.recommendations} />
            </div>
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="bg-slate-800 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">Assessment History</h2>
            <p className="text-gray-400">View your past assessments and track your progress over time.</p>
          </div>
        )}

        {/* Insights Tab */}
        {activeTab === 'insights' && (
          <div className="bg-slate-800 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">Health Insights</h2>
            <p className="text-gray-400">AI-powered insights based on your assessment patterns.</p>
          </div>
        )}

        {/* Support Tab */}
        {activeTab === 'support' && (
          <div className="bg-slate-800 rounded-lg p-6">
            <ChatInterface conversationId={userData?.id} riskLevel={riskData?.risk_level} />
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
```

## Risk Assessment Widget (`frontend/components/RiskAssessmentWidget.jsx`)

```jsx
import React from 'react';
import { AlertCircle, TrendingUp } from 'lucide-react';

const RiskAssessmentWidget = ({ riskData }) => {
  const getRiskColor = (level) => {
    switch(level) {
      case 'low': return { bg: 'bg-green-900', text: 'text-green-400', border: 'border-green-500' };
      case 'medium': return { bg: 'bg-yellow-900', text: 'text-yellow-400', border: 'border-yellow-500' };
      case 'high': return { bg: 'bg-red-900', text: 'text-red-400', border: 'border-red-500' };
      default: return { bg: 'bg-slate-700', text: 'text-gray-400', border: 'border-gray-500' };
    }
  };

  const colors = getRiskColor(riskData?.risk_level);

  return (
    <div className={`${colors.bg} border ${colors.border} rounded-lg p-6 text-center`}>
      <div className="flex justify-center mb-4">
        <AlertCircle className={`${colors.text}`} size={48} />
      </div>
      <h3 className="text-lg font-bold mb-2">Current Risk Level</h3>
      <p className={`text-3xl font-bold ${colors.text} mb-4`}>
        {riskData?.risk_level?.toUpperCase()}
      </p>
      <div className="space-y-2 text-sm text-gray-300">
        <p>Score: {riskData?.risk_score || 0}/100</p>
        <p>Last Updated: {new Date(riskData?.updated_at).toLocaleDateString()}</p>
      </div>
      <button className="w-full mt-4 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold py-2 rounded-lg transition-colors">
        Take New Assessment
      </button>
    </div>
  );
};

export default RiskAssessmentWidget;
```

## Health Metrics Card (`frontend/components/HealthMetricsCard.jsx`)

```jsx
import React from 'react';

const HealthMetricsCard = ({ title, value, unit, icon: Icon }) => {
  return (
    <div className="bg-slate-700 rounded-lg p-4 flex items-start gap-4">
      <div className="w-12 h-12 bg-slate-600 rounded-lg flex items-center justify-center">
        <Icon className="text-cyan-400" size={24} />
      </div>
      <div className="flex-1">
        <p className="text-gray-400 text-sm">{title}</p>
        <p className="text-2xl font-bold">
          {value}{unit && <span className="text-lg text-gray-400"> {unit}</span>}
        </p>
      </div>
    </div>
  );
};

export default HealthMetricsCard;
```

## Recommendations Panel (`frontend/components/RecommendationsPanel.jsx`)

```jsx
import React from 'react';
import { CheckCircle, AlertCircle, Heart } from 'lucide-react';

const RecommendationsPanel = ({ recommendations = [] }) => {
  return (
    <div className="bg-slate-800 rounded-lg p-6">
      <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
        <Heart className="text-red-500" size={24} />
        Personalized Recommendations
      </h3>
      <div className="space-y-3">
        {recommendations.length > 0 ? (
          recommendations.map((rec, idx) => (
            <div key={idx} className="flex gap-3 p-3 bg-slate-700 rounded-lg">
              <CheckCircle className="text-green-400 flex-shrink-0" size={20} />
              <div>
                <p className="font-semibold">{rec.title}</p>
                <p className="text-sm text-gray-400">{rec.description}</p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-400">No recommendations at this time.</p>
        )}
      </div>
    </div>
  );
};

export default RecommendationsPanel;
```

## Features
- Real-time risk level visualization
- Interactive health metrics dashboard
- Tab-based navigation system
- Responsive grid layout
- Dark theme with accent colors
- User profile integration
- Assessment history tracking
- Integrated AI chat support
- Personalized recommendations engine
- Mobile responsive design

## Styling
- Tailwind CSS with custom gradients
- Dark slate color scheme (#1e293b - #0f172a)
- Cyan accent colors (#06b6d4)
- Smooth transitions and animations
- Accessible color contrasts

## API Endpoints Used
- `GET /api/users/me` - Current user profile
- `GET /api/assessments/latest` - Latest risk assessment
- `GET /api/recommendations` - Personalized recommendations

## Responsive Breakpoints
- Mobile: < 768px (single column)
- Tablet: 768px - 1024px (2 columns)
- Desktop: > 1024px (3+ columns)
