import React, { Component, ErrorInfo, ReactNode } from "react";
import { View, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import tw from "twrnc";
import { UIText, HeadingText } from "@/components/ui/Typography";
import { createLogger } from "@/utils/optimizedLogger";

const logger = createLogger("RecordingErrorBoundary");

interface Props {
  children: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
}

export class RecordingErrorBoundary extends Component<Props, State> {
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Met à jour l'état pour afficher l'UI de fallback
    return {
      hasError: true,
      error,
    };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log l'erreur pour le debugging
    logger.error("Erreur capturée par ErrorBoundary", {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      retryCount: this.state.retryCount,
    });

    this.setState({
      error,
      errorInfo,
    });

    // Notifier le parent si un callback est fourni
    this.props.onError?.(error, errorInfo);

    // Tentative de récupération automatique pour certains types d'erreurs
    this.attemptAutoRecovery(error);
  }

  private attemptAutoRecovery = (error: Error) => {
    const { retryCount } = this.state;

    // Vérifier si c'est une erreur récupérable
    const isRecoverableError =
      error.message.includes("Network") ||
      error.message.includes("timeout") ||
      error.message.includes("Permission") ||
      error.message.includes("Camera");

    if (isRecoverableError && retryCount < this.maxRetries) {
      logger.info(
        `Tentative de récupération automatique ${retryCount + 1}/${
          this.maxRetries
        }`
      );

      setTimeout(() => {
        this.setState((prevState) => ({
          hasError: false,
          error: null,
          errorInfo: null,
          retryCount: prevState.retryCount + 1,
        }));
      }, 2000); // Attendre 2 secondes avant de réessayer
    }
  };

  private handleManualRetry = () => {
    logger.info("Réessai manuel demandé par l'utilisateur");

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0, // Reset le compteur pour les réessais manuels
    });
  };

  private handleReset = () => {
    logger.info("Reset complet demandé");

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    });

    this.props.onReset?.();
  };

  private getErrorSeverity = (
    error: Error
  ): "low" | "medium" | "high" | "critical" => {
    const message = error.message.toLowerCase();

    if (message.includes("memory") || message.includes("out of bounds")) {
      return "critical";
    }
    if (message.includes("camera") || message.includes("permission")) {
      return "high";
    }
    if (message.includes("network") || message.includes("timeout")) {
      return "medium";
    }
    return "low";
  };

  private getErrorIcon = (severity: string): string => {
    switch (severity) {
      case "critical":
        return "🚨";
      case "high":
        return "⚠️";
      case "medium":
        return "⚡";
      default:
        return "❌";
    }
  };

  private getErrorColor = (severity: string): string => {
    switch (severity) {
      case "critical":
        return "#DC2626"; // Rouge foncé
      case "high":
        return "#EF4444"; // Rouge
      case "medium":
        return "#F59E0B"; // Orange
      default:
        return "#6B7280"; // Gris
    }
  };

  override render() {
    if (this.state.hasError && this.state.error) {
      const severity = this.getErrorSeverity(this.state.error);
      const errorIcon = this.getErrorIcon(severity);
      const errorColor = this.getErrorColor(severity);
      const canRetry = this.state.retryCount < this.maxRetries;

      return (
        <SafeAreaView
          style={[
            tw`flex-1 justify-center items-center px-6`,
            { backgroundColor: "#000000" }, // Fond noir pour l'écran d'enregistrement
          ]}
        >
          {/* Icône d'erreur */}
          <View
            style={[
              tw`w-20 h-20 rounded-full items-center justify-center mb-6`,
              { backgroundColor: errorColor },
            ]}
          >
            <UIText size="xl" style={tw`text-white`}>
              {errorIcon}
            </UIText>
          </View>

          {/* Titre */}
          <HeadingText
            size="lg"
            weight="semibold"
            style={[tw`text-center mb-4 text-white`]}
          >
            Erreur de l'application
          </HeadingText>

          {/* Message d'erreur */}
          <UIText size="base" style={[tw`text-center mb-2 text-gray-300`]}>
            {this.state.error.message}
          </UIText>

          {/* Informations de debug (en mode développement) */}
          {__DEV__ && (
            <View style={tw`bg-gray-800 p-4 rounded-lg mb-6 w-full`}>
              <UIText size="xs" style={tw`text-gray-400 text-center mb-2`}>
                Debug Info (DEV only)
              </UIText>
              <UIText size="xs" style={tw`text-gray-300`}>
                Severity: {severity} | Retries: {this.state.retryCount}/
                {this.maxRetries}
              </UIText>
              {this.state.error.stack && (
                <UIText
                  size="xs"
                  style={tw`text-gray-400 mt-2`}
                  numberOfLines={3}
                >
                  {this.state.error.stack.substring(0, 200)}...
                </UIText>
              )}
            </View>
          )}

          {/* Boutons d'action */}
          <View style={tw`w-full gap-4`}>
            {canRetry && (
              <TouchableOpacity
                style={[
                  tw`py-4 px-8 rounded-full`,
                  { backgroundColor: "#10B981" }, // Vert pour retry
                ]}
                onPress={this.handleManualRetry}
              >
                <UIText
                  size="base"
                  weight="semibold"
                  style={tw`text-center text-white`}
                >
                  🔄 Réessayer ({this.maxRetries - this.state.retryCount}{" "}
                  restants)
                </UIText>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                tw`py-4 px-8 rounded-full`,
                { backgroundColor: "#6B7280" }, // Gris pour reset
              ]}
              onPress={this.handleReset}
            >
              <UIText
                size="base"
                weight="semibold"
                style={tw`text-center text-white`}
              >
                🏠 Retour à l'accueil
              </UIText>
            </TouchableOpacity>
          </View>

          {/* Message d'aide */}
          <UIText size="sm" style={[tw`text-center mt-6 text-gray-400`]}>
            Si le problème persiste, redémarrez l'application
          </UIText>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}
