import React from 'react';
import { Player } from '@lottiefiles/react-lottie-player';
import loaderAnimation from '../assets/premium-loader.json';
import './PremiumLoader.css';

const PremiumLoader = ({ visible = true, text = 'Loading...' }) => {
  if (!visible) return null;
  return (
    <div className="premium-loader-overlay">
      <div className="premium-loader-content">
        <Player
          autoplay
          loop
          src={loaderAnimation}
          style={{ height: 180, width: 180 }}
        />
        <div className="premium-loader-text">{text}</div>
      </div>
    </div>
  );
};

export default PremiumLoader; 