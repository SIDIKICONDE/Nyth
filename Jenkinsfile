// Jenkins Pipeline pour la vérification des namespaces
pipeline {
    agent any

    stages {
        stage('🔍 Verify Namespaces') {
            steps {
                script {
                    // Rendre le script exécutable
                    sh 'chmod +x scripts/verify_namespaces.sh'

                    // Exécuter la vérification
                    def result = sh(
                        script: './scripts/verify_namespaces.sh',
                        returnStatus: true
                    )

                    if (result != 0) {
                        echo "❌ Échec de la vérification des namespaces"
                        currentBuild.result = 'FAILURE'
                        error("Erreurs de namespaces détectées")
                    } else {
                        echo "✅ Vérification des namespaces réussie"
                    }
                }
            }
        }
    }

    post {
        always {
            echo "📋 Pipeline terminé"
        }
        failure {
            echo "❌ Le build a échoué à cause d'erreurs de namespaces"
        }
        success {
            echo "🎉 Build réussi avec vérifications de namespaces"
        }
    }
}
