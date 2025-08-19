"use client"

import { motion } from "framer-motion"
import { 
  Code2, 
  Palette, 
  Zap, 
  Shield, 
  Users, 
  BarChart3,
  Smartphone,
  Cloud,
  Lock
} from "lucide-react"
import { Container } from "@/components/ui/Container"
import { cn } from "@/lib/utils"

const features = [
  {
    icon: Code2,
    title: "Code Modulaire",
    description: "Architecture modulaire et réutilisable pour une maintenance facilitée",
    color: "from-purple-500 to-purple-600",
  },
  {
    icon: Palette,
    title: "Design Moderne",
    description: "Interface utilisateur élégante avec des animations fluides",
    color: "from-blue-500 to-blue-600",
  },
  {
    icon: Zap,
    title: "Performance Optimale",
    description: "Application ultra-rapide grâce aux dernières technologies",
    color: "from-green-500 to-green-600",
  },
  {
    icon: Shield,
    title: "Sécurité Renforcée",
    description: "Protection des données avec les meilleures pratiques de sécurité",
    color: "from-red-500 to-red-600",
  },
  {
    icon: Users,
    title: "Collaboration",
    description: "Travaillez en équipe avec des outils de collaboration intégrés",
    color: "from-indigo-500 to-indigo-600",
  },
  {
    icon: BarChart3,
    title: "Analytics",
    description: "Suivez vos performances avec des tableaux de bord détaillés",
    color: "from-yellow-500 to-yellow-600",
  },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
    },
  },
}

export function Features() {
  return (
    <section id="features" className="py-20 bg-gray-50">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Fonctionnalités{" "}
            <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Exceptionnelles
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Découvrez toutes les fonctionnalités qui font de Nythweb la solution
            idéale pour vos projets
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              whileHover={{ scale: 1.05 }}
              className="group relative"
            >
              <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 h-full">
                <div
                  className={cn(
                    "w-14 h-14 rounded-xl bg-gradient-to-br flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300",
                    feature.color
                  )}
                >
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>

                {/* Hover effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600/5 to-blue-600/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Additional Features Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-20 bg-gradient-to-br from-purple-600 to-blue-600 rounded-3xl p-12 text-white text-center"
        >
          <h3 className="text-3xl font-bold mb-4">
            Et bien plus encore...
          </h3>
          <p className="text-lg mb-8 opacity-90 max-w-2xl mx-auto">
            Découvrez toutes les fonctionnalités avancées de Nythweb avec nos
            tutoriels détaillés et notre documentation complète
          </p>
          <div className="flex flex-wrap justify-center gap-6">
            {[
              { icon: Smartphone, label: "Mobile First" },
              { icon: Cloud, label: "Cloud Native" },
              { icon: Lock, label: "Chiffrement E2E" },
            ].map((item, index) => (
              <motion.div
                key={index}
                whileHover={{ scale: 1.1 }}
                className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full"
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </Container>
    </section>
  )
}