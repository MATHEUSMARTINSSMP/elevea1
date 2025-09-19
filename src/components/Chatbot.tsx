import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Bot, ExternalLink } from 'lucide-react';
import { WHATSAPP_URL, waMessage } from '@/lib/whatsapp';

interface FAQItem {
  question: string;
  answer: string;
}

const faqItems: FAQItem[] = [
  {
    question: "Quanto custa um site?",
    answer:
      "Nossos planos começam em R$ 50/mês (Essencial) e vão até R$ 120/mês (VIP Mensal) ou R$ 1.200/ano (VIP Anual). Todos incluem hospedagem, suporte e SEM TAXA DE ADESÃO!",
  },
  {
    question: "Quanto tempo leva para ficar pronto?",
    answer:
      "Seu site fica pronto em até 7 dias! Trabalhamos com agilidade para que você comece a aparecer no Google o quanto antes.",
  },
  {
    question: "Preciso ter CNPJ?",
    answer:
      "Não é obrigatório! Atendemos tanto pessoas físicas quanto jurídicas. Para domínio .com.br é necessário CPF ou CNPJ, mas oferecemos outras extensões.",
  },
  {
    question: "Posso cancelar quando quiser?",
    answer:
      "Sim! Temos fidelidade de apenas 3 meses no plano mensal (super rápido). Após esse período, você pode cancelar a qualquer momento.",
  },
  {
    question: "O que acontece se eu parar de pagar?",
    answer:
      "Seu site fica suspenso temporariamente. Mas você tem 30 dias para regularizar sem perder nada. Após esse prazo, fazemos backup e removemos do ar.",
  },
  {
    question: "Vocês fazem alterações no site?",
    answer:
      "Sim! Alterações pequenas são sempre gratuitas. Alterações maiores têm custo adicional, mas sempre avisamos antes.",
  },
  {
    question: "Como funciona o pagamento?",
    answer:
      "Aceita Pix, Boleto ou Cartão de Crédito/Débito! A cobrança recorrente tipo Netflix inicia após o período de fidelidade. Sem surpresas!",
  },
];

const Chatbot = () => {
  const [selectedFAQ, setSelectedFAQ] = useState<number | null>(null);

  const handleFAQClick = (index: number) => {
    setSelectedFAQ(selectedFAQ === index ? null : index);
  };

  return (
    <section className="py-16 bg-gradient-section">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 animate-fade-in">
          <Badge className="mb-4 bg-primary/10 text-primary hover:bg-primary/20">
            <Bot className="w-4 h-4 mr-2" />
            Robô Inteligente em Ação
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Veja nosso <span className="bg-gradient-primary bg-clip-text text-transparent">atendimento automático</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Experimente agora mesmo o chatbot que seus clientes vão usar. Clique nas perguntas abaixo e veja como funciona!
          </p>
        </div>

        <div className="max-w-md mx-auto">
          <Card className="shadow-elegant border-primary/20 bg-gradient-to-b from-gray-50 to-white">
            <CardHeader className="bg-gradient-primary text-white rounded-t-lg p-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Bot className="w-4 h-4" />
                Agência Elevea
                <Badge variant="secondary" className="ml-auto bg-white/20 text-white text-xs">
                  Online
                </Badge>
              </CardTitle>
            </CardHeader>

            <CardContent className="p-3 space-y-3 max-h-80 overflow-y-auto custom-scrollbar">
              <div className="bg-gray-100 p-3 rounded-lg rounded-bl-none max-w-[85%]">
                <p className="text-xs">👋 Olá! Sou o assistente da Agência Elevea. Como posso ajudar?</p>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Toque em uma pergunta:</p>
                <div className="grid grid-cols-1 gap-1">
                  {faqItems.map((item, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => handleFAQClick(index)}
                      className="text-left justify-start h-auto p-2 hover:bg-primary/5 hover:border-primary/30 rounded-full"
                    >
                      <span className="text-xs">{item.question}</span>
                    </Button>
                  ))}
                </div>
              </div>

              {selectedFAQ !== null && (
                <div className="bg-gray-100 p-3 rounded-lg rounded-bl-none max-w-[90%] animate-fade-in">
                  <div className="flex items-start gap-2">
                    <Bot className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">{faqItems[selectedFAQ].question}</p>
                      <p className="text-xs">{faqItems[selectedFAQ].answer}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="border-t pt-3">
                {/* Botão verde: WhatsApp */}
                <Button
                  asChild
                  size="sm"
                  className="w-full bg-green-600 hover:bg-green-700 text-white text-xs"
                >
                  <a
                    href={waMessage('Olá! Gostaria de saber mais sobre os planos de sites.')}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="w-3 h-3 mr-1" />
                    Falar no WhatsApp
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="text-center mt-6">
            <p className="text-muted-foreground mb-4 text-sm">
              ⚡ Este é exatamente o tipo de atendimento que seus clientes terão no seu site!
            </p>

            {/* Botão dourado: WhatsApp */}
            <Button asChild variant="outline" className="border-primary text-primary">
              <a
                href={waMessage('Quero esse atendimento no meu site. Como faço?')}
                target="_blank"
                rel="noopener noreferrer"
              >
                Quero isso no meu site
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Chatbot;
