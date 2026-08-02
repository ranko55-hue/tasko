import { Component } from 'react';
import { he } from '../../locales/he';
import Button from './Button';
import Icon from '../ui/Icon';

// גבול שגיאה ברמת האפליקציה. כל חריגה בזמן רינדור נתפסת כאן
// ומוצג מסך שגיאה בעברית במקום מסך לבן.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('Unhandled UI error:', error, info?.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
        <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-sm">
          <div className="mb-3 flex justify-center text-statusRed">
            <Icon name="alert" size="xl" />
          </div>
          <h1 className="mb-2 text-xl font-black text-slate-900">{he.crash.title}</h1>
          <p className="mb-6 text-slate-600">{he.crash.message}</p>
          <Button onClick={() => window.location.reload()}>
            {he.crash.refresh}
          </Button>
        </div>
      </div>
    );
  }
}
