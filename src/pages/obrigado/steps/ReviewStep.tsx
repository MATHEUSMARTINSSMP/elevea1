// /src/pages/obrigado/steps/ReviewStep.tsx
import React from "react";

type Endereco = {
  logradouro?: string;
  bairro?: string;
  cidade?: string;
  uf?: string;
};

type ReviewData = {
  plano: "vip" | "essential";
  siteSlugInput: string;
  email: string;
  phone: string;
  documentCPF: string;
  driveFolderUrl?: string;
  historia?: string;
  produtos?: string;   // lista simples (texto)
  fundacao?: string;
  paleta: string;
  template: string;
  endereco?: Endereco;
};

export function ReviewStep({ data }: { data: ReviewData }) {
  const {
    plano,
    siteSlugInput,
    email,
    phone,
    documentCPF,
    driveFolderUrl,
    historia,
    produtos,
    fundacao,
    paleta,
    template,
    endereco,
  } = data;

  const addr =
    endereco &&
    [endereco.logradouro, endereco.bairro, endereco.cidade && `${endereco.cidade} - ${endereco.uf}`]
      .filter(Boolean)
      .join(" · ");

  const Row = ({
    label,
    value,
  }: {
    label: string;
    value?: React.ReactNode;
  }) => (
    <div className="grid grid-cols-3 gap-4 py-2 border-b border-white/10 last:border-0">
      <div className="text-white/60 text-sm">{label}</div>
      <div className="col-span-2 text-white text-sm break-words">{value || <span className="text-white/40">—</span>}</div>
    </div>
  );

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
      <Row label="Plano" value={plano} />
      <Row label="Slug" value={siteSlugInput} />
      <Row label="E-mail" value={email} />
      <Row label="WhatsApp" value={phone} />
      <Row label="CPF/CNPJ" value={documentCPF} />
      <Row
        label="Pasta do Drive"
        value={
          driveFolderUrl ? (
            <a className="underline text-emerald-400 hover:text-emerald-300" href={driveFolderUrl} target="_blank" rel="noreferrer">
              Abrir pasta
            </a>
          ) : (
            undefined
          )
        }
      />
      <Row label="História" value={historia} />
      <Row label="Produtos/Serviços" value={produtos} />
      <Row label="Fundação" value={fundacao} />
      <Row label="Paleta" value={paleta} />
      <Row label="Template" value={template} />
      <Row label="Endereço" value={addr} />
    </div>
  );
}

// ✅ exports para evitar erros de build
export default ReviewStep;
