import Link from "next/link"
import { 
  Github, 
  Twitter, 
  Linkedin, 
  Mail,
  MapPin,
  Phone
} from "lucide-react"
import { Container } from "@/components/ui/Container"

const footerLinks = {
  product: {
    title: "Produit",
    links: [
      { name: "Fonctionnalités", href: "#features" },
      { name: "Tutoriels", href: "#tutorials" },
      { name: "Tarifs", href: "#pricing" },
      { name: "Changelog", href: "#changelog" },
    ],
  },
  resources: {
    title: "Ressources",
    links: [
      { name: "Documentation", href: "/docs" },
      { name: "API", href: "/api" },
      { name: "Guides", href: "/guides" },
      { name: "Blog", href: "/blog" },
    ],
  },
  company: {
    title: "Entreprise",
    links: [
      { name: "À propos", href: "/about" },
      { name: "Carrières", href: "/careers" },
      { name: "Presse", href: "/press" },
      { name: "Contact", href: "/contact" },
    ],
  },
  legal: {
    title: "Légal",
    links: [
      { name: "Confidentialité", href: "/privacy" },
      { name: "Conditions", href: "/terms" },
      { name: "Cookies", href: "/cookies" },
      { name: "Licence", href: "/license" },
    ],
  },
}

const socialLinks = [
  { icon: Github, href: "https://github.com", label: "GitHub" },
  { icon: Twitter, href: "https://twitter.com", label: "Twitter" },
  { icon: Linkedin, href: "https://linkedin.com", label: "LinkedIn" },
]

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <Container>
        {/* Main Footer */}
        <div className="py-12 grid grid-cols-2 md:grid-cols-5 gap-8">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">N</span>
              </div>
              <span className="text-2xl font-bold text-white">Nythweb</span>
            </div>
            <p className="text-sm text-gray-400 mb-4">
              La plateforme de référence pour apprendre et maîtriser notre application.
            </p>
            <div className="flex space-x-4">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors duration-200"
                  aria-label={social.label}
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Links Columns */}
          {Object.entries(footerLinks).map(([key, section]) => (
            <div key={key}>
              <h3 className="font-semibold text-white mb-4">{section.title}</h3>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-sm hover:text-white transition-colors duration-200"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Contact Info */}
        <div className="py-8 border-t border-gray-800">
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-purple-500" />
              <a href="mailto:contact@nythweb.com" className="hover:text-white transition-colors">
                contact@nythweb.com
              </a>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-purple-500" />
              <a href="tel:+33123456789" className="hover:text-white transition-colors">
                +33 1 23 45 67 89
              </a>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-purple-500" />
              <span>Paris, France</span>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="py-6 border-t border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-400">
              © 2024 Nythweb. Tous droits réservés.
            </p>
            <div className="flex gap-6 text-sm">
              <Link href="/privacy" className="hover:text-white transition-colors">
                Confidentialité
              </Link>
              <Link href="/terms" className="hover:text-white transition-colors">
                Conditions
              </Link>
              <Link href="/sitemap" className="hover:text-white transition-colors">
                Plan du site
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </footer>
  )
}