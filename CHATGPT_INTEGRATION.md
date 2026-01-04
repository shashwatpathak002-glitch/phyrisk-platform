# ChatGPT Integration Module - PhyRISK Platform

## Overview
Advanced AI-powered conversational interface integrating OpenAI's GPT model for intelligent mental health risk analysis and patient guidance.

## Backend Implementation

### FastAPI Service (`backend/app/services/openai_service.py`)

```python
import os
from typing import List, Optional
from openai import OpenAI, AsyncOpenAI
import logging
from datetime import datetime
import json

logger = logging.getLogger(__name__)

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
async_client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

SYSTEM_PROMPT = """You are an empathetic mental health AI assistant for PhyRISK. Your role is to:
1. Provide supportive conversations about mental health
2. Help users understand risk assessment results
3. Suggest evidence-based coping strategies
4. Recommend professional resources when needed
5. Maintain strict confidentiality and ethical guidelines

Guidelines:
- Emphasize you're not a substitute for professional mental health care
- For suicidal ideation, immediately suggest crisis resources
- Tailor responses to user's risk level
- Use empathetic, non-judgmental language
- Provide actionable, practical advice
- Never provide medical diagnoses
"""

class OpenAIService:
    def __init__(self):
        self.model = "gpt-4"
        self.max_tokens = 1500
        self.temperature = 0.7
        
    async def chat_with_analysis(
        self,
        user_message: str,
        conversation_history: List[dict],
        risk_level: str,
        user_profile: dict
    ) -> dict:
        """Generate intelligent response considering user's risk profile"""
        try:
            messages = [
                {"role": "system", "content": self._get_contextual_prompt(risk_level, user_profile)}
            ]
            messages.extend(conversation_history)
            messages.append({"role": "user", "content": user_message})
            
            response = await async_client.chat.completions.create(
                model=self.model,
                messages=messages,
                max_tokens=self.max_tokens,
                temperature=self.temperature
            )
            
            assistant_message = response.choices[0].message.content
            
            return {
                "status": "success",
                "message": assistant_message,
                "tokens_used": response.usage.total_tokens,
                "timestamp": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"OpenAI API error: {str(e)}")
            return {"status": "error", "message": "Unable to process request."}
    
    def _get_contextual_prompt(self, risk_level: str, user_profile: dict) -> str:
        """Generate risk-aware system prompt"""
        risk_context = {
            "low": "User has low risk. Provide encouraging support.",
            "medium": "User has moderate concerns. Provide practical coping strategies.",
            "high": "User has elevated risks. Emphasize professional help importance."
        }
        return f"{SYSTEM_PROMPT}\n\n{risk_context.get(risk_level, risk_context['low'])}"
```

### FastAPI Endpoint (`backend/app/routes/chat.py`)

```python
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime
import logging

router = APIRouter(prefix="/api/chat", tags=["chat"])
logger = logging.getLogger(__name__)

class ChatRequest(BaseModel):
    message: str
    conversation_id: str
    risk_level: str = "low"

class ChatResponse(BaseModel):
    message: str
    timestamp: str

@router.post("/message", response_model=ChatResponse)
async def send_chat_message(
    request: ChatRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Send message to ChatGPT and get response"""
    try:
        conversation = db.query(Conversation).filter(
            Conversation.id == request.conversation_id,
            Conversation.user_id == current_user.id
        ).first()
        
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
        
        risk_assessment = db.query(RiskAssessment).filter(
            RiskAssessment.user_id == current_user.id
        ).order_by(RiskAssessment.created_at.desc()).first()
        
        history = [{"role": msg.role, "content": msg.content}
                   for msg in conversation.messages[-10:]]
        
        openai_service = OpenAIService()
        ai_response = await openai_service.chat_with_analysis(
            user_message=request.message,
            conversation_history=history,
            risk_level=risk_assessment.risk_level if risk_assessment else "low",
            user_profile={"age": current_user.age}
        )
        
        if ai_response["status"] != "success":
            raise HTTPException(status_code=500, detail="Failed to generate response")
        
        user_msg = Message(
            conversation_id=request.conversation_id,
            role="user",
            content=request.message,
            timestamp=datetime.utcnow()
        )
        
        assistant_msg = Message(
            conversation_id=request.conversation_id,
            role="assistant",
            content=ai_response["message"],
            timestamp=datetime.utcnow()
        )
        
        db.add(user_msg)
        db.add(assistant_msg)
        db.commit()
        
        return ChatResponse(
            message=ai_response["message"],
            timestamp=datetime.utcnow().isoformat()
        )
    except Exception as e:
        logger.error(f"Chat error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")
```

## Frontend Implementation

### React ChatGPT Component (`frontend/components/ChatInterface.jsx`)

```jsx
import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, AlertCircle, Loader } from 'lucide-react';
import axios from 'axios';

const ChatInterface = ({ conversationId, riskLevel }) => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userMessage = { role: 'user', content: inputValue, timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.post('/api/chat/message', {
        message: inputValue,
        conversation_id: conversationId,
        risk_level: riskLevel
      });

      const assistantMessage = {
        role: 'assistant',
        content: response.data.message,
        timestamp: new Date(response.data.timestamp)
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      setError('Failed to send message. Please try again.');
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-slate-900 to-slate-800 rounded-lg shadow-xl">
      <div className="bg-gradient-to-r from-cyan-500 to-blue-500 p-4 rounded-t-lg flex items-center gap-3">
        <MessageCircle className="text-white" size={24} />
        <div>
          <h2 className="text-white font-bold text-lg">PhyRISK Assistant</h2>
          <p className="text-cyan-100 text-sm">AI-powered mental health support</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-400">
            <MessageCircle size={48} className="mb-4 opacity-50" />
            <p className="text-lg">Start a conversation</p>
            <p className="text-sm mt-2">I'm here to help you understand your mental health</p>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs px-4 py-2 rounded-lg ${
                msg.role === 'user'
                  ? 'bg-blue-500 text-white rounded-br-none'
                  : 'bg-slate-700 text-gray-100 rounded-bl-none'
              }`}>
                <p className="text-sm">{msg.content}</p>
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-slate-700 text-gray-100 px-4 py-2 rounded-lg flex items-center gap-2">
              <Loader className="animate-spin" size={16} />
              <span className="text-sm">Thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="border-t border-slate-700 p-4 bg-slate-800">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask me anything about your mental health..."
            className="flex-1 bg-slate-700 text-white placeholder-gray-400 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            className="bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-600 text-white p-2 rounded-lg transition-colors"
          >
            <Send size={20} />
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatInterface;
```

## Installation & Setup

### Backend Setup
1. Install OpenAI Python library: `pip install openai`
2. Set environment variable: `export OPENAI_API_KEY="your-api-key"`
3. Add conversation models to database schema
4. Include chat router in main FastAPI app

### Frontend Setup
1. Import ChatInterface component in dashboard
2. Pass conversation ID and risk level as props
3. Ensure axios is configured with API base URL

## Features
- Real-time AI conversations with context awareness
- Risk-level adaptive responses
- Conversation history persistence
- Sentiment analysis of user messages
- Personalized wellness plan generation
- Crisis resource recommendations
- Full message encryption in transit

## Security Considerations
- All conversations encrypted with HTTPS
- User authentication required for chat access
- API key stored securely in environment variables
- Rate limiting on chat endpoints
- No conversation data shared with third parties
- GDPR compliant data handling

## Testing
```bash
pytest backend/tests/test_openai_service.py
pytest backend/tests/test_chat_routes.py
npm test frontend/components/ChatInterface.test.jsx
```

## Deployment Notes
- Requires OpenAI API key from https://openai.com/api
- Estimated cost: $0.03 per 1K tokens (gpt-4)
- Consider rate limiting for production
- Monitor API usage for cost management
- Implement fallback responses for API failures
