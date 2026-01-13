import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/ChatApp.css";

export default function ChatApp({ resetTrigger, onClearChat }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [subject, setSubject] = useState("General");
  const [difficulty, setDifficulty] = useState("Beginner");
  const [customSubject, setCustomSubject] = useState("");
  const [isCustomConfirmed, setIsCustomConfirmed] = useState(false);
  const [usage, setUsage] = useState({ 
    requests_today: 0, 
    daily_limit: "∞",
    messages_remaining: "∞",
    has_api_key: false,
    subscription_tier: "free",
    provider: "groq",
    provider_name: "Groq",
    using_fallback: false,
    key_source: "system_fallback"
  });
  const [needsApiKey, setNeedsApiKey] = useState(false);
  const [lastResponseCost, setLastResponseCost] = useState(null);
  
  // ADD THIS STATE: Track if we've shown the tip already
  const [hasShownReminder, setHasShownReminder] = useState(false);

  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // ✅ Reset chat when Clear Chat is clicked from parent
  useEffect(() => {
    if (resetTrigger) {
      clearLocalChat();
    }
  }, [resetTrigger]);

  // Check usage when component mounts
  useEffect(() => {
    checkUsage();
  }, []);

  // Function to clear local chat UI only
  const clearLocalChat = () => {
    setMessages([]);
    setInput("");
    setLoading(false);
    setLastResponseCost(null);
    setSubject("General");
    setDifficulty("Beginner");
    setCustomSubject("");
    setIsCustomConfirmed(false);
    // RESET the reminder flag when clearing chat
    setHasShownReminder(false);
  };

  // Function to handle "New Chat" button click
  const handleClearChat = async () => {
    clearLocalChat();
    
    if (onClearChat) {
      onClearChat();
    } else {
      await clearServerMemory();
    }
  };

  // Function to clear server memory directly
  const clearServerMemory = async () => {
    try {
      const res = await fetch("https://hadsxk-production.up.railway.app/api/clear-memory/", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          "Content-Type": "application/json",
        },
      });

      const data = await res.json();
      console.log("Server memory cleared:", data.message);
    } catch (err) {
      console.error("Failed to clear server memory:", err);
    }
  };

  // Function to check usage and API key status
  const checkUsage = async () => {
    try {
      const res = await fetch("https://hadsxk-production.up.railway.app/api/profile/", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });
      
      if (res.ok) {
        const data = await res.json();
        
        const hasApiKey = data.usage?.has_api_key || data.has_api_key || false;
        const provider = data.preferred_provider || "groq";
        const providerName = getProviderName(provider);
        
        setUsage({
          requests_today: data.usage?.requests_today || 0,
          daily_limit: data.usage?.daily_limit || "∞",
          messages_remaining: data.usage?.messages_remaining || "∞",
          has_api_key: hasApiKey,
          subscription_tier: data.subscription_tier || "free",
          provider: provider,
          provider_name: providerName,
          provider_info: data.provider_info || getProviderInfo(provider),
          using_fallback: data.usage?.using_fallback || false,
          key_source: data.usage?.key_source || 'system_fallback'
        });
        
        // Only show API key banner if not using fallback
        if (!hasApiKey && !data.usage?.using_fallback) {
          setNeedsApiKey(true);
        }
      }
    } catch (err) {
      console.error("Failed to check usage:", err);
    }
  };

  // Helper function to get provider name
  const getProviderName = (provider) => {
    const providerMap = {
      'groq': 'Groq',
      'openai': 'OpenAI',
      'anthropic': 'Anthropic Claude',
      'gemini': 'Google Gemini',
      'ollama': 'Ollama'
    };
    return providerMap[provider] || 'AI Provider';
  };

  // Helper function to get provider info
  const getProviderInfo = (provider) => {
    const providerInfoMap = {
      'groq': {
        name: 'Groq',
        is_free: true,
        free_tokens: '5,000,000 tokens/month (FREE)',
        link: 'https://console.groq.com/keys'
      },
      'openai': {
        name: 'OpenAI',
        is_free: false,
        free_tokens: 'No free tier - Pay-as-you-go',
        link: 'https://platform.openai.com/api-keys',
        models: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo']
      },
      'anthropic': {
        name: 'Anthropic Claude',
        is_free: false,
        free_tokens: 'No free tier - Pay-as-you-go',
        link: 'https://console.anthropic.com/',
        models: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku']
      },
      'gemini': {
        name: 'Google Gemini',
        is_free: true,
        free_tokens: '60 requests/minute (FREE)',
        link: 'https://makersuite.google.com/app/apikey'
      },
      'ollama': {
        name: 'Ollama',
        is_free: true,
        free_tokens: 'Local models - Unlimited',
        link: 'https://ollama.com/'
      }
    };
    return providerInfoMap[provider] || {
      name: 'AI Provider',
      is_free: false,
      free_tokens: 'Check provider website'
    };
  };

  // Function to send message - Updated with fallback support
  const sendMessage = async () => {
    if (!input.trim()) return;

    const finalSubject = subject === "custom" ? customSubject.trim() : subject;
    if (!finalSubject) return alert("Subject cannot be empty!");

    const userMessage = { role: "user", content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    setLastResponseCost(null);

    try {
      const res = await fetch("https://hadsxk-production.up.railway.app/api/ai-chat/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
        body: JSON.stringify({
          prompt: input,
          subject: finalSubject,
          difficulty: difficulty,
          model: getDefaultModel(usage.provider)
        }),
      });

      const data = await res.json();
      
      // Update costs with fallback info
      if (data.costs) {
        setLastResponseCost({
          estimatedUserCost: data.costs.estimated_user_cost || 0,
          serviceFee: data.costs.your_service_fee || 0.000001,
          isFree: data.costs.is_free || (data.costs.estimated_user_cost === 0),
          tokenInfo: data.costs.token_info || null,
          provider: data.costs.provider || usage.provider,
          usingSystemKey: data.costs.using_system_key || false,
          keySource: data.costs.key_source || 'user'
        });
      }
      
      // Handle different response scenarios
      if (res.status === 402) {
        // API key setup recommended but not required (we have fallback)
        const providerInfo = usage.provider_info || getProviderInfo(usage.provider);
        const isUsingSystemKey = data.using_system_fallback || data.costs?.using_system_key;
        
        let apiKeyMessage;
        
        if (isUsingSystemKey) {
          // User is using system fallback - gently recommend setting up own key
          apiKeyMessage = {
            role: "ai",
            content: `🎯 **${providerInfo.name} API Key Recommended**\n\n` +
                     `You're currently using our shared API key (limited).\n` +
                     `For better performance and unlimited access, add your own ${providerInfo.name} API key.\n\n` +
                     `🔗 **Get FREE API Key:** ${providerInfo.link}\n` +
                     (providerInfo.is_free ? `🎁 **Free Tier:** ${providerInfo.free_tokens}\n` : '') +
                     `⚡ **Configure it in Settings for unlimited access!**`,
            isApiKeyPrompt: true,
          };
          // Set a timer to show the API key banner
          setTimeout(() => {
            setNeedsApiKey(true);
          }, 500);
        } else {
          // No API key available at all
          apiKeyMessage = {
            role: "ai",
            content: `🔑 **${providerInfo.name} API Key Required!**\n\n` +
                     `Please set up your ${providerInfo.name} API key to continue chatting.\n\n` +
                     `🔗 **Get API Key:** ${providerInfo.link}\n` +
                     (providerInfo.is_free ? `🎁 **Free Tier:** ${providerInfo.free_tokens}\n` : '') +
                     `⚡ **Configure it in Settings to start chatting!**`,
            isApiKeyPrompt: true,
          };
          setNeedsApiKey(true);
        }
        
        setMessages(prev => [...prev, apiKeyMessage]);
        
      } else if (res.status === 429) {
        // Rate limit reached
        const limitMessage = {
          role: "ai",
          content: `🎯 **Rate Limit Reached!**\n\n` +
                   `You've reached your daily limit on our service.\n\n` +
                   `📊 **Usage**: ${data.current_usage || usage.requests_today} requests today\n` +
                   `📈 **Limit**: ${data.daily_limit || usage.daily_limit} per day\n\n` +
                   `💡 **Options**:\n` +
                   `1. Wait until tomorrow (resets daily)\n` +
                   `2. Upgrade to premium for higher limits\n` +
                   `3. Add your own API key for unlimited access`,
          isLimitMessage: true,
        };
        setMessages(prev => [...prev, limitMessage]);
        
      } else if (res.status === 403) {
        // OpenAI specific error - insufficient credits
        const creditMessage = {
          role: "ai",
          content: `💳 **Insufficient Credits - ${usage.provider_name}**\n\n` +
                   `Your ${usage.provider_name} account doesn't have enough credits.\n\n` +
                   `💰 **Action Required:**\n` +
                   `1. Add payment method to your ${usage.provider_name} account\n` +
                   `2. Or switch to a free provider like Groq in **Settings**\n\n` +
                   `🔗 **${usage.provider_name} Dashboard:** ${usage.provider_info?.link || 'Provider website'}`,
          isApiKeyPrompt: true,
        };
        setMessages(prev => [...prev, creditMessage]);
        setNeedsApiKey(true);
        
      } else if (data.success === false) {
        // General API error
        setMessages(prev => [...prev, { 
          role: "ai", 
          content: `❌ **${usage.provider_name} API Error:** ${data.error || "Something went wrong"}\n\n` +
                   `Details: ${data.suggestion || "Check your API key and try again"}` 
        }]);
        
      } else if (data.success) {
        // Success! Show the AI response
        const aiMessage = { 
          role: "ai", 
          content: data.response || data.answer,
          provider: usage.provider_name,
          usingSystemKey: data.costs?.using_system_key || false
        };
        setMessages(prev => [...prev, aiMessage]);
        
        // MODIFIED: Show the tip only ONCE and only when using system key
        if (data.costs?.using_system_key && !hasShownReminder) {
          setTimeout(() => {
            // Show a subtle reminder in the UI
            const reminderMessage = {
              role: "ai",
              content: `💡 **Tip:** Add your own ${usage.provider_name} API key in **Settings** for unlimited access!`,
              isReminder: true
            };
            setMessages(prev => [...prev, reminderMessage]);
            // SET THE FLAG so we don't show it again
            setHasShownReminder(true);
          }, 2000);
        }
        
        // Update usage stats
        if (data.usage) {
          setUsage(prev => ({
            ...prev,
            requests_today: data.usage.requests_today || prev.requests_today,
            has_api_key: data.usage.has_api_key,
            using_fallback: data.usage.using_fallback || false,
            key_source: data.usage.key_source || 'user'
          }));
        }
      } else {
        // Unexpected response format
        setMessages(prev => [...prev, { 
          role: "ai", 
          content: `❌ **Unexpected response from server**\n\n` +
                   `Response: ${JSON.stringify(data).substring(0, 200)}...` 
        }]);
      }
    } catch (err) {
      console.error("Network error:", err);
      setMessages(prev => [...prev, { 
        role: "ai", 
        content: "❌ **Network error.** Please check your internet connection and try again." 
      }]);
    } finally {
      setLoading(false);
      checkUsage();
    }
  };

  // Helper function to get default model based on provider
  const getDefaultModel = (provider) => {
    const modelMap = {
      'groq': 'llama-3.1-8b-instant',
      'openai': 'gpt-3.5-turbo',
      'anthropic': 'claude-3-haiku',
      'gemini': 'gemini-pro',
      'ollama': 'llama2'
    };
    return modelMap[provider] || 'llama-3.1-8b-instant';
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") sendMessage();
  };

  const goToPlans = () => {
    navigate("/plans");
  };

  const goToProfile = () => {
    navigate("/profile");
  };

  const goToSettings = () => {
    navigate("/profile#api-settings");
  };

  const clearCostInfo = () => {
    setLastResponseCost(null);
  };

  return (
    <div className="chat-container">
      {/* API Key Recommendation Banner */}
      {needsApiKey && (
        <div className="api-key-banner">
          <div className="api-key-banner-content">
            <span>
              🔑 <strong>API Key Recommended!</strong> 
              {usage.using_fallback ? (
                <>
                  You're using our shared API key (limited). Add your own for unlimited access. 
                  <button className="inline-settings-btn" onClick={goToSettings}>Add Your API Key</button>
                  <a href={usage.provider_info?.link} target="_blank" rel="noopener noreferrer" className="get-key-link">
                    🔗 Get FREE API Key
                  </a>
                </>
              ) : (
                <>
                  Please add your {usage.provider_name} API key to continue chatting.
                  <button className="inline-settings-btn" onClick={goToSettings}>Go to Settings</button>
                </>
              )}
            </span>
            <button className="close-banner" onClick={() => setNeedsApiKey(false)}>×</button>
          </div>
        </div>
      )}
 
     

  {/* Controls Bar - Side by Side Layout */}
<div className="control-bar">
  {/* Subject and Level in the same row */}
  <div className="controls-row">
    {/* Subject Container */}
    <div className="subject-container">
      <div className="control-group">
        <label>📘 Subject</label>
        <select
          value={subject}
          onChange={(e) => {
            setSubject(e.target.value);
            setIsCustomConfirmed(false);
          }}
        >
          <option value="General">General</option>
          <option value="Python">Python</option>
          <option value="Math">Math</option>
          <option value="AI">AI</option>
          <option value="Data Structures">Data Structures</option>
          <option value="custom">Custom</option>
        </select>

        {subject === "custom" && (
          <div className={`custom-input-wrapper ${isCustomConfirmed ? "confirmed" : ""}`}>
            <input
              className="custom-subject-input"
              type="text"
              placeholder="Enter your subject..."
              value={customSubject}
              onFocus={() => {
                if (isCustomConfirmed) {
                  setIsCustomConfirmed(false);
                }
              }}
              onChange={(e) => {
                setCustomSubject(e.target.value);
                setIsCustomConfirmed(false);
              }}
            />
            <button
              className="confirm-inside-btn"
              onClick={() => {
                if (customSubject.trim()) setIsCustomConfirmed(true);
              }}
              disabled={!customSubject.trim() || isCustomConfirmed}
              title="Confirm subject"
            >
              ✔
            </button>
          </div>
        )}
      </div>
    </div>

    {/* Level Container */}
    <div className="level-container">
      <div className="control-group">
        <label>🎯 Level</label>
        <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
          <option>Beginner</option>
          <option>Intermediate</option>
          <option>Advanced</option>
        </select>
      </div>
    </div>
  </div>

  {/* Compact Usage Indicator - Now appears to the right on desktop, below on mobile */}
  <div className="control-group usage-indicator">
    <label>⚡ Status</label>
    <div className="usage-mini">
      <span className={`provider-badge provider-${usage.provider}`}>
        {usage.provider_name}
      </span>
      <span className="requests-count">
        {usage.requests_today} requests today
      </span>
      {usage.using_fallback && (
        <span className="fallback-indicator" title="Using shared API key">
          🔄
        </span>
      )}
    </div>
  </div>
</div>

      {/* Messages */}
      <div className="messages">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`message ${msg.role === "user" ? "user" : "ai"} ${
              msg.isUpgradePrompt ? 'upgrade-message' : ''
            } ${msg.isApiKeyPrompt ? 'apikey-message' : ''} ${msg.isLimitMessage ? 'limit-message' : ''} ${msg.isReminder ? 'reminder-message' : ''}`}
          >
            <div className="avatar">
              {msg.role === "user" ? "👤" : msg.provider === 'OpenAI' ? '⚡' : '🤖'}
            </div>
            <div className="content">
              {msg.content}
              {msg.isUpgradePrompt && (
                <div className="upgrade-suggestion">
                  <p>💡 <strong>Want premium features?</strong></p>
                  <button 
                    className="inline-upgrade-btn"
                    onClick={goToPlans}
                  >
                    ⭐ View Premium Plans
                  </button>
                </div>
              )}
              {msg.isApiKeyPrompt && (
                <div className="apikey-suggestion">
                  <p>🔑 <strong>Configure API Key</strong></p>
                  <button 
                    className="inline-apikey-btn"
                    onClick={goToSettings}
                  >
                    ⚡ Go to Settings
                  </button>
                </div>
              )}
              {msg.isLimitMessage && (
                <div className="limit-suggestion">
                  <p>💡 <strong>Need more AI access?</strong></p>
                  <button 
                    className="inline-profile-btn"
                    onClick={goToSettings}
                  >
                    ⚙️ Manage API Provider
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="message ai">
            <div className="avatar">
              {usage.provider === 'openai' ? '⚡' : '🤖'}
            </div>
            <div className="content typing">
              <span></span><span></span><span></span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef}></div>
      </div>

      {/* Input */}
      <div className="input-area">
        <input
          type="text"
          placeholder={`Ask your study assistant (using ${usage.provider_name})...`}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={loading}
        />
        <button 
          onClick={sendMessage}
          disabled={loading}
          className={!usage.has_api_key ? 'api-key-btn' : ''}
        >
          {loading ? '...' : 'Send'}
        </button>
        <button 
          className="clear-btn" 
          onClick={handleClearChat}
          disabled={loading}
        >
          New Chat
        </button>
      </div>
    </div>
  );
}