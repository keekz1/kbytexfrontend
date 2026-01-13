// Create UpgradeModal.jsx
import { useState } from "react";
import "./UpgradeModal.css";

function UpgradeModal({ isOpen, onClose, upgradeData }) {
  if (!isOpen) return null;
  
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="close-btn" onClick={onClose}>✕</button>
        
        <h2>🎯 Upgrade Your Plan</h2>
        
        <div className="current-usage">
          <p>You've used <strong>{upgradeData.current_usage || 0}</strong> out of <strong>{upgradeData.daily_limit || 50}</strong> messages today.</p>
        </div>
        
        <div className="plans-grid">
          {upgradeData.plans?.map((plan, index) => (
            <div 
              key={index} 
              className={`plan-card ${plan.current_plan ? 'current-plan' : ''}`}
            >
              <h3>{plan.name}</h3>
              <div className="price">
                {plan.monthly_price === 0 ? 'FREE' : `$${plan.monthly_price}/month`}
              </div>
              <div className="limit">{plan.daily_limit} messages/day</div>
              
              {plan.features && (
                <ul className="features">
                  {plan.features.map((feature, i) => (
                    <li key={i}>✓ {feature}</li>
                  ))}
                </ul>
              )}
              
              <button 
                className={`upgrade-btn ${plan.current_plan ? 'current' : ''}`}
                onClick={() => {
                  if (!plan.current_plan) {
                    // Handle upgrade logic
                    alert(`Upgrading to ${plan.name}...`);
                    // Redirect to payment page or show Stripe
                  }
                }}
              >
                {plan.current_plan ? 'Current Plan' : 'Upgrade Now'}
              </button>
            </div>
          ))}
        </div>
        
        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose}>
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
}

export default UpgradeModal;