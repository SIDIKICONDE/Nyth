#!/usr/bin/env ruby

require 'xcodeproj'
require 'pathname'

# Script de test pour vérifier la protection contre les doublons

puts "🧪 TEST PROTECTION CONTRE LES DOUBLONS"
puts "=" * 50

# Ouvrir le projet
project_path = 'Nyth.xcodeproj'
project = Xcodeproj::Project.open(project_path)
target = project.targets.find { |t| t.name == 'Nyth' }

if target.nil?
  puts "❌ Target 'Nyth' non trouvée"
  exit 1
end

puts "✅ Projet ouvert"

# Test 1: Ajouter quelques fichiers spécifiques
test_files = [
  'Audio/common/dsp/BiquadFilter.hpp',
  'Audio/common/dsp/BiquadFilter.cpp'
]

puts "\n📋 Test 1: Ajout de fichiers spécifiques..."

test_files.each do |file_path|
  full_path = "../shared/#{file_path}"

  if File.exist?(full_path)
    # Vérifier si le fichier existe déjà
    existing_file_ref = project.files.find { |f| f.path == full_path }

    if existing_file_ref
      puts "⚠️  Fichier déjà présent: #{file_path}"
    else
      # Créer le groupe parent
      parent_group = project.main_group
      path_parts = file_path.split('/')
      file_name = path_parts.pop

      # Créer la structure de groupes
      path_parts.each do |part|
        existing_group = parent_group.children.find { |g| g.is_a?(Xcodeproj::Project::Object::PBXGroup) && g.name == part }
        if existing_group
          parent_group = existing_group
        else
          parent_group = parent_group.new_group(part, nil, '<group>')
          puts "📁 Groupe créé: #{part}"
        end
      end

      # Ajouter le fichier
      file_ref = parent_group.new_file(full_path)
      if File.extname(file_name) == '.cpp'
        target.source_build_phase.add_file_reference(file_ref)
      end

      puts "✅ Fichier ajouté: #{file_path}"
    end
  else
    puts "❌ Fichier non trouvé: #{full_path}"
  end
end

puts "\n📋 Test 2: Tentative d'ajout des mêmes fichiers (devrait détecter des doublons)..."

test_files.each do |file_path|
  full_path = "../shared/#{file_path}"

  existing_file_ref = project.files.find { |f| f.path == full_path }

  if existing_file_ref
    puts "⚠️  DOUBLON DÉTECTÉ: #{file_path}"
  else
    puts "❌ Erreur: fichier devrait exister: #{file_path}"
  end
end

# Sauvegarder le projet
puts "\n💾 Sauvegarde du projet..."
project.save

puts "\n" + "=" * 50
puts "✅ Test terminé !"
puts ""
puts "🎯 Résultat attendu:"
puts "  - 1ère exécution: fichiers ajoutés"
puts "  - 2ème exécution: doublons détectés"
puts ""
puts "🔍 Vérifiez dans Xcode que les fichiers ont été ajoutés"
puts "   sans duplication dans le navigateur de projet"
