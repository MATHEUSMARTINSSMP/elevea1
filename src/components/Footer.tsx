import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, MapPin, Clock, Shield } from 'lucide-react';
import { waMessage } from '@/lib/whatsapp';

const Footer = () => {
  return (
    <footer className="bg-gradient-section border-t border-border">
      {/* CTA Section */}
      <section id="contato" className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="bg-gradient-primary text-white border-0 shadow-elegant">
            <CardContent className="p-12 text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Vamos colocar seu negócio no digital?
              </h2>
              <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
                Entre em contato conosco e comece sua jornada digital hoje mesmo. 
                Estamos aqui para ajudar seu negócio a crescer.
              </p>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div className="space-y-6">
                  <h3 className="text-2xl font-semibold">Fale conosco agora</h3>
                  <p className="text-white/80">
                    Tire suas dúvidas, solicite um orçamento personalizado ou contrate seu plano diretamente pelo WhatsApp.
                  </p>
                  
                  <Button
                    asChild
                    size="lg"
                    className="bg-green-600 hover:bg-green-700 text-white shadow-lg"
                  >
                    <a
                      href={waMessage(
                        'Olá! Gostaria de mais informações sobre os planos de sites da Elevea.'
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <MessageCircle className="w-5 h-5 mr-2" />
                      Chamar no WhatsApp
                    </a>
                  </Button>
                  
                  <div className="space-y-2 text-white/80">
                    <Badge className="bg-white/20 text-white hover:bg-white/30">
                      <Clock className="w-4 h-4 mr-1" />
                      Respondemos em até 1 hora
                    </Badge>
                    <p className="text-sm">Segunda a Sábado • 8h às 18h</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold">Outras formas de contato</h4>
                  
                  <div className="space-y-3 text-left">
                    <div className="flex items-center gap-3">
                      <MessageCircle className="w-5 h-5 text-white/80" />
                      <div>
                        <p className="font-medium">WhatsApp</p>
                        <p className="text-white/80 text-sm">(96) 9 8103-2928</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <MapPin className="w-5 h-5 text-white/80" />
                      <div>
                        <p className="font-medium">Atendimento</p>
                        <p className="text-white/80 text-sm">
                          100% Online<br />
                          Atendemos todo Brasil
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer Links */}
      <div className="border-t border-border/50 py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center text-white font-bold text-sm">
                  AE
                </div>
                <h3 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                  Agência Elevea
                </h3>
              </div>
              <p className="text-muted-foreground text-sm">
                Democratizando a presença digital para negócios locais com soluções completas e acessíveis.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Serviços</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#planos" className="hover:text-primary transition-colors">Sites Institucionais</a></li>
                <li><a href="#planos" className="hover:text-primary transition-colors">Google Meu Negócio</a></li>
                <li><a href="#planos" className="hover:text-primary transition-colors">Chat FAQ</a></li>
                <li><a href="#planos" className="hover:text-primary transition-colors">QR Code</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Empresa</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#sobre" className="hover:text-primary transition-colors">Sobre Nós</a></li>
                <li><a href="#depoimentos" className="hover:text-primary transition-colors">Depoimentos</a></li>
                <li><a href="#como-funciona" className="hover:text-primary transition-colors">Como Funciona</a></li>
                <li><a href="#faq" className="hover:text-primary transition-colors">FAQ</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Suporte</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#contato" className="hover:text-primary transition-colors">Contato</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Central de Ajuda</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Política de Privacidade</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Termos de Uso</a></li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-border/50 py-6">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-4">
              <p className="text-sm text-muted-foreground">
                © 2024 Agência Elevea. Todos os direitos reservados.
              </p>
              <Badge className="bg-primary/10 text-primary hover:bg-primary/20">
                <Shield className="w-3 h-3 mr-1" />
                Garantia de Resposta
              </Badge>
            </div>
            
            <div className="text-sm text-muted-foreground text-center md:text-right">
              <p className="font-medium text-primary">
                Comprometemo-nos a responder todos os contatos em até 1 hora
              </p>
              <p>durante nosso horário de funcionamento. Sua satisfação é nossa prioridade.</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
