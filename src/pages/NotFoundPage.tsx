import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="container-luxury py-32 text-center animate-fade-in">
      <p className="font-serif text-8xl md:text-9xl font-light text-ink-200 mb-4">404</p>
      <h1 className="heading-display text-3xl md:text-4xl text-ink-900 mb-4">Page Not Found</h1>
      <p className="text-sm text-ink-500 mb-8 max-w-md mx-auto">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link to="/" className="btn-primary">Return Home</Link>
    </div>
  );
}
