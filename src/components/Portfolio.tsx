import { ExternalLink } from "lucide-react";

type Item = {
  id: string;
  title: string;
  image: string;      // screenshot do site (pode trocar por imagem própria depois)
  description: string;
  url: string;        // link do projeto
};

const items: Item[] = [
  {
    id: "feminina",
    title: "Moda Feminina",
    image:
      "https://s.wordpress.com/mshots/v1/https%3A%2F%2Fsacadaohboyamapa.netlify.app?w=1200",
    description:
      "Landing de vitrine para Sacada | Oh, Boy! com foco em coleções e campanhas sazonais. Destaques visuais, CTAs claros e navegação direta para descoberta de produtos.",
    url: "https://sacadaohboyamapa.netlify.app",
  },
  {
    {
  id: "intima",
  title: "Moda Íntima Feminina",
  image: "/lojaloungerie.png", // ← substitui pelo arquivo local
  description:
    "Showcase para Loungerie com abordagem elegante: apresentação de linhas, chamadas para WhatsApp e mapa integrado para visita à loja.",
  url: "https://loungerieamapagarden.netlify.app",
},
  {
    id: "masculina",
    title: "Moda Masculina",
    image:
      "https://s.wordpress.com/mshots/v1/https%3A%2F%2Fmrkitschamapagarden.netlify.app?w=1200",
    description:
      "Site da Mr. Kitsch com hero dinâmico, seções de produtos, contato rápido e localização — pensado para conversão no varejo físico.",
    url: "https://mrkitschamapagarden.netlify.app",
  },
];

const Portfolio = () => {
  return (
    <section id="portfolio" className="py-20 bg-section-gradient">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-primary">
            Confira nossos trabalhos
          </h2>
          <p className="text-lg text-muted-foreground mt-4">
            Seleção enxuta dos projetos por segmento — cada um pensado para
            destacar a marca e gerar ações (visita, mensagem, compra).
          </p>
        </div>

        {/* Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {items.map((w) => (
            <article
              key={w.id}
              className="bg-card rounded-2xl overflow-hidden shadow-[var(--elegant-shadow)] hover:shadow-lg transition"
            >
              <div className="aspect-[4/3]">
                <img
                  src={w.image}
                  alt={w.title}
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="p-6">
                <h3 className="text-xl font-semibold text-primary">{w.title}</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  {w.description}
                </p>

                <div className="mt-5">
                  <a
                    href={w.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-white hover:bg-accent/90 transition"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Ver o site
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-8">
          * As imagens são screenshots automáticas dos sites. Troque por fotos/arte próprias quando quiser.
        </p>
      </div>
    </section>
  );
};

export default Portfolio;
