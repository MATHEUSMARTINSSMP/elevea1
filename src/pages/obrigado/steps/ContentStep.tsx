// /src/pages/obrigado/steps/ContentStep.tsx
type Props = {
  historia: string; setHistoria: (v: string) => void;
  produtos: string; setProdutos: (v: string) => void;
  fundacao: string; setFundacao: (v: string) => void;
};

export default function ContentStep({
  historia, setHistoria,
  produtos, setProdutos,
  fundacao, setFundacao,
}: Props) {
  return (
    <div className="grid grid-cols-1 gap-4">
      <textarea
        className="w-full border rounded-xl px-4 py-3 min-h-[120px] border-white/10 bg-white/[0.03] text-white placeholder:text-white/40"
        placeholder="Conte a história da empresa (quem são, desde quando, missão)"
        value={historia}
        onChange={(e)=>setHistoria(e.target.value)}
      />
      <textarea
        className="w-full border rounded-xl px-4 py-3 min-h-[120px] border-white/10 bg-white/[0.03] text-white placeholder:text-white/40"
        placeholder="Principais produtos/serviços (separe por vírgula ou linhas)"
        value={produtos}
        onChange={(e)=>setProdutos(e.target.value)}
      />
      <input
        className="w-full border rounded-xl px-4 py-3 md:max-w-xs border-white/10 bg-white/[0.03] text-white placeholder:text-white/40"
        placeholder="Ano de fundação (opcional)"
        value={fundacao}
        onChange={(e)=>setFundacao(e.target.value)}
      />
    </div>
  );
}
