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
    key_source: "system_fallback",
    can_generate_images: false
  });
  const [needsApiKey, setNeedsApiKey] = useState(false);
  const [lastResponseCost, setLastResponseCost] = useState(null);
  const [apiBannerDismissed, setApiBannerDismissed] = useState(
    localStorage.getItem("api_banner_dismissed") === "true"
  );
  const [imageGenerating, setImageGenerating] = useState(false);
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
    setImageGenerating(false);
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
        const providerInfo = getProviderInfo(provider);
        
        setUsage({
          requests_today: data.usage?.requests_today || 0,
          daily_limit: data.usage?.daily_limit || "∞",
          messages_remaining: data.usage?.messages_remaining || "∞",
          has_api_key: hasApiKey,
          subscription_tier: data.subscription_tier || "free",
          provider: provider,
          provider_name: providerName,
          provider_info: data.provider_info || providerInfo,
          using_fallback: data.usage?.using_fallback || false,
          key_source: data.usage?.key_source || 'system_fallback',
          can_generate_images: true // Enable image generation for all users
        });
        
        // Only show API key banner if not using fallback
        if (!hasApiKey && !data.usage?.using_fallback && !apiBannerDismissed) {
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
        link: 'https://console.groq.com/keys',
        supports_images: false
      },
      'openai': {
        name: 'OpenAI',
        is_free: false,
        free_tokens: 'No free tier - Pay-as-you-go',
        link: 'https://platform.openai.com/api-keys',
        supports_images: false
      },
      'anthropic': {
        name: 'Anthropic Claude',
        is_free: false,
        free_tokens: 'No free tier - Pay-as-you-go',
        link: 'https://console.anthropic.com/',
        supports_images: false
      },
      'gemini': {
        name: 'Google Gemini',
        is_free: true,
        free_tokens: '60 requests/minute (FREE)',
        link: 'https://makersuite.google.com/app/apikey',
        supports_images: false
      },
      'ollama': {
        name: 'Ollama',
        is_free: true,
        free_tokens: 'Local models - Unlimited',
        link: 'https://ollama.com/',
        supports_images: false
      }
    };
    return providerInfoMap[provider] || {
      name: 'AI Provider',
      is_free: false,
      free_tokens: 'Check provider website',
      supports_images: false
    };
  };

  // Function to detect if user wants an image
  const isImageRequest = (text) => {
    const imageKeywords = [
      'generate image', 'create image', 'make a picture', 'draw a picture',
      'show me an image', 'visualize', 'picture of', 'photo of', 'image of',
      'generate a picture', 'create a picture', 'make an image',
      'draw', 'paint', 'sketch', 'illustration', 'diagram', 'graphic',
      'can you show me', 'show me', 'picture', 'image', 'art', 'painting',
      'logo', 'poster', 'banner', 'infographic', 'chart', 'map'
    ];
    
    const textLower = text.toLowerCase().trim();
    
    for (const keyword of imageKeywords) {
      if (keyword === textLower || textLower.includes(keyword)) {
        return true;
      }
    }
    
    // Check for patterns like "generate an image of X"
    if ((textLower.includes('generate') || textLower.includes('create') || textLower.includes('make')) &&
        (textLower.includes('image') || textLower.includes('picture') || textLower.includes('draw'))) {
      return true;
    }
    
    return false;
  };

  // Function to extract image prompt from user input
  const extractImagePrompt = (text) => {
    const removePhrases = [
      'generate image of', 'create image of', 'make a picture of',
      'draw a picture of', 'show me an image of', 'visualize',
      'generate a picture of', 'create a picture of', 'make an image of',
      'draw', 'paint', 'sketch', 'illustration of', 'diagram of',
      'generate', 'create', 'make', 'show me', 'picture of', 'image of'
    ];
    
    let cleaned = text;
    const textLower = text.toLowerCase();
    
    for (const phrase of removePhrases) {
      if (textLower.includes(phrase)) {
        cleaned = cleaned.replace(new RegExp(phrase, 'gi'), '');
      }
    }
    
    cleaned = cleaned.trim();
    cleaned = cleaned.replace(/^[\s,.\-!?;:]+|[\s,.\-!?;:]+$/g, '');
    
    if (!cleaned || cleaned.length < 3) {
      return text;
    }
    
    return cleaned + ", high quality, detailed, professional";
  };

// In your frontend ChatApp.jsx, update the generateImage function:
const generateImage = async (prompt) => {
  setImageGenerating(true);
  setLoading(true);
  
  try {
    console.log("🖼️ Generating image with prompt:", prompt);
    
    const res = await fetch("https://hadsxk-production.up.railway.app/api/generate-image/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("access_token")}`,
      },
      body: JSON.stringify({
        prompt: prompt,
        // Remove generate_image: true if your backend doesn't expect it
      }),
    });

    console.log("Response status:", res.status);
    
    const data = await res.json();
    console.log("Response data:", data);
    
    if (!res.ok) {
      throw new Error(data.error || `HTTP ${res.status}: ${data.message || 'Unknown error'}`);
    }
    
    if (data.success) {
      // Create image message
      const imageMessage = {
        role: "ai",
        content: data.response || `🎨 Image generated: ${prompt}`,
        image_url: data.image_url,
        image_prompt: data.image_prompt || prompt,
        isImage: true,
        provider: "Replicate",
        usingSystemKey: true
      };
      
      setMessages(prev => [...prev, imageMessage]);
      
      // Update usage stats
      checkUsage();
      
      return { success: true, data };
    } else {
      throw new Error(data.error || "Image generation failed");
    }
  } catch (err) {
    console.error("❌ Image generation error:", err);
    const errorMessage = {
      role: "ai",
      content: `❌ Image generation failed: ${err.message}\n\n` +
               `This might be because:\n` +
               `1. Replicate API is not configured\n` +
               `2. No credits remaining on Replicate account\n` +
               `3. Service temporarily unavailable\n\n` +
               `Please try again later or use text chat.`,
      isError: true
    };
    setMessages(prev => [...prev, errorMessage]);
    return { success: false, error: err.message };
  } finally {
    setImageGenerating(false);
    setLoading(false);
  }
};

  // Function to send message - Updated with image generation support
  const sendMessage = async () => {
    if (!input.trim()) return;

    const finalSubject = subject === "custom" ? customSubject.trim() : subject;
    if (!finalSubject && subject === "custom") return alert("Subject cannot be empty!");

    const userMessage = { role: "user", content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    setLastResponseCost(null);

    // Check if this is an image request
    const isImage = isImageRequest(input);
    
    if (isImage && usage.can_generate_images) {
      // Show loading message for image generation
      const loadingMessage = {
        role: "ai",
        content: "🎨 Generating image... This may take 30-60 seconds.",
        isImageLoading: true
      };
      setMessages(prev => [...prev, loadingMessage]);
      
      // Generate image
      const imagePrompt = extractImagePrompt(input);
      await generateImage(imagePrompt);
      return;
    }

    // Regular text chat
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
          if (!apiBannerDismissed) {
            setTimeout(() => {
              setNeedsApiKey(true);
            }, 500);
          }
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
          usingSystemKey: data.costs?.using_system_key || false,
          image_url: data.image_url,
          image_prompt: data.image_prompt,
          isImage: data.image_generated || false
        };
        setMessages(prev => [...prev, aiMessage]);
        
        // Show the tip only ONCE and only when using system key
        if (data.costs?.using_system_key && !hasShownReminder) {
          setTimeout(() => {
            const reminderMessage = {
              role: "ai",
              content: `💡 **Tip:** Add your own ${usage.provider_name} API key in **Settings** for unlimited access!`,
              isReminder: true
            };
            setMessages(prev => [...prev, reminderMessage]);
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

  // Function to handle image click (open in new tab)
  const handleImageClick = (url) => {
    window.open(url, '_blank');
  };

  // Function to download image
  const downloadImage = (url, prompt) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `ai_image_${Date.now()}.jpg`;
    link.click();
  };

  return (
    <div className="chat-container">
      {/* API Key Recommendation Banner */}
      {needsApiKey && !apiBannerDismissed && (
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
            <button
              className="close-banner"
              onClick={() => {
                setNeedsApiKey(false);
                setApiBannerDismissed(true);
                localStorage.setItem("api_banner_dismissed", "true");
              }}
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Image Generation Info Banner */}
      {usage.can_generate_images && (
        <div className="image-generation-banner">
          <div className="image-generation-banner-content">
            <span>
              🎨 <strong>Image Generation Available!</strong> 
              Ask me to generate images (e.g., "generate an image of a sunset", "create a picture of a cat").
            </span>
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
                <option value="Art">Art</option>
                <option value="Design">Design</option>
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

        {/* Compact Usage Indicator */}
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
            {usage.can_generate_images && (
              <span className="image-indicator" title="Image generation enabled">
                🎨
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
            } ${msg.isApiKeyPrompt ? 'apikey-message' : ''} ${msg.isLimitMessage ? 'limit-message' : ''} ${
              msg.isReminder ? 'reminder-message' : ''} ${msg.isImage ? 'image-message' : ''} ${
              msg.isImageLoading ? 'image-loading-message' : ''} ${msg.isError ? 'error-message' : ''}`
            }
          >
            <div className="avatar">
              {msg.role === "user" ? "👤" : 
               msg.isImage ? "🎨" : 
               msg.provider === 'OpenAI' ? '⚡' : '🤖'}
            </div>
            <div className="content">
              {msg.isImage ? (
                <div className="image-response">
                  <div className="image-container">
                    <img 
                      src={msg.image_url} 
                      alt={msg.image_prompt || "AI Generated Image"}
                      className="generated-image"
                      onClick={() => handleImageClick(msg.image_url)}
                    />
                    <div className="image-actions">
                      <button 
                        className="image-action-btn view-btn"
                        onClick={() => handleImageClick(msg.image_url)}
                        title="Open in new tab"
                      >
                        🔍 View Full Size
                      </button>
                      <button 
                        className="image-action-btn download-btn"
                        onClick={() => downloadImage(msg.image_url, msg.image_prompt)}
                        title="Download image"
                      >
                        ⬇️ Download
                      </button>
                    </div>
                  </div>
                  <div className="image-info">
                    <p><strong>Prompt:</strong> {msg.image_prompt || "No prompt provided"}</p>
                    <p className="image-note">Image generated using Stable Diffusion XL</p>
                  </div>
                </div>
              ) : (
                <div dangerouslySetInnerHTML={{ __html: msg.content.replace(/\n/g, '<br/>') }} />
              )}
              
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

        {loading && !imageGenerating && (
          <div className="message ai">
            <div className="avatar">
              {usage.provider === 'openai' ? '⚡' : '🤖'}
            </div>
            <div className="content typing">
              <span></span><span></span><span></span>
            </div>
          </div>
        )}

        {imageGenerating && (
          <div className="message ai image-loading">
            <div className="avatar">🎨</div>
            <div className="content">
              <div className="image-loading-indicator">
                <div className="loading-spinner"></div>
                <p>Generating your image... This may take 30-60 seconds.</p>
                <p className="loading-note">Please be patient, high-quality images take time!</p>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef}></div>
      </div>

      {/* Input with Image Suggestions */}
      <div className="input-area">
        <div className="input-suggestions">
          <span className="suggestion-label">Try asking:</span>
          <button 
            className="suggestion-btn"
            onClick={() => setInput("Generate an image of a sunset over mountains")}
          >
            🎨 Generate sunset image
          </button>
          <button 
            className="suggestion-btn"
            onClick={() => setInput("Create a picture of a futuristic city")}
          >
            🏙️ Create cityscape
          </button>
          <button 
            className="suggestion-btn"
            onClick={() => setInput("Explain quantum physics")}
          >
            🤔 Ask a question
          </button>
        </div>
        
        <div className="input-wrapper">
          <input
            type="text"
            placeholder={`Ask your assistant or request an image (using ${usage.provider_name})...`}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={loading || imageGenerating}
          />
          <button 
            onClick={sendMessage}
            disabled={loading || imageGenerating}
            className={!usage.has_api_key ? 'api-key-btn' : ''}
            title={imageGenerating ? "Generating image..." : "Send message"}
          >
            {imageGenerating ? '🎨' : loading ? '...' : 'Send'}
          </button>
          <button 
            className="clear-btn" 
            onClick={handleClearChat}
            disabled={loading || imageGenerating}
            title="Start new chat"
          >
            New Chat
          </button>
        </div>
        
        <div className="input-footer">
          <span className="image-hint">
            {isImageRequest(input) ? (
              <span className="image-detected">🎨 Image request detected - will generate image</span>
            ) : (
              <span>💡 Try: "generate an image of..." or ask a question</span>
            )}
          </span>
        </div>
      </div>
    </div>
  );
}