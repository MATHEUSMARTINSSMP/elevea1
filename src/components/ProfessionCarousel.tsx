import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import type { CarouselApi } from '@/components/ui/carousel';

// Imagens das profissões
import dentistImg from '@/assets/professions/dentist.jpg';
import lawyerImg from '@/assets/professions/lawyer.jpg';
import aestheticianImg from '@/assets/professions/aesthetician.jpg';
import manicuristImg from '@/assets/professions/manicurist.jpg';
import salonImg from '@/assets/professions/salon.jpg';
import accountantImg from '@/assets/professions/accountant.jpg';
import smallBusinessImg from '@/assets/professions/small-business.jpg';
import pharmacistImg from '@/assets/professions/pharmacist.jpg';
import tireShopImg from '@/assets/professions/tire-shop.jpg';
import laundryImg from '@/assets/professions/laundry.jpg';
import restaurantImg from '@/assets/professions/restaurant.jpg';
import barberImg from '@/assets/professions/barber.jpg';
import petShopImg from '@/assets/professions/pet-shop.jpg';
import gymImg from '@/assets/professions/gym.jpg';
import psychologistImg from '@/assets/professions/psychologist.jpg';

const professions = [
  { name: 'Dentista', image: dentistImg },
  { name: 'Advogado', image: lawyerImg },
  { name: 'Esteticista', image: aestheticianImg },
  { name: 'Manicure/Pedicure', image: manicuristImg },
  { name: 'Salão de Beleza', image: salonImg },
  { name: 'Contador', image: accountantImg },
  { name: 'Pequenos Comércios', image: smallBusinessImg },
  { name: 'Farmácia', image: pharmacistImg },
  { name: 'Borracharia', image: tireShopImg },
  { name: 'Lavanderia', image: laundryImg },
  { name: 'Restaurante', image: restaurantImg },
  { name: 'Barbearia', image: barberImg },
  { name: 'Pet Shop', image: petShopImg },
  { name: 'Academia', image: gymImg },
  { name: 'Psicólogo/Clínica', image: psychologistImg },
];

const ProfessionCarousel = () => {
  const [api, setApi] = useState<CarouselApi>();

  // Auto-swipe a cada 2s
  useEffect(() => {
    if (!api) return;

    const id = setInterval(() => {
      const current = api.selectedScrollSnap();
      const total = api.scrollSnapList().length;
      const next = (current + 1) % total;
      api.scrollTo(next);
    }, 2000);

    return () => clearInterval(id);
  }, [api]);

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 animate-fade-in">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Para quem é <span className="bg-gradient-primary bg-clip-text text-transparent">indicado</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Encontre seu perfil e veja como uma presença digital profissional pode transformar seu negócio
          </p>
        </div>

        <Carousel
          opts={{ align: 'start', loop: true }}
          className="w-full"
          setApi={setApi}
        >
          <CarouselContent className="-ml-2 md:-ml-4">
            {professions.map((profession, index) => (
              <CarouselItem
                key={index}
                className="pl-2 md:pl-4 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4 xl:basis-1/5"
              >
                <Card className="group cursor-pointer transition-all duration-300 hover:shadow-card hover:-translate-y-1 border-border/50 relative overflow-hidden rounded-2xl">
                  <CardContent className="p-0 relative">
                    <div className="relative aspect-[4/3]">
                      <img
                        src={profession.image}
                        alt={profession.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent flex items-end">
                        <h3 className="text-white font-semibold text-lg p-4">
                          {profession.name}
                        </h3>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>

          <CarouselPrevious className="hidden md:flex -left-4 border-primary text-primary hover:bg-primary/10" />
          <CarouselNext className="hidden md:flex -right-4 border-primary text-primary hover:bg-primary/10" />
        </Carousel>

        <div className="text-center mt-8">
          <p className="text-muted-foreground">
            Se identificou com algum desses perfis?{' '}
            <a href="#planos" className="text-primary hover:underline font-medium">
              Veja nossos planos
            </a>
          </p>
        </div>
      </div>
    </section>
  );
};

export default ProfessionCarousel;
