import React, { useEffect, useRef, useState } from 'react';

const NythMorphingLogo = ({ 
  width = 400, 
  height = 300, 
  animationSpeed = 0.02,
  particleCount = 30,
  showParticles = true,
  showWaves = true,
  primaryColor = '#00ffcc',
  secondaryColor = '#ff00ff',
  backgroundColor = '#0a0a0a'
}) => {
  const svgRef = useRef(null);
  const animationRef = useRef(null);
  const [time, setTime] = useState(0);
  
  // Génération du path de morphing
  const generateMorphPath = (t) => {
    const points = [];
    const numPoints = 100;
    
    for (let i = 0; i < numPoints; i++) {
      const theta = (i / numPoints) * Math.PI * 2;
      const morph1 = Math.sin(t * 2) * 0.3;
      const morph2 = Math.cos(t * 3) * 0.2;
      const morph3 = Math.sin(t * 1.5) * 0.4;
      
      const r = 100 + 
        morph1 * 30 * Math.sin(4 * theta + t) +
        morph2 * 20 * Math.cos(6 * theta - t * 2) +
        morph3 * 25 * Math.sin(8 * theta + t * 3);
      
      const x = width / 2 + r * Math.cos(theta);
      const y = height / 2 + r * Math.sin(theta);
      
      points.push(`${i === 0 ? 'M' : 'L'} ${x} ${y}`);
    }
    
    return points.join(' ') + ' Z';
  };
  
  // Génération des particules
  const generateParticles = () => {
    const particles = [];
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        id: i,
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 3 + 1,
        speedX: (Math.random() - 0.5) * 0.5,
        speedY: (Math.random() - 0.5) * 0.5,
        phase: Math.random() * Math.PI * 2
      });
    }
    return particles;
  };
  
  const [particles] = useState(generateParticles);
  
  // Animation loop
  useEffect(() => {
    const animate = () => {
      setTime(prevTime => prevTime + animationSpeed);
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [animationSpeed]);
  
  // Mise à jour des positions des particules
  const updateParticle = (particle) => {
    let newX = particle.x + particle.speedX;
    let newY = particle.y + particle.speedY;
    
    // Rebond sur les bords
    if (newX < 0 || newX > width) {
      particle.speedX *= -1;
      newX = particle.x + particle.speedX;
    }
    if (newY < 0 || newY > height) {
      particle.speedY *= -1;
      newY = particle.y + particle.speedY;
    }
    
    particle.x = newX;
    particle.y = newY;
    
    return particle;
  };
  
  // Calcul de la couleur dynamique
  const getDynamicColor = (offset = 0) => {
    const hue = ((time * 50 + offset * 360) % 360);
    return `hsl(${hue}, 80%, 60%)`;
  };
  
  // Style pour le Y avec emphase
  const getYStyle = () => {
    const scale = 1 + Math.sin(time * 4) * 0.2;
    const rotation = Math.sin(time * 2) * 5;
    const glow = 10 + Math.abs(Math.sin(time * 3)) * 20;
    
    return {
      transform: `scale(${scale}) rotate(${rotation}deg)`,
      filter: `drop-shadow(0 0 ${glow}px ${secondaryColor})`,
      transformOrigin: 'center'
    };
  };
  
  return (
    <div style={{ 
      width: '100%', 
      height: '100%', 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center',
      backgroundColor,
      position: 'relative',
      overflow: 'hidden',
      borderRadius: '20px'
    }}>
      <svg
        ref={svgRef}
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{ position: 'absolute' }}
      >
        {/* Définition des gradients */}
        <defs>
          <linearGradient id="morphGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={primaryColor} stopOpacity="0.8">
              <animate attributeName="stop-color" 
                values={`${primaryColor};${secondaryColor};${primaryColor}`} 
                dur="5s" 
                repeatCount="indefinite" />
            </stop>
            <stop offset="100%" stopColor={secondaryColor} stopOpacity="0.8">
              <animate attributeName="stop-color" 
                values={`${secondaryColor};${primaryColor};${secondaryColor}`} 
                dur="5s" 
                repeatCount="indefinite" />
            </stop>
          </linearGradient>
          
          <filter id="glow">
            <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          
          <filter id="yGlow">
            <feGaussianBlur stdDeviation="6" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        {/* Particules en arrière-plan */}
        {showParticles && particles.map(particle => {
          const updated = updateParticle(particle);
          const opacity = 0.3 + Math.sin(time * 2 + particle.phase) * 0.2;
          
          return (
            <circle
              key={particle.id}
              cx={updated.x}
              cy={updated.y}
              r={particle.size}
              fill={getDynamicColor(particle.id * 0.1)}
              opacity={opacity}
            />
          );
        })}
        
        {/* Ondes circulaires */}
        {showWaves && [0, 1, 2].map(i => {
          const radius = ((time * 30 + i * 40) % 150);
          const opacity = Math.max(0, 1 - radius / 150) * 0.3;
          
          return (
            <circle
              key={`wave-${i}`}
              cx={width / 2}
              cy={height / 2}
              r={radius}
              fill="none"
              stroke={getDynamicColor(i * 0.3)}
              strokeWidth="2"
              opacity={opacity}
            />
          );
        })}
        
        {/* Forme morphing principale */}
        <path
          d={generateMorphPath(time)}
          fill="url(#morphGradient)"
          fillOpacity="0.2"
          stroke="url(#morphGradient)"
          strokeWidth="2"
          filter="url(#glow)"
        />
        
        {/* Forme morphing secondaire décalée */}
        <path
          d={generateMorphPath(time + 0.5)}
          fill="none"
          stroke={secondaryColor}
          strokeWidth="1"
          opacity="0.5"
          strokeDasharray="5,5"
        />
        
        {/* Texte NYTH avec emphase sur Y */}
        <g transform={`translate(${width/2}, ${height/2})`}>
          {/* N */}
          <text
            x="-120"
            y="10"
            fontSize="48"
            fontWeight="bold"
            fill={primaryColor}
            filter="url(#glow)"
            style={{
              animation: 'pulse 3s ease-in-out infinite',
              fontFamily: 'Arial Black, sans-serif'
            }}
          >
            N
          </text>
          
          {/* Y avec effets spéciaux */}
          <g style={getYStyle()}>
            {/* Halos multiples pour Y */}
            {[30, 20, 10].map((offset, index) => (
              <text
                key={`halo-${index}`}
                x="-40"
                y="10"
                fontSize={48 + offset}
                fontWeight="bold"
                fill={secondaryColor}
                opacity={0.2 - index * 0.05}
                style={{ fontFamily: 'Arial Black, sans-serif' }}
              >
                Y
              </text>
            ))}
            
            {/* Y principal */}
            <text
              x="-40"
              y="10"
              fontSize="48"
              fontWeight="bold"
              fill={secondaryColor}
              filter="url(#yGlow)"
              style={{
                fontFamily: 'Arial Black, sans-serif',
                textShadow: `0 0 20px ${secondaryColor}`
              }}
            >
              Y
            </text>
          </g>
          
          {/* T */}
          <text
            x="40"
            y="10"
            fontSize="48"
            fontWeight="bold"
            fill={primaryColor}
            filter="url(#glow)"
            style={{
              animation: 'pulse 3s ease-in-out infinite',
              animationDelay: '0.5s',
              fontFamily: 'Arial Black, sans-serif'
            }}
          >
            T
          </text>
          
          {/* H */}
          <text
            x="100"
            y="10"
            fontSize="48"
            fontWeight="bold"
            fill={primaryColor}
            filter="url(#glow)"
            style={{
              animation: 'pulse 3s ease-in-out infinite',
              animationDelay: '1s',
              fontFamily: 'Arial Black, sans-serif'
            }}
          >
            H
          </text>
        </g>
        
        {/* Lignes de connexion animées */}
        {[0, 60, 120, 180, 240, 300].map(angle => {
          const lineLength = 50 + Math.sin(time * 3 + angle * 0.02) * 20;
          const x1 = width / 2;
          const y1 = height / 2;
          const x2 = x1 + Math.cos(angle * Math.PI / 180 + time) * lineLength;
          const y2 = y1 + Math.sin(angle * Math.PI / 180 + time) * lineLength;
          
          return (
            <line
              key={`line-${angle}`}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={getDynamicColor(angle / 60)}
              strokeWidth="1"
              opacity="0.3"
            />
          );
        })}
      </svg>
      
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.05); }
        }
      `}</style>
    </div>
  );
};

// Composant wrapper avec contrôles
const NythLogoApp = () => {
  const [config, setConfig] = useState({
    showParticles: true,
    showWaves: true,
    animationSpeed: 0.02,
    primaryColor: '#00ffcc',
    secondaryColor: '#ff00ff'
  });
  
  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      backgroundColor: '#0a0a0a',
      color: 'white',
      fontFamily: 'Arial, sans-serif'
    }}>
      {/* Panneau de contrôle */}
      <div style={{ 
        padding: '20px', 
        borderBottom: '1px solid #333',
        display: 'flex',
        gap: '20px',
        alignItems: 'center',
        flexWrap: 'wrap',
        backgroundColor: 'rgba(0,0,0,0.5)'
      }}>
        <h2 style={{ margin: 0, color: '#00ffcc' }}>NYTH Logo Morphing</h2>
        
        <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <input
            type="checkbox"
            checked={config.showParticles}
            onChange={(e) => setConfig({...config, showParticles: e.target.checked})}
          />
          Particules
        </label>
        
        <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <input
            type="checkbox"
            checked={config.showWaves}
            onChange={(e) => setConfig({...config, showWaves: e.target.checked})}
          />
          Ondes
        </label>
        
        <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          Vitesse:
          <input
            type="range"
            min="0.005"
            max="0.05"
            step="0.005"
            value={config.animationSpeed}
            onChange={(e) => setConfig({...config, animationSpeed: parseFloat(e.target.value)})}
          />
        </label>
        
        <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          Couleur 1:
          <input
            type="color"
            value={config.primaryColor}
            onChange={(e) => setConfig({...config, primaryColor: e.target.value})}
          />
        </label>
        
        <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          Couleur Y:
          <input
            type="color"
            value={config.secondaryColor}
            onChange={(e) => setConfig({...config, secondaryColor: e.target.value})}
          />
        </label>
      </div>
      
      {/* Zone du logo */}
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        padding: '20px'
      }}>
        <NythMorphingLogo
          width={600}
          height={400}
          {...config}
        />
      </div>
    </div>
  );
};

export default NythLogoApp;