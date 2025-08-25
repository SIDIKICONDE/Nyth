#!/usr/bin/env ruby

require 'xcodeproj'
require 'fileutils'

# Configuration
PROJECT_PATH = 'Nyth.xcodeproj'
SHARED_GROUP_NAME = 'shared'

puts "🗑️ Script de suppression des modules shared/"
puts "📁 Projet Xcode: #{PROJECT_PATH}"
puts "=" * 50

# Créer une sauvegarde automatique
backup_path = "#{PROJECT_PATH}/project.pbxproj.backup_#{Time.now.strftime('%Y%m%d_%H%M%S')}"

puts "📋 Création d'une sauvegarde automatique..."
if File.exist?("#{PROJECT_PATH}/project.pbxproj")
  FileUtils.cp("#{PROJECT_PATH}/project.pbxproj", backup_path)
  puts "✅ Sauvegarde créée: #{backup_path}"
else
  puts "⚠️  Fichier project.pbxproj non trouvé, pas de sauvegarde créée"
end

# Ouvrir le projet
project = Xcodeproj::Project.open(PROJECT_PATH)
target = project.targets.find { |t| t.name == 'Nyth' }

if target.nil?
  puts "❌ Target 'Nyth' non trouvée"
  exit 1
end

puts "✅ Projet Xcode ouvert avec succès"

# Statistiques
stats = {
  files_removed: 0,
  groups_removed: 0
}

# Fonction pour supprimer récursivement un groupe
def remove_group_recursively(group, target, stats)
  if group.children
    # Supprimer les enfants d'abord
    children = group.children.dup
    children.each do |child|
      if child.is_a?(Xcodeproj::Project::Object::PBXGroup)
        remove_group_recursively(child, target, stats)
      else
        # Supprimer le fichier de la target
        if target.source_build_phase
          target.source_build_phase.remove_file_reference(child)
        end

        # Supprimer du projet
        child.remove_from_project
        stats[:files_removed] += 1
        puts "🗑️ Supprimé: #{child.path}"
      end
    end
  end

  # Supprimer le groupe lui-même
  if group != project.main_group
    group.remove_from_project
    stats[:groups_removed] += 1
    puts "📁 Groupe supprimé: #{group.name}"
  end
end

# Trouver et supprimer le groupe shared
shared_group = project.main_group.children.find { |g|
  g.is_a?(Xcodeproj::Project::Object::PBXGroup) && g.name == SHARED_GROUP_NAME
}

if shared_group
  puts "📂 Groupe 'shared' trouvé, suppression en cours..."
  remove_group_recursively(shared_group, target, stats)
else
  puts "⚠️ Groupe 'shared' non trouvé dans le projet"
end

# Sauvegarder le projet
puts "\n💾 Sauvegarde du projet..."
project.save

# Afficher les statistiques
puts "\n" + "=" * 50
puts "📊 RÉSULTATS :"
puts "📄 Fichiers supprimés: #{stats[:files_removed]}"
puts "📁 Groupes supprimés: #{stats[:groups_removed]}"
puts "=" * 50

puts "\n✅ Suppression terminée !"
puts "📁 Le dossier physique ../shared/ reste intact"
