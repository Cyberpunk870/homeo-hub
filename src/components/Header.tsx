import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Image } from '@/components/ui/image';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<'noida' | 'delhi'>('noida');
  const location = useLocation();

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Inventory', path: '/inventory' },
    { name: 'Stock Management', path: '/stock-management' },
    { name: 'Alerts', path: '/alerts' },
    { name: 'Prescriptions', path: '/prescriptions' },
    { name: 'Reports', path: '/reports' },
    { name: 'About', path: '/about' }
  ];

  const isActive = (path: string) => location.pathname === path;

  const isHomePage = location.pathname === '/';

  return (
    <header className="w-full bg-primary border-b border-secondary/30 sticky top-0 z-50">
      <div className="max-w-[120rem] mx-auto px-8 py-6">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-4">
            <div>
              <h1 className="font-heading text-2xl text-foreground">Dr. Upadhyaya's</h1>
              <p className="font-paragraph text-sm text-foreground/80">Homeopathy</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          {!isHomePage && (
            <nav className="hidden lg:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`font-paragraph text-base transition-colors ${
                    isActive(link.path)
                      ? 'text-accent-gold font-medium'
                      : 'text-foreground/80 hover:text-accent-gold'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
            </nav>
          )}

          {/* Location Selector & Mobile Menu */}
          <div className="flex items-center gap-4">
            {/* Location Selector */}
            {!isHomePage && (
              <div className="hidden md:flex items-center gap-2 bg-secondary px-4 py-2 rounded-lg">
                <MapPin className="w-4 h-4 text-accent-gold" />
                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value as 'noida' | 'delhi')}
                  className="font-paragraph text-sm bg-transparent border-none outline-none cursor-pointer text-foreground"
                >
                  <option value="noida">Noida</option>
                  <option value="delhi">Delhi</option>
                </select>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2 text-foreground hover:text-accent-gold transition-colors"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="lg:hidden mt-6 pb-4 space-y-4 border-t border-secondary/30 pt-6">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsMenuOpen(false)}
                className={`block font-paragraph text-base py-2 transition-colors ${
                  isActive(link.path)
                    ? 'text-accent-gold font-medium'
                    : 'text-foreground/80 hover:text-accent-gold'
                }`}
              >
                {link.name}
              </Link>
            ))}
            
            {/* Mobile Location Selector */}
            {!isHomePage && (
              <div className="flex items-center gap-2 bg-secondary px-4 py-3 rounded-lg md:hidden">
                <MapPin className="w-4 h-4 text-accent-gold" />
                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value as 'noida' | 'delhi')}
                  className="font-paragraph text-sm bg-transparent border-none outline-none cursor-pointer text-foreground flex-1"
                >
                  <option value="noida">Noida Clinic</option>
                  <option value="delhi">Delhi Clinic</option>
                </select>
              </div>
            )}
          </nav>
        )}
      </div>
    </header>
  );
}
