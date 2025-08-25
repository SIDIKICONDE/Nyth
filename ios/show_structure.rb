#!/usr/bin/env ruby

# Script pour montrer comment la structure de groupes est créée

SHARED_PATH = '../shared'

def show_structure(path, indent = 0)
  spaces = "  " * indent

  if Dir.exist?(path)
    Dir.foreach(path) do |item|
      next if item.start_with?('.') || item == 'output'

      item_path = File.join(path, item)

      if Dir.exist?(item_path)
        puts "#{spaces}📁 #{item}/"
        show_structure(item_path, indent + 1)
      else
        ext = File.extname(item).downcase
        if ['.cpp', '.c', '.mm', '.m', '.hpp', '.h'].include?(ext)
          icon = ['.cpp', '.c', '.mm', '.m'].include?(ext) ? "🔧" : "📄"
          puts "#{spaces}#{icon} #{item}"
        end
      end
    end
  end
end

puts "🏗️  STRUCTURE QUI SERA CRÉÉE DANS XCODE :"
puts "=" * 50
puts ""
puts "📦 Groupe principal: shared/"
show_structure(SHARED_PATH, 1)
puts ""
puts "=" * 50
puts ""
puts "🎯 Cette structure sera RECREÉE exactement dans Xcode !"
