import { Button } from '@/components/ui/button';
import { WHATSAPP_URL } from '@/lib/whatsapp';
import heroMockup from '@/assets/hero-mockup.jpg';

const Hero = () => {
  return (
    <section className="pt-24 pb-16 bg-gradient-section" id="topo">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8 animate-fade-in">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                Transforme seu{' '}
                <span className="bg-gradient-primary bg-clip-text text-transparent">
                  Negócio Local
                </span>{' '}
                em Sucesso Digital
              </h1>

              <p className="text-lg md:text-xl text-muted-foreground max-w-lg">
                A Agência Elevea democratiza a presença digital para pequenos negócios. 
                Sites profissionais, Google Meu Negócio e atendimento automatizado - tudo em um só lugar.
              </p>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4">
              {/* WhatsApp */}
              <Button asChild size="lg" className="btn-gold shadow-elegant">
                <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
                  Fale conosco no WhatsApp
                </a>
              </Button>

              {/* Scroll para planos */}
              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-primary text-primary hover:bg-primary/10"
              >
                <a href="#planos">Ver Planos</a>
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 pt-8 border-t border-border">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">+50</div>
                <div className="text-sm text-muted-foreground">Sites Criados</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">100%</div>
                <div className="text-sm text-muted-foreground">Responsivos</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">7 dias</div>
                <div className="text-sm text-muted-foreground">Para publicar</div>
              </div>
            </div>
          </div>

          {/* Mockup */}
          <div className="relative animate-float">
            <div className="relative">
              <img
                src={heroMockup}
                alt="Mockup de site em notebook e celular"
                className="w-full h-auto rounded-xl shadow-card"
              />
              <div className="absolute inset-0 bg-gradient-primary opacity-10 rounded-xl"></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
