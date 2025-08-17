import React from 'react';
import Svg, { Path, Circle, G } from 'react-native-svg';

interface AIMinimalBrainIconProps {
  size?: number;
  color?: string;
}

const AIMinimalBrainIcon: React.FC<AIMinimalBrainIconProps> = ({ 
  size = 24, 
  color = '#000000'
}) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <G>
        {/* Contour principal du cerveau */}
        <Path
          d="M 50 20 
             C 35 20, 25 30, 25 40
             C 25 45, 27 48, 30 50
             C 28 52, 27 55, 27 58
             C 27 65, 32 70, 38 70
             C 40 70, 42 69.5, 44 69
             C 46 72, 48 73, 50 73
             C 52 73, 54 72, 56 69
             C 58 69.5, 60 70, 62 70
             C 68 70, 73 65, 73 58
             C 73 55, 72 52, 70 50
             C 73 48, 75 45, 75 40
             C 75 30, 65 20, 50 20 Z"
          stroke={color}
          strokeWidth="2"
          fill="none"
        />
        
        {/* Ligne centrale du cerveau */}
        <Path
          d="M 50 20 L 50 73"
          stroke={color}
          strokeWidth="2"
          fill="none"
        />
        
        {/* Connexions neurales - côté gauche */}
        <Path
          d="M 35 35 Q 40 38, 45 35"
          stroke={color}
          strokeWidth="1.5"
          fill="none"
        />
        <Path
          d="M 32 45 Q 38 48, 44 45"
          stroke={color}
          strokeWidth="1.5"
          fill="none"
        />
        <Path
          d="M 35 55 Q 40 58, 45 55"
          stroke={color}
          strokeWidth="1.5"
          fill="none"
        />
        
        {/* Connexions neurales - côté droit */}
        <Path
          d="M 55 35 Q 60 38, 65 35"
          stroke={color}
          strokeWidth="1.5"
          fill="none"
        />
        <Path
          d="M 56 45 Q 62 48, 68 45"
          stroke={color}
          strokeWidth="1.5"
          fill="none"
        />
        <Path
          d="M 55 55 Q 60 58, 65 55"
          stroke={color}
          strokeWidth="1.5"
          fill="none"
        />
        
        {/* Points de connexion (nœuds) */}
        <Circle cx="35" cy="35" r="2" fill={color} />
        <Circle cx="45" cy="35" r="2" fill={color} />
        <Circle cx="55" cy="35" r="2" fill={color} />
        <Circle cx="65" cy="35" r="2" fill={color} />
        
        <Circle cx="32" cy="45" r="2" fill={color} />
        <Circle cx="44" cy="45" r="2" fill={color} />
        <Circle cx="56" cy="45" r="2" fill={color} />
        <Circle cx="68" cy="45" r="2" fill={color} />
        
        <Circle cx="35" cy="55" r="2" fill={color} />
        <Circle cx="45" cy="55" r="2" fill={color} />
        <Circle cx="55" cy="55" r="2" fill={color} />
        <Circle cx="65" cy="55" r="2" fill={color} />
        
        {/* Circuit digital en bas */}
        <Path
          d="M 40 70 L 40 78 L 45 78"
          stroke={color}
          strokeWidth="1.5"
          fill="none"
        />
        <Path
          d="M 60 70 L 60 78 L 55 78"
          stroke={color}
          strokeWidth="1.5"
          fill="none"
        />
        <Path
          d="M 45 78 L 55 78"
          stroke={color}
          strokeWidth="1.5"
          fill="none"
        />
        
        {/* Points de connexion digitale */}
        <Circle cx="40" cy="78" r="1.5" fill={color} />
        <Circle cx="50" cy="78" r="1.5" fill={color} />
        <Circle cx="60" cy="78" r="1.5" fill={color} />
      </G>
    </Svg>
  );
};

export default AIMinimalBrainIcon; 