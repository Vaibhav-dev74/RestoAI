import React from 'react';

export default function DynamicPricing({ restaurantId }) {
  return (
    <div style={{ padding: '30px', backgroundColor: 'white', borderRadius: '10px', border: '1px solid #dee2e6' }}>
      <h2>💹 AI-Driven Dynamic Pricing & Demand Forecasting</h2>
      <p>This section will show demand forecasts and suggest optimal menu prices using AI.</p>
      <p><b>Restaurant ID:</b> {restaurantId}</p>
      {/* Feature UI will be implemented here */}
    </div>
  );
} 