#!/usr/bin/env ruby

require 'xcodeproj'
require 'pathname'
require 'fileutils'

# Configuration
SHARED_PATH = '../shared'
PROJECT_PATH = 'Nyth.xcodeproj'

# Extensions de fichiers à ajouter
SOURCE_EXTENSIONS = ['.cpp', '.c', '.mm', '.m']
HEADER_EXTENSIONS = ['.hpp', '.h']

puts "🚀 Script d'ajout des modules shared/ au projet Xcode"
puts "📁 Chemin shared: #{SHARED_PATH}"
puts "📁 Projet Xcode: #{PROJECT_PATH}"
puts "=" * 60

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
puts "✅ Target 'Nyth' trouvée"

# Statistiques
stats = {
  source_files: 0,
  header_files: 0,
  groups_created: 0,
  files_added: 0,
  duplicates_avoided: 0
}

# Fonction pour créer la structure de groupes récursivement
def create_group_structure(project, target, relative_path, shared_root, stats)
  full_path = File.join(shared_root, relative_path)

  return if relative_path.empty? || !Dir.exist?(full_path)

  # Créer ou trouver le groupe parent
  parent_group = project.main_group
  if relative_path != '.'
    path_parts = relative_path.split('/')
    path_parts.each do |part|
      existing_group = parent_group.children.find { |g| g.is_a?(Xcodeproj::Project::Object::PBXGroup) && g.name == part }
      if existing_group
        parent_group = existing_group
        puts "📁 Groupe existant utilisé: #{part}"
      else
        parent_group = parent_group.new_group(part, nil, '<group>')
        stats[:groups_created] += 1
        puts "📁 Nouveau groupe créé: #{part}"
      end
    end
  end

  # Traiter tous les fichiers et dossiers
  Dir.foreach(full_path) do |item|
    next if item.start_with?('.') || item == 'output'

    item_path = File.join(full_path, item)

    if Dir.exist?(item_path)
      # Dossier - créer récursivement
      sub_relative = relative_path == '.' ? item : "#{relative_path}/#{item}"
      create_group_structure(project, target, sub_relative, shared_root, stats)
    else
      # Fichier - vérifier l'extension
      ext = File.extname(item).downcase

      if SOURCE_EXTENSIONS.include?(ext)
        # Vérifier si le fichier existe déjà dans le projet
        existing_file_ref = project.files.find { |f| f.path == "../shared/#{relative_path}/#{item}" }

        if existing_file_ref
          puts "⚠️  Source déjà présent: #{relative_path}/#{item}"
          stats[:duplicates_avoided] += 1
        else
          # Fichier source - ajouter à la compilation
          file_ref = parent_group.new_file("../shared/#{relative_path}/#{item}")

          # Ajouter aux sources
          if target.source_build_phase
            target.source_build_phase.add_file_reference(file_ref)
            stats[:source_files] += 1
            stats[:files_added] += 1
          end

          puts "✅ Source: #{relative_path}/#{item}"
        end

      elsif HEADER_EXTENSIONS.include?(ext)
        # Vérifier si le fichier existe déjà dans le projet
        existing_file_ref = project.files.find { |f| f.path == "../shared/#{relative_path}/#{item}" }

        if existing_file_ref
          puts "⚠️  Header déjà présent: #{relative_path}/#{item}"
          stats[:duplicates_avoided] += 1
        else
          # Fichier header - ajouter au groupe seulement
          parent_group.new_file("../shared/#{relative_path}/#{item}")
          stats[:header_files] += 1
          stats[:files_added] += 1

          puts "📄 Header: #{relative_path}/#{item}"
        end
      end
    end
  end
end

# Fonction principale
def add_shared_modules(project, target, shared_path, stats)
  puts "\n🔍 Analyse du dossier shared/..."

  if !Dir.exist?(shared_path)
    puts "❌ Dossier shared/ non trouvé: #{shared_path}"
    return
  end

  # Créer le groupe principal "shared"
  shared_group = project.main_group.new_group('shared', shared_path, '<group>')
  stats[:groups_created] += 1

  # Traiter chaque sous-dossier principal
  Dir.foreach(shared_path) do |item|
    next if item.start_with?('.') || item == 'output'

    item_path = File.join(shared_path, item)

    if Dir.exist?(item_path)
      puts "\n📂 Traitement du module: #{item}"
      create_group_structure(project, target, item, shared_path, stats)
    end
  end
end

# Exécuter l'ajout des modules
add_shared_modules(project, target, SHARED_PATH, stats)

# Sauvegarder le projet
puts "\n💾 Sauvegarde du projet..."
project.save

# Afficher les statistiques
puts "\n" + "=" * 60
puts "📊 RÉSULTATS :"
puts "📁 Groupes créés: #{stats[:groups_created]}"
puts "📄 Fichiers headers: #{stats[:header_files]}"
puts "🔧 Fichiers sources: #{stats[:source_files]}"
puts "📊 Total fichiers ajoutés: #{stats[:files_added]}"
puts "⚠️  Doublons évités: #{stats[:duplicates_avoided]}"
puts "=" * 60

puts "\n🎯 Prochaines étapes :"
puts "1. Ouvrez ios/Nyth.xcworkspace"
puts "2. Vérifiez que le groupe 'shared' est présent"
puts "3. Vérifiez les chemins d'inclusion dans Build Settings"
puts "4. Testez la compilation (Cmd+B)"

puts "\n✅ Script terminé avec succès !"
