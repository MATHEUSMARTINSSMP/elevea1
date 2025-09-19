import { Card, CardContent } from '@/components/ui/card';
import { Users, TrendingUp, Shield, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WHATSAPP_URL } from '@/lib/whatsapp';

const About = () => {
  const stats = [
    { label: 'Pequenos negócios sem site', value: '60%', icon: TrendingUp },
    { label: 'Sites criados', value: '+50', icon: Users },
    { label: 'Tempo de entrega', value: '7 dias', icon: Clock },
    { label: 'Garantia', value: '30 dias', icon: Shield },
  ];

  return (
    <section id="sobre" className="py-16 bg-gradient-section">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6 animate-fade-in">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Democratizando a <span className="bg-gradient-primary bg-clip-text text-transparent">presença digital</span>
              </h2>
              <p className="text-lg text-muted-foreground mb-6">
                Nossa missão é democratizar a presença digital para negócios locais, oferecendo soluções completas e acessíveis.
              </p>
            </div>

            <div className="space-y-4">
              <p className="text-muted-foreground">
                Mais de 60% dos pequenos negócios ainda não têm site ou presença no Google. Nós mudamos isso.
              </p>
              
              <p className="text-muted-foreground">
                Entendemos as necessidades específicas de pequenos e médios empresários. Por isso, criamos soluções que são ao mesmo tempo profissionais, acessíveis e fáceis de gerenciar.
              </p>
            </div>

            <div className="bg-muted/50 p-6 rounded-lg border-l-4 border-primary space-y-4">
              <div>
                <h4 className="font-semibold mb-2">"Vou fazer pelo Wix mesmo"</h4>
                <p className="text-sm text-muted-foreground">
                  Ferramentas como Wix e Loja Integrada vendem facilidade, mas na prática exigem conhecimento técnico, 
                  geram perda de tempo e resultado amador. Você acaba gastando horas configurando, lutando com bugs e 
                  tendo um site lento e mal posicionado no Google. O "barato" sai caro.
                </p>
              </div>

              <Button asChild size="lg" className="btn-gold shadow-elegant">
                <a 
                  href={WHATSAPP_URL} 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  Quero meu site profissional
                </a>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 animate-slide-up">
            {stats.map((stat, index) => (
              <Card key={index} className="text-center hover:shadow-card transition-all duration-300 card-gradient">
                <CardContent className="p-6">
                  <div className="mx-auto w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center mb-4">
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-2xl font-bold text-primary mb-2">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
