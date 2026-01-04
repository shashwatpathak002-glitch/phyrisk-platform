import { useState } from 'react'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="app">
      <header className="app-header">
        <h1>🦛 PhyRISK</h1>
        <p>AI-Driven Mental Health Risk Intelligence Platform</p>
      </header>
      
      <main className="app-main">
        <section className="hero">
          <h2>Welcome to PhyRISK</h2>
          <p>A privacy-first SaaS solution for mental health risk prediction, explainability, and AI-powered insights.</p>
        </section>

        <section className="features">
          <div className="feature-card">
            <h3>🔐 Secure Authentication</h3>
            <p>JWT-based authentication for secure user access</p>
          </div>
          <div className="feature-card">
            <h3>📊 Dataset Management</h3>
            <p>Upload and manage health datasets with ease</p>
          </div>
          <div className="feature-card">
            <h3>🧠 Risk Prediction</h3>
            <p>ML-powered mental health risk analysis</p>
          </div>
          <div className="feature-card">
            <h3>🔍 Explainability</h3>
            <p>SHAP-based model interpretability</p>
          </div>
          <div className="feature-card">
            <h3>🤖 AI Assistant</h3>
            <p>ChatGPT-powered insights and recommendations</p>
          </div>
          <div className="feature-card">
            <h3>📈 Dashboard</h3>
            <p>Real-time analytics and insights</p>
          </div>
        </section>

        <section className="tech-stack">
          <h2>Tech Stack</h2>
          <div className="badges-container">
            <span className="badge">React</span>
            <span className="badge">Vite</span>
            <span className="badge">FastAPI</span>
            <span className="badge">Python</span>
            <span className="badge">TensorFlow</span>
            <span className="badge">SHAP</span>
            <span className="badge">PostgreSQL</span>
          </div>
        </section>
      </main>

      <footer className="app-footer">
        <p>&copy; 2024 PhyRISK. All rights reserved.</p>
        <p>Built with ❤️ by Shashwat Pathak</p>
      </footer>
    </div>
  )
}

export default App
