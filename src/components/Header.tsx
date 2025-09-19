import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import { WHATSAPP_URL } from '@/lib/whatsapp';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const menuItems = [
    { name: 'Sobre', href: '#sobre' },
    { name: 'Por que Digital', href: '#digital' },
    { name: 'Planos', href: '#planos' },
    { name: 'Diferenciais', href: '#diferenciais' },
    { name: 'Depoimentos', href: '#depoimentos' },
    { name: 'Como Funciona', href: '#como-funciona' },
    { name: 'FAQ', href: '#faq' },
    { name: 'Contato', href: '#contato' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* LOGO */}
          <a
            href="#topo"
            className="flex-shrink-0 flex items-center"
            aria-label="Ir para o topo"
          >
            <img
              src="/logo-elevea.png"
              alt="Logo Elevea"
              className="h-10 w-auto"
              loading="eager"
              decoding="sync"
            />
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {menuItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-muted-foreground hover:text-primary transition-smooth text-sm font-medium"
              >
                {item.name}
              </a>
            ))}
          </nav>

          {/* CTA Desktop */}
          <div className="hidden md:flex items-center">
            <Button asChild size="sm" className="btn-gold">
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
                Falar Conosco
              </a>
            </Button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-expanded={isMenuOpen}
              aria-label={isMenuOpen ? 'Fechar menu' : 'Abrir menu'}
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 space-y-4 border-t border-border">
            {menuItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="block text-muted-foreground hover:text-primary transition-smooth text-sm font-medium py-2"
              >
                {item.name}
              </a>
            ))}
            <div className="pt-4">
              <Button asChild size="sm" className="w-full btn-gold">
                <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
                  Falar Conosco
                </a>
              </Button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
