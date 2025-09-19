import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star, Quote } from 'lucide-react';
import { waMessage } from '@/lib/whatsapp';

const testimonials = [
  {
    name: 'Maria Silva',
    business: 'Salão de Beleza Glamour',
    quote:
      'Depois do site, minhas clientes me encontram muito mais fácil. O WhatsApp não para de tocar!',
    rating: 5,
  },
  {
    name: 'João Santos',
    business: 'Oficina Santos & Cia',
    quote:
      'Site profissional, suporte excelente. Recomendo para qualquer negócio que quer crescer.',
    rating: 5,
  },
  {
    name: 'Ana Costa',
    business: 'Consultório Dra. Ana',
    quote:
      'O Google Meu Negócio configurado foi um diferencial. Apareço nas buscas locais agora.',
    rating: 5,
  },
];

const Testimonials = () => {
  return (
    <section id="depoimentos" className="py-16 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 animate-fade-in">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            O que nossos{' '}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              clientes dizem
            </span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Mais de 50 negócios locais já transformaram sua presença digital
            conosco.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {testimonials.map((testimonial, index) => (
            <Card
              key={index}
              className="hover:shadow-card transition-all duration-300 hover:-translate-y-1 card-gradient relative overflow-hidden"
            >
              <div className="absolute top-4 right-4 opacity-10">
                <Quote className="w-12 h-12 text-primary" />
              </div>

              <CardContent className="p-6 relative">
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-4 h-4 text-yellow-400 fill-current"
                    />
                  ))}
                </div>

                <blockquote className="text-muted-foreground mb-6 italic">
                  "{testimonial.quote}"
                </blockquote>

                <div className="border-t pt-4">
                  <div className="font-semibold text-foreground">
                    {testimonial.name}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {testimonial.business}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center animate-fade-in">
          <h3 className="text-xl font-semibold mb-4">
            Seja o próximo caso de sucesso
          </h3>
          <p className="text-muted-foreground mb-6">
            Junte-se aos negócios que já estão crescendo com uma presença
            digital profissional.
          </p>

          {/* CTA -> WhatsApp */}
          <Button asChild size="lg" className="bg-gradient-primary hover:opacity-90 text-white shadow-elegant">
            <a
              href={waMessage('Quero meu site também! Pode me explicar como começamos?')}
              target="_blank"
              rel="noopener noreferrer"
            >
              Quero meu site também
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
