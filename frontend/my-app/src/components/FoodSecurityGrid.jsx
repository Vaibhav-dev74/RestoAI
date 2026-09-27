import React from 'react';

export default function FoodSecurityGrid({ restaurantId }) {
  return (
    <div style={{ padding: '30px', backgroundColor: 'white', borderRadius: '10px', border: '1px solid #dee2e6' }}>
      <h2>🌐 Pan-India Food Security & Disaster Response Grid</h2>
      <p>This section will connect you to NGOs, shelters, and food banks for food rescue and disaster response.</p>
      <p><b>Restaurant ID:</b> {restaurantId}</p>
      {/* Feature UI will be implemented here */}
    </div>
  );
} 