import React, { Component, ReactNode } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { CodeText, UIText } from "../ui/Typography";

import { createOptimizedLogger } from '../../utils/optimizedLogger';
const logger = createOptimizedLogger('ErrorBoundary');

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: any) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    // Met à jour le state pour afficher l'UI de fallback
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: any) {
    // Appeler le callback d'erreur personnalisé si fourni
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    logger.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleRestart = () => {
    this.setState({ hasError: false, error: null });
  };

  override render() {
    if (this.state.hasError) {
      // Afficher l'UI de fallback personnalisée ou par défaut
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View style={styles.container}>
          <View style={styles.errorContainer}>
            <UIText
              size="xl"
              weight="bold"
              color="#333"
              align="center"
              style={styles.title}
            >
              Oops! Une erreur s'est produite
            </UIText>
            <UIText
              size="base"
              color="#666"
              align="center"
              style={styles.message}
            >
              L'application a rencontré un problème inattendu.
            </UIText>

            {__DEV__ && this.state.error && (
              <View style={styles.debugContainer}>
                <UIText
                  size="sm"
                  weight="bold"
                  color="#333"
                  style={styles.debugTitle}
                >
                  Détails de l'erreur (dev):
                </UIText>
                <CodeText size="xs" color="#666">
                  {this.state.error.message}
                </CodeText>
                <CodeText size="xs" color="#666">
                  {this.state.error.stack}
                </CodeText>
              </View>
            )}

            <TouchableOpacity
              style={styles.restartButton}
              onPress={this.handleRestart}
            >
              <UIText size="base" weight="semibold" color="white">
                Redémarrer
              </UIText>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    padding: 20,
  },
  errorContainer: {
    backgroundColor: "white",
    padding: 24,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    maxWidth: 400,
    width: "100%",
  },
  title: {
    marginBottom: 12,
  },
  message: {
    lineHeight: 24,
    marginBottom: 24,
  },
  debugContainer: {
    backgroundColor: "#f8f8f8",
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  debugTitle: {
    marginBottom: 8,
  },
  restartButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
  },
});

// HOC pour wrapper facilement les composants
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary fallback={fallback}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${
    Component.displayName || Component.name
  })`;

  return WrappedComponent;
};

export default ErrorBoundary;
