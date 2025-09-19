// /src/pages/obrigado/steps/AddressStep.tsx
export function AddressStep({
  endereco,
  setEndereco,
}: {
  endereco: { logradouro: string; bairro: string; cidade: string; uf: string };
  setEndereco: (v: any) => void;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <input
        className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-white placeholder:text-white/40"
        placeholder="Endereço (rua, número)"
        value={endereco.logradouro}
        onChange={(e) => setEndereco({ ...endereco, logradouro: e.target.value })}
      />
      <input
        className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-white placeholder:text-white/40"
        placeholder="Bairro"
        value={endereco.bairro}
        onChange={(e) => setEndereco({ ...endereco, bairro: e.target.value })}
      />
      <input
        className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-white placeholder:text-white/40"
        placeholder="Cidade"
        value={endereco.cidade}
        onChange={(e) => setEndereco({ ...endereco, cidade: e.target.value })}
      />
      <input
        maxLength={2}
        className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-white placeholder:text-white/40"
        placeholder="UF"
        value={endereco.uf}
        onChange={(e) => setEndereco({ ...endereco, uf: e.target.value.toUpperCase() })}
      />
    </div>
  );
}
