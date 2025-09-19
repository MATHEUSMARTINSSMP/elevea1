// /src/pages/obrigado/index.tsx
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { IdentityUpload, ContentStep, StyleStep, TemplateStep } from "./steps";
import { AddressStep } from "./steps/AddressStep";
import { ReviewStep } from "./steps/ReviewStep";

// ====== ENVs ======
const APPS_URL =
  (import.meta.env.VITE_APPS_WEBAPP_URL as string)?.trim() ||
  (import.meta.env.VITE_SHEETS_WEBAPP_URL as string)?.trim() ||
  "";

const WHATSAPP_URL =
  (import.meta.env.VITE_WHATSAPP_URL as string)?.trim() ||
  "https://wa.me/5500000000000?text=Ol%C3%A1%20Elevea!%20Acabei%20de%20assinar%20e%20quero%20finalizar%20meu%20site.";

// util: querystring
function q(param: string, def = "") {
  const sp = new URLSearchParams(window.location.search);
  return sp.get(param) || def;
}

// ====== Helpers upload base64 (evitam preflight/CORS) ======
async function fileToB64Obj(file: File | null) {
  if (!file) return null;
  const buf = await file.arrayBuffer();
  const b64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
  return { name: file.name, mime: file.type || "application/octet-stream", b64 };
}
async function filesToB64Array(list: FileList | null) {
  if (!list?.length) return [];
  const out: Array<{ name: string; mime: string; b64: string }> = [];
  for (let i = 0; i < list.length; i++) {
    const f = list.item(i);
    if (!f) continue;
    const o = await fileToB64Obj(f);
    if (o) out.push(o);
  }
  return out;
}

// POST simples, sem headers → evita preflight/CORS no GAS
async function postSimple<T = any>(url: string, body: any) {
  const r = await fetch(url, {
    method: "POST",
    body: JSON.stringify(body),
    cache: "no-store",
  });
  // se der erro de CORS, o fetch lança; se o GAS responder, tentamos ler JSON
  const j = await r.json().catch(() => ({} as any));
  if (!r.ok || j?.ok === false) throw new Error(j?.error || `HTTP ${r.status}`);
  return j as T;
}

export default function ObrigadoPage() {
  // Plano detectado pela URL (sem seletor na UI)
  const planFromURL = useMemo(() => q("plano", "").toLowerCase(), []);
  const plano: "vip" | "essential" = planFromURL.includes("vip") ? "vip" : "essential";

  const showEnvBanner = import.meta.env.DEV && !APPS_URL;

  // ---------- Identidade ----------
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [documentCPF, setDocumentCPF] = useState("");
  const [siteSlugInput, setSiteSlugInput] = useState("");
  const [logoLink, setLogoLink] = useState("");
  const [fotosLink, setFotosLink] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [fotoFiles, setFotoFiles] = useState<FileList | null>(null);
  const [driveFolderUrl, setDriveFolderUrl] = useState<string>("");
  const [uploading, setUploading] = useState(false);

  // ---------- Conteúdo ----------
  const [historia, setHistoria] = useState("");
  const [produtos, setProdutos] = useState("");
  const [fundacao, setFundacao] = useState("");

  // ---------- Visual ----------
  const [paleta, setPaleta] = useState("dourado");
  const [template, setTemplate] = useState("classico");

  // ---------- Endereço ----------
  const [endereco, setEndereco] = useState({
    logradouro: "",
    bairro: "",
    cidade: "",
    uf: "",
  });

  // Passos
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [submitting, setSubmitting] = useState(false);

  // Foco inicial
  useEffect(() => {
    const el = document.querySelector<HTMLInputElement>('input[name="email"]');
    el?.focus();
  }, []);

  // ========== Upload via JSON/base64 ==========
  const onUploadClick = async () => {
    if (!APPS_URL) {
      alert("Ambiente sem APPS_URL configurada.");
      return;
    }
    if (!siteSlugInput || !email) {
      alert("Preencha e-mail e o nome do site (slug).");
      return;
    }

    try {
      setUploading(true);

      const logoObj = await fileToB64Obj(logoFile);
      const fotosArr = await filesToB64Array(fotoFiles);

      const payload: any = {
        type: "upload_base64",
        siteSlug: siteSlugInput.trim(),
        email: (email || "").trim().toLowerCase(),
        phone,
        document: documentCPF,
        logoLink,
        fotosLink,
      };
      if (logoObj) payload.logo = logoObj;
      if (fotosArr.length) payload.fotos = fotosArr;

      // Usar função do Netlify
      const r = await fetch("/.netlify/functions/upload-drive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        cache: "no-store",
      });
      const j = await r.json().catch(() => ({} as any));
      if (!r.ok || j?.ok !== true) throw new Error(j?.error || `Falha no upload (${r.status})`);

      if (j.driveFolderUrl) setDriveFolderUrl(String(j.driveFolderUrl));
      alert("Arquivos enviados! Sua pasta no Drive foi atualizada.");
    } catch (e: any) {
      console.error(e);
      alert(e?.message || "Falha ao enviar. Tente novamente.");
    } finally {
      setUploading(false);
    }
  };

  // ========== Submit final (salva + gera prompt) ==========
  const onSubmitAll = async () => {
    if (!APPS_URL) {
      alert("Ambiente sem APPS_URL configurada.");
      return;
    }
    if (!siteSlugInput || !email) {
      alert("Preencha e-mail e o nome do site (slug).");
      return;
    }

    try {
      setSubmitting(true);

      // 1) Salvar onboarding via Netlify
      await postSimple("/.netlify/functions/submit-onboarding", {
        type: "onboarding",
        siteSlug: siteSlugInput,
        plan: plano,
        email,
        phone: phone,
        document: documentCPF,
        driveFolderUrl: driveFolderUrl,
        logoUrl: "",
        fotosUrls: [],
        historia,
        produtos,
        fundacao,
        paleta,
        template,
        endereco,
      });

      // 2) Gerar prompt do Lovable via Netlify
      await postSimple("/.netlify/functions/generate-prompt", {
        siteSlug: siteSlugInput,
      });

      alert("Informações enviadas! Obrigado — nossa equipe já está preparando seu site.");
      // window.location.href = "/";
    } catch (e: any) {
      console.error(e);
      alert(e?.message || "Falha ao enviar. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0b1220] to-[#0c151c]">
      {/* Header */}
      <div className="border-b border-white/5 bg-[#0b1220]/60 backdrop-blur">
        <div className="max-w-5xl mx-auto px-4 py-10">
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-xl bg-emerald-500/10 border border-emerald-400/30 grid place-items-center">
                  <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      d="M20 7L9 18l-5-5"
                      fill="none"
                      stroke="rgb(52 211 153)"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-semibold text-white">
                    Pagamento aprovado
                  </h1>
                  <p className="text-sm text-white/70 mt-1">
                    Obrigado! Recebemos sua assinatura {plano === "vip" ? "do plano VIP" : "do plano Essencial"}.{" "}
                    Siga os passos para concluir seu cadastro — leva menos de 3 minutos.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-500"
                >
                  Falar no WhatsApp agora
                </a>
                <a
                  href="/"
                  className="inline-flex items-center justify-center rounded-xl border border-white/15 px-4 py-2 text-white/80 hover:bg-white/5"
                >
                  Voltar para o site
                </a>
              </div>
            </div>
          </div>

          {showEnvBanner && (
            <div className="mt-4 rounded-xl border border-amber-300/40 bg-amber-50 text-amber-900 px-4 py-3 text-sm">
              <b>Dev:</b> defina <code>VITE_APPS_WEBAPP_URL</code> (ou <code>VITE_SHEETS_WEBAPP_URL</code>). Em produção esse aviso não aparece.
            </div>
          )}
        </div>
      </div>

      {/* Conteúdo */}
      <div className="max-w-5xl mx-auto px-4 py-10 space-y-8">
        {/* PASSO 1 — Identidade & Upload */}
        <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 md:p-7">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg md:text-xl font-medium text-white">1) Identidade</h2>
              <p className="text-sm text-white/60 mt-1">
                Quem é você e como quer que apareça o seu site? Envie logo/fotos se quiser.
              </p>
            </div>
          </div>

          <div className="mt-6">
            <IdentityUpload
              email={email} setEmail={setEmail}
              phone={phone} setPhone={setPhone}
              documentCPF={documentCPF} setDocumentCPF={setDocumentCPF}
              siteSlugInput={siteSlugInput} setSiteSlugInput={setSiteSlugInput}
              logoLink={logoLink} setLogoLink={setLogoLink}
              fotosLink={fotosLink} setFotosLink={setFotosLink}
              logoFile={logoFile} setLogoFile={setLogoFile}
              fotoFiles={fotoFiles} setFotoFiles={setFotoFiles}
              driveFolderUrl={driveFolderUrl} setDriveFolderUrl={setDriveFolderUrl}
              uploading={uploading}
              onUploadClick={onUploadClick}
            />
          </div>

          <div className="mt-6 flex items-center justify-end">
            <Button
              className="bg-white text-gray-900 hover:bg-white/90"
              onClick={() => setStep(2)}
              disabled={uploading}
            >
              Continuar
            </Button>
          </div>
        </section>

        {/* PASSO 2 — Conteúdo & Visual & Endereço */}
        {step >= 2 && (
          <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 md:p-7 space-y-8">
            <div>
              <h2 className="text-lg md:text-xl font-medium text-white">2) Conteúdo</h2>
              <p className="text-sm text-white/60 mt-1">Conte sua história e o que você vende.</p>
              <div className="mt-4">
                <ContentStep
                  historia={historia} setHistoria={setHistoria}
                  produtos={produtos} setProdutos={setProdutos}
                  fundacao={fundacao} setFundacao={setFundacao}
                />
              </div>
            </div>

            <div>
              <h2 className="text-lg md:text-xl font-medium text-white">Visual — Paleta</h2>
              <p className="text-sm text-white/60 mt-1">Escolha um estilo de cores.</p>
              <div className="mt-4">
                <StyleStep paleta={paleta} setPaleta={setPaleta} />
              </div>
            </div>

            <div>
              <h2 className="text-lg md:text-xl font-medium text-white">Visual — Template</h2>
              <p className="text-sm text-white/60 mt-1">Escolha a base do layout.</p>
              <div className="mt-4">
                <TemplateStep template={template} setTemplate={setTemplate} />
              </div>
            </div>

            <div>
              <h2 className="text-lg md:text-xl font-medium text-white">Endereço (opcional)</h2>
              <p className="text-sm text-white/60 mt-1">Se quiser, informe para podermos colocar no mapa/rodapé.</p>
              <div className="mt-4">
                <AddressStep endereco={endereco} setEndereco={setEndereco} />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Button variant="ghost" className="text-white/80 hover:bg-white/10" onClick={() => setStep(1)}>
                Voltar
              </Button>
              <Button className="bg-white text-gray-900 hover:bg-white/90" onClick={() => setStep(3)}>
                Revisar e enviar
              </Button>
            </div>
          </section>
        )}

        {/* PASSO 3 — Revisão & Envio */}
        {step >= 3 && (
          <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 md:p-7">
            <h2 className="text-lg md:text-xl font-medium text-white">3) Revisão</h2>
            <p className="text-sm text-white/60 mt-1">
              Confira os dados. Ao enviar, suas respostas são salvas e o prompt é gerado (internamente).
            </p>

            <div className="mt-6">
              <ReviewStep
                data={{
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
                }}
              />
            </div>

            <div className="mt-6 flex items-center justify-between">
              <Button variant="ghost" className="text-white/80 hover:bg-white/10" onClick={() => setStep(2)}>
                Voltar
              </Button>
              <Button
                onClick={onSubmitAll}
                disabled={submitting}
                className="bg-emerald-600 hover:bg-emerald-500 text-white"
              >
                {submitting ? "Enviando..." : "Enviar dados"}
              </Button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
