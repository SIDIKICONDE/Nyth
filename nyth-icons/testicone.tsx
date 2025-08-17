<svg viewBox="0 0 1000 1200" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Gradient principal -->
    <linearGradient id="primaryBlue" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#4A90E2;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#357ABD;stop-opacity:1" />
    </linearGradient>
    
    <!-- Variations de couleurs -->
    <linearGradient id="darkMode" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1F2937;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#374151;stop-opacity:1" />
    </linearGradient>
    
    <linearGradient id="lightBlue" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#60A5FA;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#3B82F6;stop-opacity:1" />
    </linearGradient>
    
    <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
      <feDropShadow dx="0" dy="8" stdDeviation="16" flood-opacity="0.25"/>
    </filter>
    
    <filter id="innerShadow" x="-50%" y="-50%" width="200%" height="200%">
      <feOffset dx="0" dy="2"/>
      <feGaussianBlur stdDeviation="4" result="offset-blur"/>
      <feFlood flood-color="#000000" flood-opacity="0.1"/>
      <feComposite in2="offset-blur" operator="in"/>
    </filter>
  </defs>
  
  <!-- Titre -->
  <text x="500" y="40" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="#1F2937">NYTH - Logo Final</text>
  <text x="500" y="65" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" fill="#6B7280">Modèle N Moderne - Toutes les versions</text>
  
  <!-- Version principale - Grande taille -->
  <g id="mainVersion">
    <text x="150" y="120" font-family="Arial, sans-serif" font-size="18" font-weight="600" fill="#374151">Version Principale (1024x1024px)</text>
    
    <g transform="translate(50, 140)">
      <rect width="200" height="200" rx="44" fill="url(#primaryBlue)" filter="url(#shadow)"/>
      <!-- Lettre N optimisée -->
      <path d="M50,140 L50,60 L70,60 L70,110 L130,60 L150,60 L150,140 L130,140 L130,90 L70,140 Z" 
            fill="white" opacity="0.95"/>
      <!-- Sous-titre NYTH -->
      <text x="100" y="175" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" font-weight="500" fill="white" opacity="0.8">NYTH</text>
      <!-- Petit accent décoratif -->
      <circle cx="100" cy="185" r="2" fill="white" opacity="0.6"/>
    </g>
    
    <!-- Version ronde Android -->
    <g transform="translate(300, 140)">
      <circle cx="100" cy="100" r="100" fill="url(#primaryBlue)" filter="url(#shadow)"/>
      <circle cx="100" cy="100" r="85" fill="none" stroke="white" stroke-width="2" opacity="0.2"/>
      <path d="M50,140 L50,60 L70,60 L70,110 L130,60 L150,60 L150,140 L130,140 L130,90 L70,140 Z" 
            fill="white" opacity="0.95"/>
      <text x="100" y="175" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" font-weight="500" fill="white" opacity="0.8">NYTH</text>
    </g>
  </g>
  
  <!-- Variations de couleurs -->
  <g id="colorVariations" transform="translate(0, 380)">
    <text x="150" y="40" font-family="Arial, sans-serif" font-size="18" font-weight="600" fill="#374151">Variations de Couleurs</text>
    
    <!-- Mode sombre -->
    <g transform="translate(50, 60)">
      <text x="50" y="-10" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#6B7280">Mode Sombre</text>
      <rect width="100" height="100" rx="22" fill="url(#darkMode)" filter="url(#shadow)"/>
      <path d="M25,70 L25,30 L35,30 L35,55 L65,30 L75,30 L75,70 L65,70 L65,45 L35,70 Z" fill="white" opacity="0.95"/>
      <text x="50" y="90" text-anchor="middle" font-family="Arial, sans-serif" font-size="8" fill="white" opacity="0.7">NYTH</text>
    </g>
    
    <!-- Bleu clair -->
    <g transform="translate(200, 60)">
      <text x="50" y="-10" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#6B7280">Bleu Clair</text>
      <rect width="100" height="100" rx="22" fill="url(#lightBlue)" filter="url(#shadow)"/>
      <path d="M25,70 L25,30 L35,30 L35,55 L65,30 L75,30 L75,70 L65,70 L65,45 L35,70 Z" fill="white" opacity="0.95"/>
      <text x="50" y="90" text-anchor="middle" font-family="Arial, sans-serif" font-size="8" fill="white" opacity="0.7">NYTH</text>
    </g>
    
    <!-- Version monochrome -->
    <g transform="translate(350, 60)">
      <text x="50" y="-10" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#6B7280">Monochrome</text>
      <rect width="100" height="100" rx="22" fill="#1F2937" filter="url(#shadow)"/>
      <path d="M25,70 L25,30 L35,30 L35,55 L65,30 L75,30 L75,70 L65,70 L65,45 L35,70 Z" fill="white" opacity="0.95"/>
      <text x="50" y="90" text-anchor="middle" font-family="Arial, sans-serif" font-size="8" fill="white" opacity="0.7">NYTH</text>
    </g>
    
    <!-- Version blanche (sur fond coloré) -->
    <g transform="translate(500, 60)">
      <text x="50" y="-10" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#6B7280">Fond Coloré</text>
      <rect width="100" height="100" rx="22" fill="white" stroke="#E5E7EB" stroke-width="2" filter="url(#shadow)"/>
      <path d="M25,70 L25,30 L35,30 L35,55 L65,30 L75,30 L75,70 L65,70 L65,45 L35,70 Z" fill="url(#primaryBlue)" opacity="0.95"/>
      <text x="50" y="90" text-anchor="middle" font-family="Arial, sans-serif" font-size="8" fill="url(#primaryBlue)" opacity="0.7">NYTH</text>
    </g>
  </g>
  
  <!-- Logos horizontaux -->
  <g id="horizontalLogos" transform="translate(0, 580)">
    <text x="150" y="40" font-family="Arial, sans-serif" font-size="18" font-weight="600" fill="#374151">Versions Horizontales</text>
    
    <!-- Logo complet -->
    <g transform="translate(50, 70)">
      <text x="200" y="-10" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#6B7280">Logo Complet</text>
      <rect width="400" height="80" rx="20" fill="white" stroke="#E5E7EB" stroke-width="1"/>
      
      <!-- Icône -->
      <rect x="20" y="20" width="40" height="40" rx="9" fill="url(#primaryBlue)"/>
      <path d="M30,45 L30,25 L35,25 L35,37.5 L45,25 L50,25 L50,45 L45,45 L45,32.5 L35,45 Z" fill="white" opacity="0.95"/>
      
      <!-- Texte -->
      <text x="80" y="45" font-family="Arial, sans-serif" font-size="32" font-weight="700" fill="url(#primaryBlue)">NYTH</text>
      
      <!-- Tagline optionnel -->
      <text x="80" y="58" font-family="Arial, sans-serif" font-size="10" fill="#6B7280">Your Mobile App</text>
    </g>
    
    <!-- Version simplifiée -->
    <g transform="translate(50, 200)">
      <text x="150" y="-10" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#6B7280">Version Simplifiée</text>
      <rect width="300" height="60" rx="15" fill="url(#primaryBlue)" opacity="0.05"/>
      
      <text x="150" y="40" text-anchor="middle" font-family="Arial, sans-serif" font-size="36" font-weight="700" fill="url(#primaryBlue)">NYTH</text>
    </g>
  </g>
  
  <!-- Petites tailles -->
  <g id="smallSizes" transform="translate(550, 580)">
    <text x="100" y="40" font-family="Arial, sans-serif" font-size="18" font-weight="600" fill="#374151">Petites Tailles</text>
    
    <!-- 64x64 -->
    <g transform="translate(20, 70)">
      <text x="32" y="-10" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" fill="#6B7280">64x64px</text>
      <rect width="64" height="64" rx="14" fill="url(#primaryBlue)" filter="url(#shadow)"/>
      <path d="M16,44 L16,20 L22,20 L22,35 L42,20 L48,20 L48,44 L42,44 L42,29 L22,44 Z" fill="white" opacity="0.95"/>
    </g>
    
    <!-- 32x32 -->
    <g transform="translate(120, 70)">
      <text x="16" y="-10" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" fill="#6B7280">32x32px</text>
      <rect width="32" height="32" rx="7" fill="url(#primaryBlue)" filter="url(#shadow)"/>
      <path d="M8,22 L8,10 L11,10 L11,17.5 L21,10 L24,10 L24,22 L21,22 L21,14.5 L11,22 Z" fill="white" opacity="0.95"/>
    </g>
    
    <!-- 16x16 favicon -->
    <g transform="translate(220, 70)">
      <text x="8" y="-10" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" fill="#6B7280">16x16px</text>
      <rect width="16" height="16" rx="3" fill="url(#primaryBlue)"/>
      <path d="M4,11 L4,5 L6,5 L6,8.5 L10,5 L12,5 L12,11 L10,11 L10,7.5 L6,11 Z" fill="white" opacity="0.95"/>
    </g>
  </g>
  
  <!-- Guide d'utilisation -->
  <g id="usageGuide" transform="translate(50, 850)">
    <text x="0" y="20" font-family="Arial, sans-serif" font-size="18" font-weight="600" fill="#374151">Guide d'Utilisation</text>
    
    <rect x="0" y="40" width="900" height="200" rx="10" fill="#F9FAFB" stroke="#E5E7EB"/>
    
    <text x="20" y="70" font-family="Arial, sans-serif" font-size="14" font-weight="600" fill="#1F2937">📱 Pour l'App Store / Play Store :</text>
    <text x="40" y="90" font-family="Arial, sans-serif" font-size="12" fill="#4B5563">• Utilisez la version carrée 1024x1024px</text>
    <text x="40" y="105" font-family="Arial, sans-serif" font-size="12" fill="#4B5563">• Format PNG avec transparence</text>
    
    <text x="20" y="130" font-family="Arial, sans-serif" font-size="14" font-weight="600" fill="#1F2937">🖥️ Pour l'interface de l'app :</text>
    <text x="40" y="150" font-family="Arial, sans-serif" font-size="12" fill="#4B5563">• Version horizontale pour splash screen</text>
    <text x="40" y="165" font-family="Arial, sans-serif" font-size="12" fill="#4B5563">• Petites tailles pour navigation/boutons</text>
    
    <text x="20" y="190" font-family="Arial, sans-serif" font-size="14" font-weight="600" fill="#1F2937">🎨 Adaptations :</text>
    <text x="40" y="210" font-family="Arial, sans-serif" font-size="12" fill="#4B5563">• Mode sombre disponible • Version monochrome • Couleurs personnalisables</text>
    
    <text x="450" y="70" font-family="Arial, sans-serif" font-size="14" font-weight="600" fill="#1F2937">📋 Spécifications techniques :</text>
    <text x="470" y="90" font-family="Arial, sans-serif" font-size="12" fill="#4B5563">• Couleur principale : #4A90E2</text>
    <text x="470" y="105" font-family="Arial, sans-serif" font-size="12" fill="#4B5563">• Couleur secondaire : #357ABD</text>
    <text x="470" y="120" font-family="Arial, sans-serif" font-size="12" fill="#4B5563">• Police : Arial/Helvetica</text>
    <text x="470" y="135" font-family="Arial, sans-serif" font-size="12" fill="#4B5563">• Coins arrondis : 22px (100px icon)</text>
    
    <text x="450" y="160" font-family="Arial, sans-serif" font-size="14" font-weight="600" fill="#1F2937">✅ Formats recommandés :</text>
    <text x="470" y="180" font-family="Arial, sans-serif" font-size="12" fill="#4B5563">• SVG pour scalabilité</text>
    <text x="470" y="195" font-family="Arial, sans-serif" font-size="12" fill="#4B5563">• PNG haute résolution pour stores</text>
    <text x="470" y="210" font-family="Arial, sans-serif" font-size="12" fill="#4B5563">• ICO pour favicon web</text>
  </g>
  
</svg>