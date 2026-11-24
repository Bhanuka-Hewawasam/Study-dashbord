import React from 'react';

/**
 * BackgroundClouds
 * A slow, subtle background of soft semi-transparent white SVG clouds
 * drifting gently across the app shell container.
 * Never distracting, fully disabled under prefers-reduced-motion.
 */
export default function BackgroundClouds() {
  return (
    <div className="clouds-drift-container" aria-hidden="true">
      <div className="cloud-layer cloud-layer-1">
        <svg className="cloud-svg" viewBox="0 0 1440 320" fill="none" preserveAspectRatio="none">
          <path
            d="M0,192L48,181.3C96,171,192,149,288,160C384,171,480,213,576,218.7C672,224,768,192,864,165.3C960,139,1056,117,1152,122.7C1248,128,1344,160,1392,176L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
            fill="white"
            fillOpacity="0.32"
          />
        </svg>
      </div>

      <div className="cloud-layer cloud-layer-2">
        <svg className="cloud-svg" viewBox="0 0 1440 320" fill="none" preserveAspectRatio="none">
          <path
            d="M0,96L60,122.7C120,149,240,203,360,208C480,213,600,171,720,165.3C840,160,960,192,1080,186.7C1200,181,1320,139,1380,117.3L1440,96L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z"
            fill="white"
            fillOpacity="0.22"
          />
        </svg>
      </div>
    </div>
  );
}
