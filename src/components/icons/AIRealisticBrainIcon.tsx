import React from 'react';
import Svg, { Path, Circle, G, Defs, LinearGradient, Stop, RadialGradient } from 'react-native-svg';

interface AIRealisticBrainIconProps {
  size?: number;
  color?: string;
  shadowColor?: string;
}

const AIRealisticBrainIcon: React.FC<AIRealisticBrainIconProps> = ({ 
  size = 24, 
  color = '#E8B4CB', // Rose cerveau
  shadowColor = '#B8860B' // Ombre dorée
}) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        {/* Gradient principal du cerveau */}
        <LinearGradient id="brainGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#F5C2C7" stopOpacity="1" />
          <Stop offset="50%" stopColor={color} stopOpacity="1" />
          <Stop offset="100%" stopColor="#D4A5B8" stopOpacity="1" />
        </LinearGradient>
        
        {/* Gradient pour les ombres */}
        <LinearGradient id="shadowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor={shadowColor} stopOpacity="0.3" />
          <Stop offset="100%" stopColor={shadowColor} stopOpacity="0.1" />
        </LinearGradient>
        
        {/* Gradient pour les circonvolutions */}
        <LinearGradient id="gyrusGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#C8A2C8" stopOpacity="0.8" />
          <Stop offset="100%" stopColor="#B8860B" stopOpacity="0.4" />
        </LinearGradient>
      </Defs>
      
      {/* Contour principal du cerveau */}
      <Path
        d="M 50 15
           C 35 15, 20 25, 18 40
           C 17 45, 18 50, 20 55
           C 18 60, 19 65, 22 68
           C 20 72, 22 76, 25 78
           C 28 82, 35 85, 42 85
           C 45 87, 48 87, 50 87
           C 52 87, 55 87, 58 85
           C 65 85, 72 82, 75 78
           C 78 76, 80 72, 78 68
           C 81 65, 82 60, 80 55
           C 82 50, 83 45, 82 40
           C 80 25, 65 15, 50 15 Z"
        fill="url(#brainGradient)"
        stroke="#B8860B"
        strokeWidth="1"
      />
      
      {/* Fissure longitudinale (séparation hémisphères) */}
      <Path
        d="M 50 15 
           Q 50 25, 50 35
           Q 50 45, 50 55
           Q 50 65, 50 75
           Q 50 80, 50 85"
        stroke="#A0522D"
        strokeWidth="2"
        fill="none"
      />
      
      {/* Hémisphère gauche - Circonvolutions */}
      <G>
        {/* Lobe frontal gauche */}
        <Path
          d="M 25 30 Q 35 28, 45 32 Q 40 35, 30 38 Q 25 35, 25 30"
          fill="url(#gyrusGradient)"
          stroke="#A0522D"
          strokeWidth="0.5"
        />
        
        {/* Lobe pariétal gauche */}
        <Path
          d="M 22 45 Q 32 43, 42 47 Q 37 50, 27 53 Q 22 50, 22 45"
          fill="url(#gyrusGradient)"
          stroke="#A0522D"
          strokeWidth="0.5"
        />
        
        {/* Lobe temporal gauche */}
        <Path
          d="M 25 60 Q 35 58, 45 62 Q 40 65, 30 68 Q 25 65, 25 60"
          fill="url(#gyrusGradient)"
          stroke="#A0522D"
          strokeWidth="0.5"
        />
        
        {/* Circonvolutions secondaires gauches */}
        <Path d="M 30 25 Q 40 27, 35 30" stroke="#A0522D" strokeWidth="0.8" fill="none" />
        <Path d="M 28 40 Q 38 42, 33 45" stroke="#A0522D" strokeWidth="0.8" fill="none" />
        <Path d="M 30 55 Q 40 57, 35 60" stroke="#A0522D" strokeWidth="0.8" fill="none" />
        <Path d="M 32 70 Q 42 72, 37 75" stroke="#A0522D" strokeWidth="0.8" fill="none" />
      </G>
      
      {/* Hémisphère droit - Circonvolutions */}
      <G>
        {/* Lobe frontal droit */}
        <Path
          d="M 75 30 Q 65 28, 55 32 Q 60 35, 70 38 Q 75 35, 75 30"
          fill="url(#gyrusGradient)"
          stroke="#A0522D"
          strokeWidth="0.5"
        />
        
        {/* Lobe pariétal droit */}
        <Path
          d="M 78 45 Q 68 43, 58 47 Q 63 50, 73 53 Q 78 50, 78 45"
          fill="url(#gyrusGradient)"
          stroke="#A0522D"
          strokeWidth="0.5"
        />
        
        {/* Lobe temporal droit */}
        <Path
          d="M 75 60 Q 65 58, 55 62 Q 60 65, 70 68 Q 75 65, 75 60"
          fill="url(#gyrusGradient)"
          stroke="#A0522D"
          strokeWidth="0.5"
        />
        
        {/* Circonvolutions secondaires droites */}
        <Path d="M 70 25 Q 60 27, 65 30" stroke="#A0522D" strokeWidth="0.8" fill="none" />
        <Path d="M 72 40 Q 62 42, 67 45" stroke="#A0522D" strokeWidth="0.8" fill="none" />
        <Path d="M 70 55 Q 60 57, 65 60" stroke="#A0522D" strokeWidth="0.8" fill="none" />
        <Path d="M 68 70 Q 58 72, 63 75" stroke="#A0522D" strokeWidth="0.8" fill="none" />
      </G>
      
      {/* Cervelet */}
      <G>
        <Path
          d="M 35 80 
             Q 42 78, 50 78
             Q 58 78, 65 80
             Q 62 85, 50 85
             Q 38 85, 35 80 Z"
          fill="#D4A5B8"
          stroke="#A0522D"
          strokeWidth="1"
        />
        
        {/* Lignes du cervelet */}
        <Path d="M 38 82 Q 50 81, 62 82" stroke="#A0522D" strokeWidth="0.5" fill="none" />
        <Path d="M 40 83.5 Q 50 82.5, 60 83.5" stroke="#A0522D" strokeWidth="0.5" fill="none" />
      </G>
      
      {/* Tronc cérébral */}
      <Path
        d="M 47 85 
           L 47 92
           Q 50 94, 53 92
           L 53 85"
        fill="#C8A2C8"
        stroke="#A0522D"
        strokeWidth="1"
      />
      
      {/* Détails anatomiques supplémentaires */}
      <G opacity="0.6">
        {/* Sillons principaux */}
        <Path d="M 25 35 Q 45 33, 48 35" stroke="#8B4513" strokeWidth="1" fill="none" />
        <Path d="M 52 35 Q 75 33, 75 35" stroke="#8B4513" strokeWidth="1" fill="none" />
        <Path d="M 25 50 Q 45 48, 48 50" stroke="#8B4513" strokeWidth="1" fill="none" />
        <Path d="M 52 50 Q 75 48, 75 50" stroke="#8B4513" strokeWidth="1" fill="none" />
        
        {/* Vascularisation */}
        <Path d="M 30 20 Q 35 25, 40 30" stroke="#CD5C5C" strokeWidth="0.8" fill="none" opacity="0.5" />
        <Path d="M 70 20 Q 65 25, 60 30" stroke="#CD5C5C" strokeWidth="0.8" fill="none" opacity="0.5" />
        <Path d="M 25 45 Q 30 50, 35 55" stroke="#CD5C5C" strokeWidth="0.8" fill="none" opacity="0.5" />
        <Path d="M 75 45 Q 70 50, 65 55" stroke="#CD5C5C" strokeWidth="0.8" fill="none" opacity="0.5" />
      </G>
      
      {/* Reflets pour donner du volume */}
      <G opacity="0.3">
        <Path d="M 30 25 Q 40 23, 45 25" stroke="#FFFFFF" strokeWidth="1.5" fill="none" />
        <Path d="M 55 25 Q 60 23, 70 25" stroke="#FFFFFF" strokeWidth="1.5" fill="none" />
      </G>
    </Svg>
  );
};

export default AIRealisticBrainIcon; 