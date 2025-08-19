"use client"

import { motion } from "framer-motion"
import { Check, X, Zap } from "lucide-react"
import { Container } from "@/components/ui/Container"
import { Button } from "@/components/ui/Button"
import { cn } from "@/lib/utils"

const plans = [
  {
    name: "Gratuit",
    price: "0€",
    period: "pour toujours",
    description: "Parfait pour débuter avec Nythweb",
    features: [
      { text: "Accès aux tutoriels de base", included: true },
      { text: "Documentation complète", included: true },
      { text: "Communauté Discord", included: true },
      { text: "5 projets maximum", included: true },
      { text: "Support par email", included: false },
      { text: "Tutoriels avancés", included: false },
      { text: "API illimitée", included: false },
    ],
    cta: "Commencer gratuitement",
    popular: false,
  },
  {
    name: "Pro",
    price: "19€",
    period: "par mois",
    description: "Pour les développeurs sérieux",
    features: [
      { text: "Tout du plan Gratuit", included: true },
      { text: "Projets illimités", included: true },
      { text: "Tutoriels avancés", included: true },
      { text: "Support prioritaire", included: true },
      { text: "API illimitée", included: true },
      { text: "Intégrations avancées", included: true },
      { text: "Analytics détaillés", included: false },
    ],
    cta: "Essai gratuit 14 jours",
    popular: true,
  },
  {
    name: "Entreprise",
    price: "Sur mesure",
    period: "contactez-nous",
    description: "Solutions personnalisées pour votre équipe",
    features: [
      { text: "Tout du plan Pro", included: true },
      { text: "Nombre illimité d'utilisateurs", included: true },
      { text: "Formation personnalisée", included: true },
      { text: "Support dédié 24/7", included: true },
      { text: "SLA garanti", included: true },
      { text: "Déploiement on-premise", included: true },
      { text: "Personnalisation complète", included: true },
    ],
    cta: "Contactez-nous",
    popular: false,
  },
]

export function Pricing() {
  return (
    <section id="pricing" className="py-20 bg-gray-50">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Tarifs{" "}
            <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Transparents
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Choisissez le plan qui correspond à vos besoins. Changez ou annulez à tout moment.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              className={cn(
                "relative bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300",
                plan.popular && "ring-2 ring-purple-600"
              )}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                    <Zap className="w-4 h-4" />
                    Plus populaire
                  </div>
                </div>
              )}

              <div className="p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {plan.name}
                </h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-gray-900">
                    {plan.price}
                  </span>
                  <span className="text-gray-600 ml-2">{plan.period}</span>
                </div>
                <p className="text-gray-600 mb-6">{plan.description}</p>

                <Button
                  className="w-full mb-6"
                  variant={plan.popular ? "default" : "secondary"}
                >
                  {plan.cta}
                </Button>

                <ul className="space-y-3">
                  {plan.features.map((feature, featureIndex) => (
                    <li
                      key={featureIndex}
                      className="flex items-start gap-3"
                    >
                      {feature.included ? (
                        <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      ) : (
                        <X className="w-5 h-5 text-gray-300 flex-shrink-0 mt-0.5" />
                      )}
                      <span
                        className={cn(
                          "text-sm",
                          feature.included ? "text-gray-700" : "text-gray-400"
                        )}
                      >
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </div>

        {/* FAQ or Additional Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-16 text-center"
        >
          <p className="text-gray-600 mb-4">
            Tous les plans incluent une garantie de remboursement de 30 jours
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <span className="flex items-center gap-2 text-gray-600">
              <Check className="w-4 h-4 text-green-500" />
              Sans engagement
            </span>
            <span className="flex items-center gap-2 text-gray-600">
              <Check className="w-4 h-4 text-green-500" />
              Changez de plan à tout moment
            </span>
            <span className="flex items-center gap-2 text-gray-600">
              <Check className="w-4 h-4 text-green-500" />
              Support en français
            </span>
          </div>
        </motion.div>
      </Container>
    </section>
  )
}