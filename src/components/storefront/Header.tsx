import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ShoppingBag, Search, User, Menu, X } from 'lucide-react';

interface HeaderProps {
  cartCount: number;
  onSearchClick: () => void;
}

export default function Header({ cartCount, onSearchClick }: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/shop', label: 'Shop' },
    { to: '/categories', label: 'Categories' },
    { to: '/about', label: 'About' },
    { to: '/contact', label: 'Contact' },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-ivory-50/95 backdrop-blur-md border-b border-ink-100'
          : 'bg-ivory-50/80 backdrop-blur-sm'
      }`}
    >
      <div className="container-luxury">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Mobile menu button */}
          <button
            className="lg:hidden p-2 -ml-2"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Menu"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          {/* Logo */}
          <Link to="/" className="flex-1 lg:flex-none text-center lg:text-left">
            <span className="font-serif text-2xl lg:text-3xl font-light tracking-widest text-ink-900">
              NEXAMART
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-8 flex-1 justify-center">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`text-2xs font-medium uppercase tracking-widest transition-colors duration-200 ${
                  location.pathname === link.to
                    ? 'text-ink-900'
                    : 'text-ink-400 hover:text-ink-900'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right icons */}
          <div className="flex items-center gap-3 lg:gap-4">
            <button
              onClick={onSearchClick}
              className="p-2 hover:text-champagne-600 transition-colors"
              aria-label="Search"
            >
              <Search size={18} />
            </button>
            <Link
              to="/admin/login"
              className="p-2 hover:text-champagne-600 transition-colors"
              aria-label="Account"
            >
              <User size={18} />
            </Link>
            <Link
              to="/cart"
              className="p-2 hover:text-champagne-600 transition-colors relative"
              aria-label="Cart"
            >
              <ShoppingBag size={18} />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-ink-900 text-ivory-50 text-2xs w-4 h-4 flex items-center justify-center rounded-full font-medium">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Mobile nav */}
        {mobileOpen && (
          <nav className="lg:hidden border-t border-ink-100 py-4 animate-fade-in">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`block py-3 text-sm font-medium uppercase tracking-widest transition-colors ${
                  location.pathname === link.to
                    ? 'text-ink-900'
                    : 'text-ink-400 hover:text-ink-900'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
}
