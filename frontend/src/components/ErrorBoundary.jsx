import { Component } from "react";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      message: error?.message || "Erreur d'affichage",
    };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {this.props.fallback ||
            `Une partie de l'interface a rencontré une erreur: ${this.state.message}`}
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
