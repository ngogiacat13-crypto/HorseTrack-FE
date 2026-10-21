import React from 'react';
import PropTypes from 'prop-types';
import { Icon } from './ui/Icon';

interface Props { children: React.ReactNode }
interface State { error: Error | null }

export class ErrorBoundary extends React.Component<Props, State> {
  static propTypes = { children: PropTypes.node };

  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="ht ht-page">
        <div className="ht-callout ht-callout--danger" role="alert" style={{ maxWidth: 640 }}>
          <Icon name="alert" />
          <span>
            <span className="ht-callout__title">Trang này gặp lỗi khi hiển thị.</span>
            {this.state.error.message}
            <br />
            <button type="button" className="ht-btn ht-btn--secondary ht-btn--sm" style={{ marginTop: 10 }} onClick={() => window.location.reload()}>
              Tải lại trang
            </button>
          </span>
        </div>
      </div>
    );
  }
}
