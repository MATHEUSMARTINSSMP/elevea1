import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Star, Zap } from 'lucide-react';
import { waMessage } from '@/lib/whatsapp';

type Plan = {
  name: string;
  price: string;
  period: string;
  description: string;
  badge?: { text: string; icon: any };
  features: string[];
  buttonText: string;
  buttonVariant: 'default' | 'outline';
  url: string; // Mercado Pago
};

const plans: Plan[] = [
  {
    name: 'Essencial',
    price: 'R$ 50',
    period: '/mês',
    description: 'Perfeito para começar sua presença digital',
    badge: { text: 'SEM TAXA DE ADESÃO', icon: Check },
    features: [
      'Site institucional one-page',
      'Hospedagem + SSL gratuita',
      'Responsivo (desktop e mobile)',
      'Subdomínio da agência',
      'Suporte básico (correção de erros)',
      'SEM taxa de adesão',
    ],
    buttonText: 'Assinar Essencial',
    buttonVariant: 'outline',
    url: 'https://www.mercadopago.com.br/subscriptions/checkout?preapproval_plan_id=e65f6f36b2704f36b1b8d1dc78586011',
  },
  {
    name: 'VIP Mensal',
    price: 'R$ 120',
    period: '/mês',
    description: 'Mais completo e recomendado',
    badge: { text: 'MAIS ESCOLHIDO', icon: Star },
    features: [
      'Tudo do plano Essencial',
      'Domínio próprio (.com.br) — configuração inclusa (domínio pago à parte)',
      'E-mail corporativo',
      'Google Meu Negócio (configuração inicial)',
      'Botão flutuante do WhatsApp',
      'Captação de leads (formulário → WhatsApp/Sheets)',
      'QR Code personalizado (site/WhatsApp)',

      // — intensificados conforme solicitado —
      'Contador de acessos em tempo real (site emite para nosso sistema e você acompanha no painel do cliente)',
      'Feedback do consumidor final (estrelas + comentário) — fale diretamente com o dono e gere conexão',
      'Autoedição (DIY): atualize textos, imagens e um FAQ inteligente sem depender de suporte',
      'Editor de tema: troque cores e fontes em poucos cliques (presets prontos)',
      // ————————————————

      'Relatório trimestral de acessos',
      'Atualizações periódicas a cada 3 meses',
      'Pagamento via Pix, Boleto ou Cartão',
      'Recorrência após fidelidade de apenas 3 meses',
      'SEM taxa de adesão',
    ],
    buttonText: 'Assinar VIP Mensal',
    buttonVariant: 'default',
    url: 'https://www.mercadopago.com.br/subscriptions/checkout?preapproval_plan_id=99dceb0e108a4f238a84fbef3e91bab8',
  },
  {
    name: 'VIP Anual',
    price: 'R$ 1.200',
    period: '/ano',
    description: '2 meses grátis + benefícios extras',
    badge: { text: 'MELHOR CUSTO-BENEFÍCIO', icon: Zap },
    features: [
      'Tudo do plano VIP Mensal',
      'Atualizações mensais (fotos e textos)',
      '1 página extra por ano',
      'Suporte prioritário (resposta rápida)',
      'Plaquinha física do Google Meu Negócio com QR Code (cortesia; frete à parte)',
      'SEM taxa de adesão',
      'Economia de R$ 240 por ano',
    ],
    buttonText: 'Contratar VIP Anual',
    buttonVariant: 'default',
    url: 'https://mpago.la/2tDKjT8',
  },
];

const Pricing = () => {
  return (
    <section id="planos" className="py-16 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 animate-fade-in">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Planos Simples e <span className="bg-gradient-primary bg-clip-text text-transparent">Acessíveis</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Escolha o plano ideal para o seu negócio. Todos incluem hospedagem, suporte e garantia de satisfação.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {plans.map((plan, index) => (
            <Card
              key={index}
              className={`relative transition-all duration-300 hover:shadow-elegant hover:-translate-y-2 ${
                plan.badge ? 'border-primary shadow-card' : 'border-border hover:border-primary/50'
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-gradient-primary text-white px-4 py-1">
                    <plan.badge.icon className="w-3 h-3 mr-1" />
                    {plan.badge.text}
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center pb-4">
                <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-primary">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
                <p className="text-muted-foreground mt-2">{plan.description}</p>
              </CardHeader>

              <CardContent className="space-y-6">
                <ul className="space-y-3">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start">
                      <Check className="w-5 h-5 text-primary mr-3 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  asChild
                  className={`w-full ${
                    plan.buttonVariant === 'default'
                      ? 'bg-gradient-primary hover:opacity-90 text-white shadow-elegant'
                      : ''
                  }`}
                  variant={plan.buttonVariant}
                  size="lg"
                >
                  <a href={plan.url} target="_blank" rel="noopener noreferrer">
                    {plan.buttonText}
                  </a>
                </Button>

                <p className="text-center text-xs text-muted-foreground">
                  Pagamento seguro via Mercado Pago.
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12 space-y-4 animate-fade-in">
          <p className="text-muted-foreground">Tem dúvidas sobre qual plano escolher?</p>
          <Button asChild variant="outline" className="border-primary text-primary hover:bg-primary/10">
            <a
              href={waMessage('Olá! Tenho dúvidas sobre qual plano escolher na Elevea. Pode me orientar?')}
              target="_blank"
              rel="noopener noreferrer"
            >
              Fale conosco para orientação
            </a>
          </Button>
        </div>

        <div className="mt-12 p-6 bg-gradient-card rounded-xl border border-primary/20">
          <div className="text-center">
            <h3 className="text-xl font-semibold mb-2 text-primary">Todos os planos SEM TAXA DE ADESÃO</h3>
            <p className="text-muted-foreground">
              Cobrança recorrente automática (tipo Netflix) •
              Sem taxa de adesão em nenhum plano •
              Fidelidade de apenas 3 meses no mensal •
              Pagamento via Pix, Boleto ou Cartão
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Pricing;
