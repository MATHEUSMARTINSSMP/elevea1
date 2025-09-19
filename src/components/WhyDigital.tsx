import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Search, Award, MessageCircle, TrendingUp, AlertTriangle, Clock } from 'lucide-react';

const WhyDigital = () => {
  const benefits = [
    {
      icon: Search,
      title: 'Visibilidade no Google',
      description: 'Apareça nas pesquisas locais e seja encontrado pelos seus clientes'
    },
    {
      icon: Award,
      title: 'Credibilidade para o negócio',
      description: 'Um site profissional transmite confiança e seriedade'
    },
    {
      icon: MessageCircle,
      title: 'Facilidade de contato',
      description: 'WhatsApp integrado para facilitar o contato direto'
    },
    {
      icon: TrendingUp,
      title: 'Diferenciação da concorrência',
      description: 'Destaque-se com uma presença digital profissional'
    }
  ];

  return (
    <section id="digital" className="py-16 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 animate-fade-in">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Por que estar no <span className="bg-gradient-primary bg-clip-text text-transparent">digital?</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Hoje, seus clientes procuram serviços online. Não estar no digital significa perder oportunidades todos os dias.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {benefits.map((benefit, index) => (
            <Card
              key={index}
              className="text-center hover:shadow-card transition-all duration-300 hover:-translate-y-1 card-gradient group"
            >
              <CardHeader className="pb-4">
                <div className="mx-auto w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <benefit.icon className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-lg">{benefit.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">{benefit.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-amber-800 dark:text-amber-200 mb-2">
                      "Fazer sozinho parece fácil, mas é complicado"
                    </h4>
                    <p className="text-amber-700 dark:text-amber-300 text-sm">
                      Tentar sozinho resulta em sites lentos, mal posicionados no Google e pouco confiáveis.
                      Existe uma complexidade técnica escondida (SEO, segurança, otimização) que só especialistas dominam.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Clock className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-red-800 dark:text-red-200 mb-2">
                      Não fique para trás
                    </h4>
                    <p className="text-red-700 dark:text-red-300 text-sm mb-4">
                      Enquanto você pensa, seus concorrentes já estão sendo encontrados online.
                      Comece sua presença digital hoje mesmo.
                    </p>

                    {/* Botão: scroll para a seção de planos */}
                    <Button asChild size="sm" className="btn-gold">
                      <a href="#planos">Ver nossos planos</a>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhyDigital;
