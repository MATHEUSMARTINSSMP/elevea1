import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Zap, 
  Server, 
  MapPin, 
  MessageCircle, 
  BarChart3, 
  HeadphonesIcon,
  Code,
  Shield
} from 'lucide-react';

const Features = () => {
  const features = [
    {
      icon: Zap,
      title: 'Sites rápidos e elegantes',
      description: 'Design responsivo e carregamento otimizado para melhor experiência'
    },
    {
      icon: Server,
      title: 'Hospedagem e domínio inclusos',
      description: 'SSL, hospedagem segura e domínio próprio já incluídos no plano'
    },
    {
      icon: MapPin,
      title: 'Google Meu Negócio configurado',
      description: 'Apareça no mapa do Google e seja encontrado localmente'
    },
    {
      icon: MessageCircle,
      title: 'Chat FAQ + WhatsApp',
      description: 'Atendimento automatizado 24h com fallback para WhatsApp'
    },
    {
      icon: BarChart3,
      title: 'Relatórios e QR Code',
      description: 'Acompanhe visitas e facilite o acesso com QR Code personalizado'
    },
    {
      icon: HeadphonesIcon,
      title: 'Suporte humano próximo',
      description: 'Atendimento personalizado com pessoas reais que entendem seu negócio'
    }
  ];

  return (
    <section id="diferenciais" className="py-16 bg-gradient-section">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 animate-fade-in">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Por que escolher nossa <span className="bg-gradient-primary bg-clip-text text-transparent">agência?</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto mb-6">
            Agências tradicionais cobram até R$2.000 só pra criar o site e depois somem. 
            Nós entregamos mais por menos e garantimos suporte e atualização contínua.
          </p>
          <Badge className="bg-primary/10 text-primary hover:bg-primary/20">
            Modelo moderno: não é só mais barato, é acessível + recorrente + suporte contínuo
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {features.map((feature, index) => (
            <Card key={index} className="hover:shadow-card transition-all duration-300 hover:-translate-y-1 card-gradient group">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="bg-card rounded-xl p-8 border border-primary/20 shadow-soft">
          <div className="flex items-start gap-6">
            <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center flex-shrink-0">
              <Code className="w-8 h-8 text-white" />
            </div>
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">
                Tecnologia moderna por trás do seu site
              </h3>
              <p className="text-muted-foreground">
                Nossos sites não são feitos em plataformas amadoras. Usamos React e TailwindCSS, 
                tecnologias usadas por startups e empresas modernas. Hospedagem em nuvem (Netlify) 
                garante velocidade, segurança e SSL incluso. Cada cliente tem um repositório exclusivo 
                no GitHub, o que significa organização e independência.
              </p>
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium text-primary">
                  Sites rápidos, seguros e preparados para crescer
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center mt-12">
          <Card className="inline-block bg-gradient-primary text-white border-0 shadow-elegant">
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold mb-2">Garantia de Satisfação</h3>
              <p className="text-white/90 mb-4">
                Se não ficar satisfeito com seu site nos primeiros 30 dias, devolvemos seu investimento. 
                Sem perguntas, sem burocracia.
              </p>
              <Badge className="bg-white/20 text-white hover:bg-white/30">
                Suporte dedicado incluído
              </Badge>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default Features;