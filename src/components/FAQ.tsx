import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, CreditCard, Users, Calendar } from 'lucide-react';
import { waMessage } from '@/lib/whatsapp';

const faqData = [
  {
    question: 'Preciso ter CNPJ para ter um site?',
    answer:
      'Não é obrigatório ter CNPJ. Atendemos tanto pessoas físicas quanto jurídicas. Para o domínio .com.br, é necessário CPF ou CNPJ, mas oferecemos outras extensões como .com que não exigem documentação específica.',
  },
  {
    question: 'Quanto tempo leva para o site ficar pronto?',
    answer:
      'Seu site fica pronto em até 7 dias úteis! Trabalhamos com agilidade para que você comece a aparecer no Google o quanto antes. O prazo pode ser ainda menor dependendo da complexidade e disponibilidade dos materiais.',
  },
  {
    question: 'Vocês fazem a configuração do Google Meu Negócio?',
    answer:
      'Sim! Nos planos VIP, fazemos a configuração inicial completa do Google Meu Negócio, incluindo cadastro, otimização, adição de fotos e configuração para aparecer nas buscas locais. Isso é essencial para ser encontrado na sua região.',
  },
  {
    question: 'Como funciona a cobrança recorrente?',
    answer:
      'Funciona igual Netflix! Cobrança automática mensal no cartão de crédito ou Pix recorrente. Sem surpresas, sem taxas extras. Você recebe o boleto/cobrança sempre na mesma data do mês. É prático e seguro.',
  },
  {
    question: 'Posso cancelar quando quiser?',
    answer:
      'Sim, mas temos fidelidade de 3 meses no plano mensal (substituindo a taxa de adesão). Após esse período, você pode cancelar a qualquer momento. No plano anual, a fidelidade é de 12 meses com desconto compensatório.',
  },
  {
    question: 'O que acontece se eu deixar de pagar?',
    answer:
      'Seu site fica suspenso temporariamente após o vencimento. Você tem 30 dias para regularizar sem perder nada. Após esse prazo, fazemos backup completo dos seus dados e removemos o site do ar. Você sempre pode reativar posteriormente.',
  },
  {
    question: 'Por que não tem taxa de adesão?',
    answer:
      'Eliminamos a taxa de adesão e criamos um modelo mais justo: fidelidade de apenas 3 meses no plano mensal. Assim você paga menos no início e tem mais flexibilidade. É o modelo moderno de negócios digitais.',
  },
  {
    question: 'A primeira alteração do mês está incluída?',
    answer:
      'Sim! Nos planos VIP, a primeira alteração de cada mês está incluída sem custo extra. Pode ser mudança de texto, troca de foto, atualização de informações, etc. Alterações maiores (como novas páginas) são cobradas à parte.',
  },
  {
    question: 'Qual é a forma de pagamento?',
    answer:
      'Aceitamos cartão de crédito (cobrança recorrente automática) e Pix recorrente. Para o primeiro pagamento, também aceitamos Pix comum. Todas as formas são 100% seguras e processadas por gateways certificados.',
  },
  {
    question: 'O site ficará no meu nome?',
    answer:
      'Sim! O domínio é registrado no seu CPF/CNPJ quando possível. Você tem acesso ao GitHub com todo o código fonte. Se decidir migrar, fornecemos todos os acessos e arquivos. Você não fica refém da nossa empresa.',
  },
];

const FAQ = () => {
  const [openItems, setOpenItems] = useState<string[]>([]);

  const highlights = [
    {
      icon: CreditCard,
      title: 'Cobrança Recorrente',
      description: 'Tipo Netflix - automática no cartão/Pix',
      color: 'bg-blue-500',
    },
    {
      icon: Users,
      title: 'Fidelidade Justa',
      description: 'Apenas 3 meses no plano mensal',
      color: 'bg-green-500',
    },
    {
      icon: Calendar,
      title: 'Sem Taxa de Adesão',
      description: 'Modelo moderno e transparente',
      color: 'bg-purple-500',
    },
  ];

  return (
    <section id="faq" className="py-16 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 animate-fade-in">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Perguntas{' '}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Frequentes
            </span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Esclarecemos as principais dúvidas sobre nossos serviços e processo.
          </p>
        </div>

        {/* Commercial Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {highlights.map((highlight, index) => (
            <Card
              key={index}
              className="text-center hover:shadow-card transition-all duration-300 card-gradient"
            >
              <CardContent className="p-6">
                <div
                  className={`mx-auto w-12 h-12 ${highlight.color} rounded-full flex items-center justify-center mb-4`}
                >
                  <highlight.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold mb-2">{highlight.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {highlight.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="max-w-4xl mx-auto">
          <Accordion type="multiple" value={openItems} onValueChange={setOpenItems}>
            {faqData.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="border-border">
                <AccordionTrigger className="text-left hover:text-primary transition-colors">
                  <span className="font-medium">{faq.question}</span>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        {/* WhatsApp CTA */}
        <div className="text-center mt-12 space-y-4 animate-fade-in">
          <p className="text-muted-foreground">
            Não encontrou a resposta que procurava?
          </p>
          <Button
            asChild
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <a
              href={waMessage(
                'Olá! Tenho uma dúvida que não encontrei no FAQ. Pode me ajudar?'
              )}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Fale conosco no WhatsApp
            </a>
          </Button>
        </div>

        {/* Special Offer Banner */}
        <div className="mt-16">
          <Card className="bg-gradient-primary text-white border-0 shadow-elegant">
            <CardContent className="p-8 text-center">
              <div className="max-w-3xl mx-auto">
                <Badge className="bg-white/20 text-white hover:bg-white/30 mb-4">
                  🎯 Oferta Especial
                </Badge>
                <h3 className="text-2xl font-bold mb-4">
                  Modelo de Cobrança Revolucionário
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                  <div className="space-y-2">
                    <h4 className="font-semibold">✅ Como fazemos:</h4>
                    <ul className="text-white/90 text-sm space-y-1">
                      <li>• Cobrança recorrente automática</li>
                      <li>• SEM taxa de adesão</li>
                      <li>• Fidelidade de apenas 3 meses</li>
                      <li>• 1ª alteração mensal incluída</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold">❌ Como outras agências:</h4>
                    <ul className="text-white/90 text-sm space-y-1">
                      <li>• R$ 2.000+ só para criar</li>
                      <li>• Taxa de adesão abusiva</li>
                      <li>• Sem suporte contínuo</li>
                      <li>• Cada alteração custa caro</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default FAQ;
