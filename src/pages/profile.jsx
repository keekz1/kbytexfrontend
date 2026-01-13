// src/pages/Profile.js
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/profile.css";

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [apiKey, setApiKey] = useState("");
  const [apiProvider, setApiProvider] = useState("groq");
  const [showKey, setShowKey] = useState(false);
  const [message, setMessage] = useState("");
  const [subscription, setSubscription] = useState(null);
  const [testingKey, setTestingKey] = useState(false);
  const [keyTestResult, setKeyTestResult] = useState(null);
  const [skipTest, setSkipTest] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProfile();
    fetchSubscription();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/api/profile/", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });
      const data = await res.json();
      setProfile(data);
      // Set default provider to user's current provider or Groq
      if (data.preferred_provider) {
        setApiProvider(data.preferred_provider);
      }
    } catch (err) {
      console.error("Failed to fetch profile:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubscription = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/api/plans/", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        const userPlan = data.plans.find(p => 
          p.tier === (profile?.subscription_tier || 'free')
        );
        setSubscription(userPlan);
      }
    } catch (err) {
      console.error("Failed to fetch subscription:", err);
    }
  };

  const testOpenAIKey = async (key) => {
    setTestingKey(true);
    try {
      const res = await fetch("http://127.0.0.1:8000/api/test-openai-key/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
        body: JSON.stringify({
          api_key: key,
        }),
      });

      const data = await res.json();
      setKeyTestResult(data);
      return data;
    } catch (err) {
      console.error("Key test failed:", err);
      return { success: false, error: "Test failed" };
    } finally {
      setTestingKey(false);
    }
  };

  const saveApiKey = async () => {
    if (!apiKey.trim()) {
      setMessage("Please enter your API key");
      return;
    }

    // Show testing message for OpenAI
    if (apiProvider === 'openai' && !skipTest) {
      setMessage("🔍 Testing your OpenAI key...");
    }

    try {
      const res = await fetch("http://127.0.0.1:8000/api/set-api-key/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
        body: JSON.stringify({
          provider: apiProvider,
          api_key: apiKey,
          skip_test: skipTest,
        }),
      });

      const data = await res.json();
      
      if (data.success) {
        let successMessage = `✅ ${data.provider?.toUpperCase() || 'API'} key saved successfully! `;
        
        if (apiProvider === 'openai') {
          successMessage += data.is_free ? '(FREE Tier!)' : '(Paid Account)';
          
          // Add key details if available
          if (data.test_result) {
            successMessage += `<br/>`;
            successMessage += `<strong>Key Type:</strong> ${data.key_type}<br/>`;
            successMessage += `<strong>Credit Balance:</strong> $${data.credit_balance}<br/>`;
            
            // Add warning for free tier users
            if (data.key_type === 'free_tier') {
              successMessage += `<br/><strong>⚠️ Free Tier Limits:</strong> GPT-3.5 models only`;
            }
            
            // Warn about low credit balance
            if (data.credit_balance < 1.0 && data.key_type === 'pay_as_you_go') {
              successMessage += `<br/><strong>⚠️ Low Credit:</strong> Add more credits to continue using`;
            }
          }
        } else if (apiProvider === 'groq') {
          successMessage += ' (FREE - 5M tokens/month!)';
        }
        
        setMessage(
          <div>
            <div dangerouslySetInnerHTML={{ __html: successMessage }} />
            {apiProvider === 'openai' && data.key_type === 'free_tier' && (
              <div className="free-tier-alert">
                ⚠️ <strong>Free Tier Account</strong> - Limited to GPT-3.5 models only. Free credits expire after 3 months.
              </div>
            )}
            {apiProvider === 'openai' && data.key_type === 'free_tier' && data.credit_balance <= 0.01 && (
              <div className="free-tier-alert">
                ❌ <strong>Free Credits Expired!</strong> Add payment method or switch to FREE Groq.
              </div>
            )}
            {apiProvider === 'openai' && data.key_type === 'pay_as_you_go' && data.credit_balance <= 1.0 && (
              <div className="paid-tier-alert">
                ⚠️ <strong>Low Credit Balance:</strong> Add more credits at <a href="https://platform.openai.com/account/billing" target="_blank" rel="noopener noreferrer">OpenAI Billing</a>
              </div>
            )}
          </div>
        );
        setApiKey("");
        setKeyTestResult(null);
        fetchProfile(); // Refresh profile
      } else {
        setMessage(
          <div>
            ❌ <strong>Error:</strong> {data.error || "Failed to save API key"}
            {data.test_result && (
              <div className="test-details">
                <strong>Test Details:</strong> {JSON.stringify(data.test_result.error)}
              </div>
            )}
            {data.error && data.error.includes('insufficient_quota') && (
              <div className="credit-alert">
                ⚠️ <strong>OpenAI Credits Expired!</strong> Your free credits have been used up.<br/>
                • <a href="https://platform.openai.com/account/billing" target="_blank" rel="noopener noreferrer">Add payment method</a><br/>
                • <button className="inline-btn" onClick={() => setApiProvider('groq')}>Switch to FREE Groq</button>
              </div>
            )}
          </div>
        );
      }
    } catch (err) {
      console.error(err);
      setMessage("❌ Network error. Please try again.");
    }
  };

  const testCurrentKey = async () => {
    if (!apiKey.trim()) {
      setMessage("Please enter an API key first");
      return;
    }

    setMessage("🔍 Testing API key...");
    
    if (apiProvider === 'openai') {
      const result = await testOpenAIKey(apiKey);
      if (result.success) {
        setMessage(
          <div>
            ✅ <strong>OpenAI Key Test Successful!</strong>
            <div className="test-result-details">
              <div><strong>Key Type:</strong> {result.key_type}</div>
              <div><strong>Credit Balance:</strong> ${result.credit_balance}</div>
              <div><strong>Can Chat:</strong> {result.can_chat ? '✅ Yes' : '❌ No'}</div>
              <div><strong>Available Models:</strong> GPT-3.5 Turbo only</div>
              {result.is_free_tier && (
                <div className="free-tier-warning">
                  ⚠️ <strong>Free Tier Account</strong> - Limited to GPT-3.5 models
                </div>
              )}
            </div>
          </div>
        );
      } else {
        setMessage(`❌ Key Test Failed: ${result.error || "Unknown error"}`);
      }
    } else if (apiProvider === 'groq') {
      // Test Groq key
      try {
        const response = await fetch("https://api.groq.com/openai/v1/models", {
          headers: {
            "Authorization": `Bearer ${apiKey}`,
          },
        });
        
        if (response.ok) {
          setMessage("✅ Groq API Key is valid! (FREE - 5M tokens/month)");
        } else {
          setMessage(`❌ Groq API Key test failed: ${response.status}`);
        }
      } catch (err) {
        setMessage("❌ Failed to test Groq key");
      }
    }
  };

  const requestGroqSetup = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/api/request-groq-setup/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });

      const data = await res.json();
      
      if (data.success) {
        setMessage(
          <div>
            <strong>✅ FREE Groq Setup Instructions:</strong><br/>
            <div className="setup-instructions">
              {data.instructions?.split('\n').map((line, idx) => (
                <div key={idx} className="instruction-line">{line}</div>
              ))}
            </div>
          </div>
        );
      } else {
        setMessage(`❌ Error: ${data.error || "Failed to get setup instructions"}`);
      }
    } catch (err) {
      console.error(err);
      setMessage("❌ Network error. Please try again.");
    }
  };

  const createCheckout = async (planTier) => {
    try {
      const res = await fetch("http://127.0.0.1:8000/api/create-checkout/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
        body: JSON.stringify({
          plan_tier: planTier,
        }),
      });

      const data = await res.json();
      
      if (data.success && data.url) {
        window.location.href = data.url;
      } else {
        setMessage("❌ Failed to create checkout session");
      }
    } catch (err) {
      console.error(err);
      setMessage("❌ Network error. Please try again.");
    }
  };

  const cancelSubscription = async () => {
    if (!window.confirm("Are you sure you want to cancel your subscription?")) {
      return;
    }

    try {
      const res = await fetch("http://127.0.0.1:8000/api/cancel-subscription/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });

      const data = await res.json();
      
      if (data.success) {
        setMessage("✅ Subscription cancelled successfully");
        fetchProfile();
        fetchSubscription();
      } else {
        setMessage(`❌ Error: ${data.error || "Failed to cancel subscription"}`);
      }
    } catch (err) {
      console.error(err);
      setMessage("❌ Network error. Please try again.");
    }
  };

  if (loading) {
    return <div className="loading">Loading profile...</div>;
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1>👤 Account Settings</h1>
        <button className="back-btn" onClick={() => navigate("/")}>
          ← Back to Chat
        </button>
      </div>

      {message && (
        <div className={`alert ${typeof message === 'string' && message.includes('✅') ? 'alert-success' : 'alert-error'}`}>
          {message}
        </div>
      )}

      <div className="profile-grid">
        {/* User Info Card */}
        <div className="profile-card">
          <h2>Account Information</h2>
          <div className="info-grid">
            <div className="info-item">
              <span className="label">Username:</span>
              <span className="value">{profile?.username}</span>
            </div>
            <div className="info-item">
              <span className="label">Email:</span>
              <span className="value">{profile?.user?.email || "Not set"}</span>
            </div>
            <div className="info-item">
              <span className="label">Current Plan:</span>
              <span className={`value tier-${profile?.subscription_tier}`}>
                {profile?.subscription_tier?.toUpperCase()}
              </span>
            </div>
            <div className="info-item">
              <span className="label">AI Provider:</span>
              <span className="value">
                {profile?.provider_info?.name || 'Not set'}
                {profile?.provider_info?.is_free && <span className="free-badge-small"> (FREE)</span>}
              </span>
            </div>
            {profile?.openai_key_type && (
              <div className="info-item">
                <span className="label">OpenAI Account:</span>
                <span className="value">
                  {profile.openai_key_type === 'free_tier' ? 'Free Tier' : 'Paid Account'}
                  {profile.openai_key_credit_balance > 0 && (
                    <span className="credit-balance">
                      (${profile.openai_key_credit_balance.toFixed(2)} credit)
                    </span>
                  )}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* API Key Management Card */}
        <div className="profile-card">
          <h2>🔑 AI API Configuration</h2>
          <p className="card-description">
            Connect your own AI provider account. Use FREE Groq or OpenAI (GPT-3.5 Turbo).
          </p>
          
          <div className="form-group">
            <label>AI Provider</label>
            <select 
              value={apiProvider} 
              onChange={(e) => {
                setApiProvider(e.target.value);
                setKeyTestResult(null);
                setSkipTest(false);
              }}
            >
              <option value="groq">🔥 Groq (FREE - 5M tokens/month)</option>
              <option value="openai">OpenAI (GPT-3.5 Turbo only)</option>
            </select>
            
            {apiProvider === 'groq' && (
              <div className="free-provider-banner">
                ⚡ <strong>FREE!</strong> 5 MILLION tokens/month • No credit card required
              </div>
            )}
            
            {apiProvider === 'openai' && (
              <div className="provider-info-banner">
                ✅ GPT-3.5 Turbo models only • Free tier or paid account
              </div>
            )}
          </div>
          
          <div className="form-group">
            <label>Your API Key</label>
            <div className="input-with-icon">
              <input
                type={showKey ? "text" : "password"}
                placeholder={
                  apiProvider === 'groq' 
                    ? "Enter your FREE Groq API key..." 
                    : "Enter your OpenAI API key..."
                }
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
              <button 
                className="toggle-visibility"
                onClick={() => setShowKey(!showKey)}
                type="button"
              >
                {showKey ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
            <small className="help-text">
              {apiProvider === 'groq' 
                ? "Get FREE API key: https://console.groq.com/keys"
                : "Get OpenAI key: https://platform.openai.com/api-keys"}
            </small>
          </div>

          {apiProvider === 'openai' && (
            <div className="form-group">
              <div className="checkbox-group">
                <input
                  type="checkbox"
                  id="skip-test"
                  checked={skipTest}
                  onChange={(e) => setSkipTest(e.target.checked)}
                />
                <label htmlFor="skip-test">
                  Skip key testing (not recommended)
                </label>
              </div>
              <small className="help-text">
                Testing helps determine if your key is free tier or paid, and checks credit balance.
              </small>
            </div>
          )}

          {keyTestResult && apiProvider === 'openai' && (
            <div className="key-test-result">
              <h4>Key Test Result:</h4>
              <div className={`test-result ${keyTestResult.success ? 'success' : 'error'}`}>
                {keyTestResult.success ? '✅ Valid Key' : '❌ Invalid Key'}
                {keyTestResult.success && (
                  <div className="test-details">
                    <div><strong>Type:</strong> {keyTestResult.key_type || 'unknown'}</div>
                    <div><strong>Credit Balance:</strong> ${keyTestResult.credit_balance || '0.00'}</div>
                    <div><strong>Can Chat:</strong> {keyTestResult.can_chat ? 'Yes' : 'No'}</div>
                  </div>
                )}
              </div>
            </div>
          )}
          
          <div className="button-group">
            <button 
              className="btn-secondary"
              onClick={testCurrentKey}
              disabled={!apiKey.trim() || testingKey}
            >
              {testingKey ? 'Testing...' : 'Test Key'}
            </button>
            
            <button 
              className="btn-primary"
              onClick={saveApiKey}
              disabled={!apiKey.trim()}
            >
              {apiProvider === 'groq' ? 'Save FREE Groq Key' : 'Save OpenAI Key'}
            </button>
            
            {apiProvider === 'groq' && (
              <button 
                className="btn-secondary"
                onClick={requestGroqSetup}
              >
                Get Groq Setup Instructions
              </button>
            )}
          </div>

          <div className="api-key-status">
            <h3>Current Configuration</h3>
            <div className="status-item">
              <span>Has API Key:</span>
              <span className={profile?.has_api_key ? "status-good" : "status-bad"}>
                {profile?.has_api_key ? "✅ Yes" : "❌ No"}
              </span>
            </div>
            <div className="status-item">
              <span>Current Provider:</span>
              <span>
                {profile?.preferred_provider === 'groq' ? 'Groq (FREE)' : 
                 profile?.preferred_provider === 'openai' ? 'OpenAI' : 'Not set'}
              </span>
            </div>
            {profile?.openai_key_type && (
              <div className="status-item">
                <span>OpenAI Account:</span>
                <span className={profile.openai_key_type === 'free_tier' ? "status-warning" : "status-good"}>
                  {profile.openai_key_type === 'free_tier' ? 'Free Tier' : 'Paid Account'}
                  {profile.openai_key_credit_balance > 0 && (
                    <span> (${profile.openai_key_credit_balance.toFixed(2)})</span>
                  )}
                </span>
              </div>
            )}
            {profile?.provider_info?.free_tokens && (
              <div className="status-item">
                <span>Free Limit:</span>
                <span className="status-good">🔥 {profile.provider_info.free_tokens}</span>
              </div>
            )}
          </div>
        </div>

        {/* Subscription Management Card */}
        <div className="profile-card">
          <h2>💰 Platform Subscription</h2>
          <p className="card-description">
            Upgrade for premium features (PDF analysis, data analysis, etc.)
          </p>
          
          {subscription && (
            <div className="current-plan">
              <h3>Current Platform Plan</h3>
              <div className="plan-card">
                <div className="plan-header">
                  <h4>{subscription.name}</h4>
                  <span className="plan-price">{subscription.monthly_price_display}</span>
                </div>
                <div className="plan-features">
                  {subscription.features.map((feature, idx) => (
                    <div key={idx} className="feature">✓ {feature}</div>
                  ))}
                </div>
                {profile?.subscription_status === 'active' && subscription.monthly_price > 0 && (
                  <button 
                    className="btn-cancel"
                    onClick={cancelSubscription}
                  >
                    Cancel Platform Subscription
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="upgrade-options">
            <h3>Upgrade Platform Features</h3>
             
            <div className="plan-options">
               
              
              <div className="plan-option popular">
                <div className="popular-badge">MOST POPULAR</div>
                <h4>Premium Platform</h4>
                <div className="price">$19.99/month</div>
                <div className="features">
                  <div>✓ 1000 requests/day</div>
                  <div>✓ PDF analysis (5/month)</div>
                  <div>✓ Data analysis tools</div>
                  <div>✓ Priority support</div>
                </div>
                <button 
                  className="btn-upgrade"
                  onClick={() => createCheckout('premium')}
                  disabled={profile?.subscription_tier === 'premium'}
                >
                  {profile?.subscription_tier === 'premium' ? 'Current Plan' : 'Upgrade to Premium'}
                </button>
              </div>
            </div>
          </div>
        </div>

      {/* Usage Statistics Card - Updated Elegant Version */}
<div className="profile-card usage-statistics">
  <div className="usage-header">
    <h2>📊 Usage Overview</h2>
    <div className="usage-status-badge">
      {profile?.has_api_key ? (
        <span className="status-active">✅ Active</span>
      ) : (
        <span className="status-inactive">❌ No API Key</span>
      )}
    </div>
  </div>
  
  <div className="usage-grid">
    {/* Provider Info */}
    <div className="usage-card provider-info">
      <div className="usage-icon">🤖</div>
      <div className="usage-content">
        <div className="usage-label">AI Provider</div>
        <div className="usage-value">
          {profile?.provider_info?.name || 'Not set'}
          {profile?.provider_info?.is_free && (
            <span className="free-badge">FREE</span>
          )}
        </div>
        <div className="usage-subtext">
          {profile?.provider_info?.free_tokens || 'Pay-as-you-go'}
        </div>
      </div>
    </div>
    
    {/* Daily Usage */}
    <div className="usage-card daily-usage">
      <div className="usage-icon">📅</div>
      <div className="usage-content">
        <div className="usage-label">Today's Requests</div>
        <div className="usage-value">
          {profile?.usage?.requests_today || 0}
          <span className="usage-limit"> / {profile?.usage?.daily_limit || 50}</span>
        </div>
        <div className="usage-progress">
          <div 
            className="progress-bar"
            style={{ 
              width: `${Math.min(100, ((profile?.usage?.requests_today || 0) / (profile?.usage?.daily_limit || 50)) * 100)}%` 
            }}
          ></div>
        </div>
      </div>
    </div>
    
    {/* Token Usage */}
    <div className="usage-card token-usage">
      <div className="usage-icon">🔢</div>
      <div className="usage-content">
        <div className="usage-label">Tokens (Month)</div>
        <div className="usage-value">
          {(profile?.usage?.tokens_this_month || 0).toLocaleString()}
        </div>
        <div className="usage-subtext">
          Resets on 1st of month
        </div>
      </div>
    </div>
    
    {/* Account Type */}
    <div className="usage-card account-type">
      <div className="usage-icon">👤</div>
      <div className="usage-content">
        <div className="usage-label">Account Type</div>
        <div className={`usage-value ${profile?.subscription_tier || 'free'}`}>
          {profile?.subscription_tier === 'premium' ? 'Premium Plan' : 
           profile?.subscription_tier === 'unlimited' ? 'Unlimited Plan' : 'Free Plan'}
        </div>
        {profile?.openai_key_type && (
          <div className="usage-subtext">
            {profile.openai_key_type === 'free_tier' ? 'OpenAI Free Tier' : 'OpenAI Paid'}
            {profile.openai_key_credit_balance > 0 && (
              <span className="credit-balance"> • ${profile.openai_key_credit_balance.toFixed(2)}</span>
            )}
          </div>
        )}
      </div>
    </div>
  </div>
  
  {/* Action Buttons */}
  <div className="usage-actions">
    {!profile?.has_api_key && (
      <button 
        className="btn-primary" 
        onClick={() => document.getElementById('api-settings')?.scrollIntoView({ behavior: 'smooth' })}
      >
        🔑 Set Up API Key
      </button>
    )}
    {profile?.usage?.daily_limit && profile?.usage?.requests_today >= profile?.usage?.daily_limit * 0.8 && (
      <button 
        className="btn-secondary" 
        onClick={() => navigate('/plans')}
      >
        ⭐ Upgrade Plan
      </button>
    )}
 </div>
          <div className="provider-limits">
            <h3>Your AI Provider Limits</h3>
            {profile?.provider_info?.free_tokens ? (
              <div className="free-tier-info">
                <div className="free-tier-badge">🔥 FREE TIER</div>
                <div className="free-tier-details">
                  <strong>{profile.provider_info.free_tokens}</strong>
                  <p>Resets monthly • No credit card required</p>
                </div>
              </div>
            ) : (
              <div className="paid-tier-info">
                <div className="paid-tier-badge">💰 PAID TIER</div>
                <div className="paid-tier-details">
                  <strong>Pay-as-you-go</strong>
                  <p>You pay {profile?.provider_info?.name} directly for tokens</p>
                  {profile?.openai_key_type === 'free_tier' && (
                    <p className="free-tier-note">
                      ⚠️ Free tier: Limited to GPT-3.5 models only
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="business-model-note">
        <h3>🚀 How It Works</h3>
        <div className="model-description">
          <div className="model-step">
            <h4>1️⃣ Choose Your AI Provider</h4>
            <ul>
              <li><strong>Groq:</strong> FREE 5M tokens/month - recommended!</li>
              <li><strong>OpenAI Free Tier:</strong> Limited GPT-3.5 access</li>
              <li><strong>OpenAI Paid:</strong> GPT-3.5 Turbo models</li>
            </ul>
          </div>
          <div className="model-step">
            <h4>2️⃣ Use Our Platform</h4>
            <ul>
              <li>✅ <strong>Chat with AI models</strong> you have access to</li>
              <li>✅ <strong>We provide request limits</strong> based on your plan</li>
              <li>✅ <strong>You pay AI providers directly</strong></li>
              <li>✅ <strong>Free tier available</strong> with Groq</li>
            </ul>
          </div>
          <div className="model-step">
            <h4>3️⃣ Optional Premium Features</h4>
            <ul>
              <li>📄 <strong>PDF analysis tools</strong> (Premium plan)</li>
              <li>📊 <strong>Data analysis features</strong> (Premium plan)</li>
              <li>🎯 <strong>Advanced study tools</strong></li>
              <li>🔧 <strong>Priority support</strong></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}