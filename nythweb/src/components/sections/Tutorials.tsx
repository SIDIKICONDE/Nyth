"use client"

import { motion } from "framer-motion"
import { 
  BookOpen, 
  Video, 
  FileText, 
  ArrowRight,
  Clock,
  Star,
  TrendingUp
} from "lucide-react"
import { Container } from "@/components/ui/Container"
import { Button } from "@/components/ui/Button"
import { cn } from "@/lib/utils"

const tutorials = [
  {
    category: "Débutant",
    title: "Prise en main de Nythweb",
    description: "Apprenez les bases de l'application et configurez votre premier projet",
    duration: "15 min",
    type: "video",
    rating: 4.9,
    students: "2.3k",
    color: "from-green-500 to-green-600",
  },
  {
    category: "Intermédiaire",
    title: "Création de composants avancés",
    description: "Maîtrisez la création de composants réutilisables et personnalisables",
    duration: "30 min",
    type: "article",
    rating: 4.8,
    students: "1.8k",
    color: "from-blue-500 to-blue-600",
  },
  {
    category: "Avancé",
    title: "Optimisation des performances",
    description: "Techniques avancées pour optimiser votre application",
    duration: "45 min",
    type: "video",
    rating: 5.0,
    students: "1.2k",
    color: "from-purple-500 to-purple-600",
  },
  {
    category: "Expert",
    title: "Architecture scalable",
    description: "Construisez des applications évolutives avec les meilleures pratiques",
    duration: "60 min",
    type: "guide",
    rating: 4.9,
    students: "890",
    color: "from-red-500 to-red-600",
  },
]

const categories = [
  { name: "Tous", count: 120 },
  { name: "Débutant", count: 40 },
  { name: "Intermédiaire", count: 35 },
  { name: "Avancé", count: 30 },
  { name: "Expert", count: 15 },
]

export function Tutorials() {
  return (
    <section id="tutorials" className="py-20 bg-white">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Tutoriels{" "}
            <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Interactifs
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Apprenez à votre rythme avec nos tutoriels vidéo, articles détaillés
            et guides pratiques
          </p>
        </motion.div>

        {/* Categories */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="flex flex-wrap justify-center gap-4 mb-12"
        >
          {categories.map((category, index) => (
            <button
              key={index}
              className={cn(
                "px-6 py-3 rounded-full font-medium transition-all duration-200",
                index === 0
                  ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              )}
            >
              {category.name}
              <span className="ml-2 text-sm opacity-75">({category.count})</span>
            </button>
          ))}
        </motion.div>

        {/* Tutorial Cards */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {tutorials.map((tutorial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              className="group cursor-pointer"
            >
              <div className="bg-gray-50 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300">
                {/* Preview Area */}
                <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div
                      className={cn(
                        "w-20 h-20 rounded-2xl bg-gradient-to-br flex items-center justify-center group-hover:scale-110 transition-transform duration-300",
                        tutorial.color
                      )}
                    >
                      {tutorial.type === "video" && <Video className="w-10 h-10 text-white" />}
                      {tutorial.type === "article" && <FileText className="w-10 h-10 text-white" />}
                      {tutorial.type === "guide" && <BookOpen className="w-10 h-10 text-white" />}
                    </div>
                  </div>
                  <div className="absolute top-4 left-4">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-sm font-medium text-white bg-gradient-to-r",
                      tutorial.color
                    )}>
                      {tutorial.category}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-purple-600 transition-colors">
                    {tutorial.title}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {tutorial.description}
                  </p>

                  {/* Meta Info */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-4 text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {tutorial.duration}
                      </span>
                      <span className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500" />
                        {tutorial.rating}
                      </span>
                      <span className="flex items-center gap-1">
                        <TrendingUp className="w-4 h-4" />
                        {tutorial.students}
                      </span>
                    </div>
                    <ArrowRight className="w-5 h-5 text-purple-600 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-center"
        >
          <Button size="lg">
            Voir tous les tutoriels
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </motion.div>
      </Container>
    </section>
  )
}