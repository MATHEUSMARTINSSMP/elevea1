import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Upload, Rocket, Search, CheckCircle, MessageCircle, Clock } from 'lucide-react';

const steps = [
  {
    number: '01',
    icon: CreditCard,
    title: 'Escolha seu plano',
    description: 'Selecione o plano ideal para seu negócio e faça o pagamento seguro'
  },
  {
    number: '02',
    icon: Upload,
    title: 'Envie seus dados',
    description: 'Logo, endereço, serviços e qualquer material que você já tenha'
  },
  {
    number: '03',
    icon: Rocket,
    title: 'Site no ar em 7 dias',
    description: 'Criamos e publicamos seu site profissional em até uma semana'
  },
  {
    number: '04',
    icon: Search,
    title: 'Apareça no Google',
    description: 'Seu negócio já estará visível no Google e pronto para receber clientes'
  }
];

const features = [
  {
    icon: Clock,
    title: 'Processo ágil',
    description: 'Entrega rápida sem comprometer a qualidade'
  },
  {
    icon: MessageCircle,
    title: 'Comunicação transparente',
    description: 'Você acompanha cada etapa do desenvolvimento'
  },
  {
    icon: CheckCircle,
    title: 'Entrega garantida',
    description: 'Seu site fica pronto na data prometida'
  }
];

const HowItWorks = () => {
  return (
    <section id="como-funciona" className="py-16 bg-gradient-section">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Como <span className="bg-gradient-primary bg-clip-text text-transparent">funciona?</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Um processo simples e transparente para colocar seu negócio no digital rapidamente.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              <Card className="hover:shadow-card transition-all duration-300 hover:-translate-y-1 card-gradient h-full">
                <CardContent className="p-6 text-center h-full flex flex-col">
                  <div className="mb-4">
                    <div className="relative mx-auto w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mb-4">
                      <step.icon className="w-8 h-8 text-white" />
                      <div className="absolute -top-2 -right-2 w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                        <span className="text-xs font-bold text-white">{step.number}</span>
                      </div>
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-semibold mb-3">{step.title}</h3>
                  <p className="text-sm text-muted-foreground flex-grow">{step.description}</p>
                </CardContent>
              </Card>
              
              {/* Connection line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-primary opacity-30 transform -translate-y-1/2 z-10"></div>
              )}
            </div>
          ))}
        </div>

        <div className="text-center mb-12">
          <Badge className="bg-primary/10 text-primary hover:bg-primary/20 text-lg px-6 py-2">
            <Clock className="w-5 h-5 mr-2" />
            Pronto em 7 dias ou menos
          </Badge>
        </div>

        <div className="max-w-4xl mx-auto">
          <Card className="bg-gradient-primary text-white border-0 shadow-elegant">
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold mb-4">
                  Trabalhamos com agilidade para que você comece a aparecer no Google e receber mais clientes o quanto antes.
                </h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {features.map((feature, index) => (
                  <div key={index} className="text-center">
                    <div className="mx-auto w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mb-4">
                      <feature.icon className="w-6 h-6 text-white" />
                    </div>
                    <h4 className="font-semibold mb-2">{feature.title}</h4>
                    <p className="text-white/80 text-sm">{feature.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;