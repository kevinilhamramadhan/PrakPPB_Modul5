import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    this.setState({ error, info });
    // You can also log error to a service here
    // console.error('Uncaught error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-red-50">
          <div className="max-w-2xl w-full bg-white rounded-xl shadow-md border border-red-100 p-6">
            <h2 className="text-xl font-semibold text-red-700 mb-2">Terjadi kesalahan pada aplikasi</h2>
            <p className="text-sm text-slate-600 mb-4">Aplikasi gagal dirender. Silakan lihat detail kesalahan di konsol browser.</p>
            <details className="text-xs text-slate-500 whitespace-pre-wrap">
              <summary className="cursor-pointer text-sm text-red-600">Tampilkan detail error</summary>
              {this.state.error && this.state.error.toString()}
              {this.state.info && this.state.info.componentStack}
            </details>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
