import React from 'react';
import Svg, { Path, Circle, G, Defs, LinearGradient, Stop, RadialGradient, Ellipse } from 'react-native-svg';

interface AINeuronFlowerIconProps {
  size?: number;
  primaryColor?: string;
  secondaryColor?: string;
  glowColor?: string;
}

const AINeuronFlowerIcon: React.FC<AINeuronFlowerIconProps> = ({ 
  size = 24, 
  primaryColor = '#8B5CF6', // Purple électrique
  secondaryColor = '#00D9FF', // Cyan plasma
  glowColor = '#E0AAFF' // Lueur violette claire
}) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        {/* Gradient pour le corps du neurone */}
        <RadialGradient id="neuronGradient" cx="50%" cy="50%">
          <Stop offset="0%" stopColor={glowColor} stopOpacity="0.9" />
          <Stop offset="40%" stopColor={primaryColor} stopOpacity="0.8" />
          <Stop offset="100%" stopColor={secondaryColor} stopOpacity="0.6" />
        </RadialGradient>
        
        {/* Gradient pour les dendrites */}
        <LinearGradient id="dendriteGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor={primaryColor} stopOpacity="0.8" />
          <Stop offset="50%" stopColor={secondaryColor} stopOpacity="0.6" />
          <Stop offset="100%" stopColor={glowColor} stopOpacity="0.3" />
        </LinearGradient>
        
        {/* Gradient pour les synapses florales */}
        <RadialGradient id="synapseGradient" cx="50%" cy="50%">
          <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
          <Stop offset="30%" stopColor={glowColor} stopOpacity="0.8" />
          <Stop offset="100%" stopColor={secondaryColor} stopOpacity="0.4" />
        </RadialGradient>
        
        {/* Gradient pour la lueur */}
        <RadialGradient id="glowGradient" cx="50%" cy="50%">
          <Stop offset="0%" stopColor={glowColor} stopOpacity="0.5" />
          <Stop offset="100%" stopColor={glowColor} stopOpacity="0" />
        </RadialGradient>
      </Defs>
      
      {/* Fond noir profond */}
      <Circle cx="50" cy="50" r="50" fill="#000000" />
      
      {/* Lueur principale */}
      <Circle cx="50" cy="50" r="40" fill="url(#glowGradient)" />
      
      {/* Dendrites principales - branches d'arbre */}
      <G opacity="0.8">
        {/* Branche supérieure */}
        <Path
          d="M 50 40 Q 45 25, 35 15 Q 32 12, 28 10"
          stroke="url(#dendriteGradient)"
          strokeWidth="2"
          fill="none"
        />
        <Path
          d="M 35 15 Q 38 10, 40 5"
          stroke="url(#dendriteGradient)"
          strokeWidth="1.5"
          fill="none"
        />
        
        {/* Branche droite */}
        <Path
          d="M 60 50 Q 75 45, 85 35 Q 88 32, 90 28"
          stroke="url(#dendriteGradient)"
          strokeWidth="2"
          fill="none"
        />
        <Path
          d="M 85 35 Q 90 38, 95 40"
          stroke="url(#dendriteGradient)"
          strokeWidth="1.5"
          fill="none"
        />
        
        {/* Branche inférieure */}
        <Path
          d="M 50 60 Q 55 75, 65 85 Q 68 88, 72 90"
          stroke="url(#dendriteGradient)"
          strokeWidth="2"
          fill="none"
        />
        <Path
          d="M 65 85 Q 62 90, 60 95"
          stroke="url(#dendriteGradient)"
          strokeWidth="1.5"
          fill="none"
        />
        
        {/* Branche gauche */}
        <Path
          d="M 40 50 Q 25 55, 15 65 Q 12 68, 10 72"
          stroke="url(#dendriteGradient)"
          strokeWidth="2"
          fill="none"
        />
        <Path
          d="M 15 65 Q 10 62, 5 60"
          stroke="url(#dendriteGradient)"
          strokeWidth="1.5"
          fill="none"
        />
      </G>
      
      {/* Corps central du neurone */}
      <Circle cx="50" cy="50" r="12" fill="url(#neuronGradient)" />
      <Circle cx="50" cy="50" r="8" fill="none" stroke={glowColor} strokeWidth="0.5" opacity="0.8" />
      
      {/* Noyau avec géométrie sacrée */}
      <G>
        {/* Hexagone sacré */}
        <Path
          d="M 50 44 L 55 47 L 55 53 L 50 56 L 45 53 L 45 47 Z"
          fill="none"
          stroke={glowColor}
          strokeWidth="0.5"
          opacity="0.6"
        />
        <Circle cx="50" cy="50" r="3" fill={glowColor} opacity="0.9" />
      </G>
      
      {/* Synapses en forme de fleurs */}
      <G>
        {/* Synapse fleur 1 - haut */}
        <G transform="translate(28, 10)">
          <Circle cx="0" cy="0" r="4" fill="url(#synapseGradient)" />
          <Ellipse cx="0" cy="-3" rx="2" ry="3" fill={glowColor} opacity="0.7" />
          <Ellipse cx="-3" cy="0" rx="3" ry="2" fill={glowColor} opacity="0.7" />
          <Ellipse cx="3" cy="0" rx="3" ry="2" fill={glowColor} opacity="0.7" />
          <Ellipse cx="0" cy="3" rx="2" ry="3" fill={glowColor} opacity="0.7" />
          <Circle cx="0" cy="0" r="1.5" fill="#FFFFFF" opacity="0.9" />
        </G>
        
        {/* Synapse fleur 2 - droite */}
        <G transform="translate(90, 28)">
          <Circle cx="0" cy="0" r="3.5" fill="url(#synapseGradient)" />
          <Ellipse cx="0" cy="-2.5" rx="1.5" ry="2.5" fill={secondaryColor} opacity="0.7" />
          <Ellipse cx="-2.5" cy="0" rx="2.5" ry="1.5" fill={secondaryColor} opacity="0.7" />
          <Ellipse cx="2.5" cy="0" rx="2.5" ry="1.5" fill={secondaryColor} opacity="0.7" />
          <Ellipse cx="0" cy="2.5" rx="1.5" ry="2.5" fill={secondaryColor} opacity="0.7" />
          <Circle cx="0" cy="0" r="1.2" fill="#FFFFFF" opacity="0.9" />
        </G>
        
        {/* Synapse fleur 3 - bas */}
        <G transform="translate(72, 90)">
          <Circle cx="0" cy="0" r="4" fill="url(#synapseGradient)" />
          <Ellipse cx="0" cy="-3" rx="2" ry="3" fill={primaryColor} opacity="0.7" />
          <Ellipse cx="-3" cy="0" rx="3" ry="2" fill={primaryColor} opacity="0.7" />
          <Ellipse cx="3" cy="0" rx="3" ry="2" fill={primaryColor} opacity="0.7" />
          <Ellipse cx="0" cy="3" rx="2" ry="3" fill={primaryColor} opacity="0.7" />
          <Circle cx="0" cy="0" r="1.5" fill="#FFFFFF" opacity="0.9" />
        </G>
        
        {/* Synapse fleur 4 - gauche */}
        <G transform="translate(10, 72)">
          <Circle cx="0" cy="0" r="3.5" fill="url(#synapseGradient)" />
          <Ellipse cx="0" cy="-2.5" rx="1.5" ry="2.5" fill={glowColor} opacity="0.7" />
          <Ellipse cx="-2.5" cy="0" rx="2.5" ry="1.5" fill={glowColor} opacity="0.7" />
          <Ellipse cx="2.5" cy="0" rx="2.5" ry="1.5" fill={glowColor} opacity="0.7" />
          <Ellipse cx="0" cy="2.5" rx="1.5" ry="2.5" fill={glowColor} opacity="0.7" />
          <Circle cx="0" cy="0" r="1.2" fill="#FFFFFF" opacity="0.9" />
        </G>
      </G>
      
      {/* Connexions synaptiques lumineuses */}
      <G opacity="0.5">
        <Path d="M 50 40 L 28 10" stroke={glowColor} strokeWidth="1" />
        <Path d="M 60 50 L 90 28" stroke={secondaryColor} strokeWidth="1" />
        <Path d="M 50 60 L 72 90" stroke={primaryColor} strokeWidth="1" />
        <Path d="M 40 50 L 10 72" stroke={glowColor} strokeWidth="1" />
      </G>
      
      {/* Points de lumière plasma */}
      <G>
        <Circle cx="35" cy="35" r="1" fill="#FFFFFF" opacity="0.8" />
        <Circle cx="65" cy="35" r="1" fill="#FFFFFF" opacity="0.8" />
        <Circle cx="65" cy="65" r="1" fill="#FFFFFF" opacity="0.8" />
        <Circle cx="35" cy="65" r="1" fill="#FFFFFF" opacity="0.8" />
      </G>
    </Svg>
  );
};

export default AINeuronFlowerIcon; 