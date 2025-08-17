import numpy as np
import matplotlib.pyplot as plt
import matplotlib.animation as animation
from matplotlib.patches import Polygon, Circle
from matplotlib.collections import PatchCollection
import matplotlib.patheffects as path_effects
from scipy.interpolate import interp1d
import colorsys

class NythMorphingLogo:
    def __init__(self, fig_size=(12, 8)):
        """
        Initialise le logo Nyth avec morphing avancé
        """
        self.fig, self.ax = plt.subplots(figsize=fig_size, facecolor='#0a0a0a')
        self.ax.set_xlim(-10, 10)
        self.ax.set_ylim(-6, 6)
        self.ax.set_aspect('equal')
        self.ax.axis('off')
        
        # Paramètres d'animation
        self.frame_count = 0
        self.morphing_speed = 0.02
        self.color_shift = 0
        
        # Points de contrôle pour le morphing
        self.control_points = self._generate_control_points()
        self.morphed_points = np.copy(self.control_points)
        
        # Éléments graphiques
        self.patches = []
        self.text_elements = []
        self.particles = []
        
        # Initialisation des particules pour l'effet visuel
        self._init_particles()
        
    def _generate_control_points(self):
        """
        Génère les points de contrôle pour la forme morphing
        """
        theta = np.linspace(0, 2*np.pi, 100)
        # Forme de base avec variations pour le morphing
        r = 3 + 0.5 * np.sin(4*theta) + 0.3 * np.cos(6*theta)
        x = r * np.cos(theta)
        y = r * np.sin(theta)
        return np.column_stack([x, y])
    
    def _init_particles(self):
        """
        Initialise les particules pour l'effet d'arrière-plan
        """
        n_particles = 50
        for _ in range(n_particles):
            x = np.random.uniform(-10, 10)
            y = np.random.uniform(-6, 6)
            size = np.random.uniform(10, 50)
            speed_x = np.random.uniform(-0.05, 0.05)
            speed_y = np.random.uniform(-0.05, 0.05)
            color_offset = np.random.uniform(0, 1)
            
            self.particles.append({
                'pos': [x, y],
                'size': size,
                'speed': [speed_x, speed_y],
                'color_offset': color_offset,
                'circle': None
            })
    
    def _morph_shape(self, t):
        """
        Applique l'effet de morphing à la forme
        """
        # Paramètres de morphing dynamiques
        morph_factor1 = np.sin(t * 2) * 0.3
        morph_factor2 = np.cos(t * 3) * 0.2
        morph_factor3 = np.sin(t * 1.5) * 0.4
        
        theta = np.linspace(0, 2*np.pi, 100)
        
        # Forme complexe avec multiple harmoniques
        r = (3 + 
             morph_factor1 * np.sin(4*theta + t) + 
             morph_factor2 * np.cos(6*theta - t*2) +
             morph_factor3 * np.sin(8*theta + t*3))
        
        # Distorsion supplémentaire pour effet liquide
        noise = 0.1 * np.sin(10*theta + t*5)
        r += noise
        
        x = r * np.cos(theta)
        y = r * np.sin(theta)
        
        return np.column_stack([x, y])
    
    def _create_y_emphasis(self, t):
        """
        Crée un effet spécial pour mettre en valeur le Y
        """
        # Position et taille du Y
        y_x = 0
        y_y = 0
        
        # Création du Y avec des lignes épaisses et animées
        y_points = []
        
        # Branche gauche du Y
        angle1 = -np.pi/6 + np.sin(t*3) * 0.1
        x1 = y_x - 1.5 * np.cos(angle1)
        y1 = y_y + 1.5 * np.sin(angle1)
        
        # Branche droite du Y
        angle2 = np.pi/6 - np.sin(t*3) * 0.1
        x2 = y_x + 1.5 * np.cos(angle2)
        y2 = y_y + 1.5 * np.sin(angle2)
        
        # Tige du Y
        y3 = y_y - 1.5 - np.sin(t*2) * 0.2
        
        return [(x1, y1), (y_x, y_y), (x2, y2), (y_x, y_y), (y_x, y3)]
    
    def _get_dynamic_color(self, t, offset=0):
        """
        Génère une couleur dynamique basée sur le temps
        """
        hue = (t * 0.1 + offset) % 1.0
        saturation = 0.8 + 0.2 * np.sin(t * 2)
        value = 0.7 + 0.3 * np.sin(t * 3)
        
        rgb = colorsys.hsv_to_rgb(hue, saturation, value)
        return rgb
    
    def _draw_text(self, t):
        """
        Dessine le texte NYTH avec emphase sur le Y
        """
        # Nettoyer les anciens textes
        for text in self.text_elements:
            text.remove()
        self.text_elements.clear()
        
        # Positions des lettres
        positions = [(-3, 0), (-1, 0), (1, 0), (3, 0)]
        letters = ['N', 'Y', 'T', 'H']
        
        for i, (letter, pos) in enumerate(zip(letters, positions)):
            # Taille et couleur spéciales pour Y
            if letter == 'Y':
                size = 80 + 20 * np.sin(t * 4)  # Pulsation pour Y
                color = self._get_dynamic_color(t * 2, 0.5)  # Couleur plus vive
                weight = 'bold'
                
                # Effet de brillance pour Y
                y_offset = np.sin(t * 3) * 0.3
                rotation = np.sin(t * 2) * 5  # Rotation légère
                
                # Halo lumineux autour du Y
                for j in range(3):
                    halo_size = size + j * 10
                    halo_alpha = 0.3 - j * 0.1
                    halo_text = self.ax.text(
                        pos[0], pos[1] + y_offset, letter,
                        fontsize=halo_size, fontweight=weight,
                        ha='center', va='center',
                        color=(*color, halo_alpha),
                        rotation=rotation,
                        zorder=1
                    )
                    self.text_elements.append(halo_text)
                
            else:
                size = 60 + 5 * np.sin(t * 3 + i)
                color = self._get_dynamic_color(t, i * 0.25)
                weight = 'normal'
                y_offset = np.sin(t * 2 + i) * 0.1
                rotation = 0
            
            # Texte principal
            text = self.ax.text(
                pos[0], pos[1] + y_offset, letter,
                fontsize=size, fontweight=weight,
                ha='center', va='center',
                color=color,
                rotation=rotation,
                zorder=5
            )
            
            # Effet de contour
            text.set_path_effects([
                path_effects.Stroke(linewidth=3, foreground='white', alpha=0.3),
                path_effects.Normal()
            ])
            
            self.text_elements.append(text)
    
    def _update_particles(self, t):
        """
        Met à jour les particules d'arrière-plan
        """
        for particle in self.particles:
            # Mise à jour de la position
            particle['pos'][0] += particle['speed'][0]
            particle['pos'][1] += particle['speed'][1]
            
            # Rebond sur les bords
            if abs(particle['pos'][0]) > 10:
                particle['speed'][0] *= -1
            if abs(particle['pos'][1]) > 6:
                particle['speed'][1] *= -1
            
            # Couleur dynamique
            color = self._get_dynamic_color(t, particle['color_offset'])
            
            # Taille pulsante
            size = particle['size'] * (1 + 0.3 * np.sin(t * 2 + particle['color_offset'] * 2 * np.pi))
            
            # Supprimer l'ancien cercle si existant
            if particle['circle']:
                particle['circle'].remove()
            
            # Créer nouveau cercle
            particle['circle'] = Circle(
                particle['pos'], size/100,
                color=(*color, 0.2),
                zorder=0
            )
            self.ax.add_patch(particle['circle'])
    
    def animate(self, frame):
        """
        Fonction d'animation principale
        """
        self.ax.clear()
        self.ax.set_xlim(-10, 10)
        self.ax.set_ylim(-6, 6)
        self.ax.set_aspect('equal')
        self.ax.axis('off')
        self.ax.set_facecolor('#0a0a0a')
        
        t = frame * self.morphing_speed
        
        # Mise à jour des particules
        self._update_particles(t)
        
        # Forme morphing principale
        morphed_shape = self._morph_shape(t)
        
        # Créer un dégradé de couleurs pour la forme
        n_segments = len(morphed_shape) - 1
        for i in range(n_segments):
            segment_color = self._get_dynamic_color(t, i/n_segments)
            alpha = 0.3 + 0.2 * np.sin(t * 3 + i * 0.1)
            
            # Ligne de contour
            self.ax.plot(
                [morphed_shape[i, 0], morphed_shape[i+1, 0]],
                [morphed_shape[i, 1], morphed_shape[i+1, 1]],
                color=segment_color,
                linewidth=2 + np.sin(t * 4 + i * 0.2),
                alpha=alpha,
                zorder=2
            )
        
        # Remplissage avec gradient
        main_color = self._get_dynamic_color(t)
        polygon = Polygon(morphed_shape, 
                         facecolor=(*main_color, 0.1),
                         edgecolor=(*main_color, 0.5),
                         linewidth=2,
                         zorder=1)
        self.ax.add_patch(polygon)
        
        # Effet Y spécial
        y_points = self._create_y_emphasis(t)
        for i in range(0, len(y_points)-1, 2):
            y_color = self._get_dynamic_color(t * 2, 0.5)
            self.ax.plot(
                [y_points[i][0], y_points[i+1][0]],
                [y_points[i][1], y_points[i+1][1]],
                color=y_color,
                linewidth=4 + 2 * np.sin(t * 5),
                alpha=0.7,
                zorder=3
            )
            
            # Effet de lueur pour Y
            for j in range(3):
                self.ax.plot(
                    [y_points[i][0], y_points[i+1][0]],
                    [y_points[i][1], y_points[i+1][1]],
                    color=y_color,
                    linewidth=8 + j*4,
                    alpha=0.1,
                    zorder=2
                )
        
        # Dessiner le texte NYTH
        self._draw_text(t)
        
        # Effet de vagues circulaires émanant du centre
        for i in range(3):
            wave_radius = (t * 2 + i * 2) % 8
            wave_alpha = max(0, 1 - wave_radius / 8) * 0.2
            circle = Circle((0, 0), wave_radius,
                          fill=False,
                          edgecolor=(*self._get_dynamic_color(t + i * 0.3), wave_alpha),
                          linewidth=2,
                          zorder=0)
            self.ax.add_patch(circle)
        
        return self.patches + self.text_elements

def create_morphing_logo():
    """
    Fonction principale pour créer et animer le logo
    """
    logo = NythMorphingLogo(fig_size=(12, 8))
    
    # Configuration de l'animation
    anim = animation.FuncAnimation(
        logo.fig, 
        logo.animate,
        frames=360,
        interval=50,  # 20 FPS
        blit=False,
        repeat=True
    )
    
    plt.show()
    
    # Pour sauvegarder en GIF (nécessite pillow ou imagemagick)
    # anim.save('nyth_morphing_logo.gif', writer='pillow', fps=20)
    
    return logo, anim

if __name__ == "__main__":
    print("╔═══════════════════════════════════════════════════════╗")
    print("║           NYTH - Logo Morphing Ultra Avancé          ║")
    print("║                  Emphasis on 'Y'                      ║")
    print("╚═══════════════════════════════════════════════════════╝")
    print("\nCaractéristiques:")
    print("✦ Forme morphing fluide avec multiples harmoniques")
    print("✦ Lettre Y mise en valeur avec:")
    print("  - Pulsation de taille dynamique")
    print("  - Couleurs plus vives et changeantes")
    print("  - Effet de halo lumineux")
    print("  - Rotation subtile")
    print("  - Représentation graphique 3D du Y")
    print("✦ Particules flottantes en arrière-plan")
    print("✦ Dégradés de couleurs dynamiques")
    print("✦ Ondes circulaires émanant du centre")
    print("✦ Effets de contour et de brillance")
    print("\nLancement de l'animation...")
    
    logo, animation_obj = create_morphing_logo()