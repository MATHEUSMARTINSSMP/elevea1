import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";

/* ===================== Tipos ===================== */
type Props = {
  email: string;
  setEmail: (v: string) => void;
  phone: string;
  setPhone: (v: string) => void;
  documentCPF: string;
  setDocumentCPF: (v: string) => void;
  siteSlugInput: string;
  setSiteSlugInput: (v: string) => void;

  logoLink: string;
  setLogoLink: (v: string) => void;
  fotosLink: string;
  setFotosLink: (v: string) => void;

  logoFile: File | null;
  setLogoFile: (f: File | null) => void;
  fotoFiles: FileList | null;
  setFotoFiles: (fl: FileList | null) => void;

  // Se o pai fornecer, usamos o upload externo (multipart)
  uploading?: boolean;
  onUploadClick?: () => void;

  // Para exibir link da pasta criada
  driveFolderUrl?: string;
  setDriveFolderUrl?: (v: string) => void;
};

/* ===================== Helpers ===================== */
const APPS_URL =
  (import.meta.env.VITE_APPS_WEBAPP_URL as string)?.trim() ||
  (import.meta.env.VITE_SHEETS_WEBAPP_URL as string)?.trim() ||
  "";

function normSlug(v: string) {
  return (v || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "-")
    .replace(/[^A-Z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

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

/* ===================== Componente ===================== */
function IdentityUpload(p: Props) {
  const usingExternalUpload = typeof p.onUploadClick === "function";
  const busy = Boolean(p.uploading);

  // Upload interno (base64) — só usado se NÃO tiver onUploadClick do pai
  const [internalBusy, setInternalBusy] = useState(false);
  const effectiveBusy = usingExternalUpload ? busy : internalBusy;

  async function uploadInternalBase64() {
    if (!APPS_URL) {
      alert("Defina VITE_APPS_WEBAPP_URL (ou VITE_SHEETS_WEBAPP_URL) com a URL do Apps Script (…/exec).");
      return;
    }
    const email = (p.email || "").trim().toLowerCase();
    const slug = normSlug(p.siteSlugInput || "");
    if (!email || !slug) {
      alert("Preencha e-mail e o nome do site (slug) antes de enviar.");
      return;
    }

    setInternalBusy(true);
    try {
      const logoObj  = await fileToB64Obj(p.logoFile);
      const fotosArr = await filesToB64Array(p.fotoFiles);

      const payload: any = {
        type: "upload_base64",
        email,
        siteSlug: slug,
        logoLink:  p.logoLink  || "",
        fotosLink: p.fotosLink || "",
      };
      if (logoObj)         payload.logo  = logoObj;
      if (fotosArr.length) payload.fotos = fotosArr;

      const res = await fetch(`${APPS_URL}?type=upload_base64`, {
        method: "POST",
        body: JSON.stringify(payload),
        cache: "no-store",
      });

      const j = await res.json().catch(() => ({} as any));
      if (!res.ok || j?.ok !== true) throw new Error(j?.error || `Falha no upload (${res.status})`);

      if (j.driveFolderUrl && p.setDriveFolderUrl) p.setDriveFolderUrl(String(j.driveFolderUrl));
      alert("Arquivos enviados! Verifique a pasta do Drive.");
    } catch (e: any) {
      console.error(e);
      alert(e?.message || "Erro ao enviar. Tente novamente.");
    } finally {
      setInternalBusy(false);
    }
  }

  const showEnvDevBanner = import.meta.env.DEV && !APPS_URL && !usingExternalUpload;

  return (
    <div className="space-y-5">
      {showEnvDevBanner && (
        <div className="rounded-xl border border-amber-300/40 bg-amber-50 text-amber-900 px-4 py-3 text-sm">
          <b>Dev:</b> defina <code>VITE_APPS_WEBAPP_URL</code> ou passe um{" "}
          <code>onUploadClick</code> externo. Em produção esse aviso não aparece.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm text-white/70">E-mail</label>
          <input
            name="email"
            type="email"
            className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-white placeholder:text-white/40"
            placeholder="Seu e-mail"
            value={p.email}
            onChange={(e) => p.setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="text-sm text-white/70">WhatsApp</label>
          <input
            className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-white placeholder:text-white/40"
            placeholder="(DDD) 9xxxx-xxxx"
            value={p.phone}
            onChange={(e) => p.setPhone(e.target.value)}
          />
        </div>

        <div>
          <label className="text-sm text-white/70">CPF/CNPJ</label>
          <input
            className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-white placeholder:text-white/40"
            placeholder="CPF ou CNPJ"
            value={p.documentCPF}
            onChange={(e) => p.setDocumentCPF(e.target.value)}
          />
        </div>

        <div>
          <label className="text-sm text-white/70">Nome do site (slug)</label>
          <input
            className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-white placeholder:text-white/40"
            placeholder="Ex.: MINHA-LOJA"
            value={p.siteSlugInput}
            onChange={(e) => p.setSiteSlugInput(e.target.value)}
            required
          />
          <p className="mt-1 text-xs text-white/50">
            Ex.: se digitar <b>MINHA-LOJA</b>, o endereço poderá ficar como{" "}
            <code>minha-loja.netlify.app</code>.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* LOGO */}
        <div className="space-y-2">
          <label className="text-sm text-white/70">Envie sua <b>logo</b></label>
          <div className="flex items-center gap-2">
            <label className="inline-flex items-center gap-2 border border-white/10 bg-white/[0.03] text-white rounded-xl px-3 py-2 cursor-pointer hover:bg-white/[0.06]">
              <Upload className="h-4 w-4" />
              <span>Selecionar arquivo</span>
              <input
                type="file"
                accept=".png,.jpg,.jpeg,.svg"
                className="hidden"
                onChange={(e) => p.setLogoFile(e.target.files?.[0] || null)}
              />
            </label>
            <span className="text-xs text-white/50">
              {p.logoFile ? p.logoFile.name : "PNG/JPG/SVG"}
            </span>
          </div>
          <input
            className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-white placeholder:text-white/40"
            placeholder="Ou cole o link (Drive/WeTransfer/Dropbox)"
            value={p.logoLink}
            onChange={(e) => p.setLogoLink(e.target.value)}
          />
        </div>

        {/* FOTOS */}
        <div className="space-y-2">
          <label className="text-sm text-white/70">Envie <b>fotos</b> da empresa/produtos</label>
          <div className="flex items-center gap-2">
            <label className="inline-flex items-center gap-2 border border-white/10 bg-white/[0.03] text-white rounded-xl px-3 py-2 cursor-pointer hover:bg-white/[0.06]">
              <Upload className="h-4 w-4" />
              <span>Selecionar arquivos</span>
              <input
                type="file"
                multiple
                accept=".png,.jpg,.jpeg"
                className="hidden"
                onChange={(e) => p.setFotoFiles(e.target.files || null)}
              />
            </label>
            <span className="text-xs text-white/50">
              {p.fotoFiles?.length ? `${p.fotoFiles.length} arquivo(s)` : "PNG/JPG"}
            </span>
          </div>
          <input
            className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-white placeholder:text-white/40"
            placeholder="Ou cole link com as fotos (Drive/WeTransfer/Dropbox)"
            value={p.fotosLink}
            onChange={(e) => p.setFotosLink(e.target.value)}
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button
          type="button"
          className="bg-white text-gray-900 hover:bg-white/90"
          onClick={usingExternalUpload ? p.onUploadClick : uploadInternalBase64}
          disabled={effectiveBusy}
        >
          {effectiveBusy ? "Enviando..." : "Enviar arquivos para o Drive"}
        </Button>

        {p.driveFolderUrl && (
          <a
            className="text-sm underline text-emerald-400 hover:text-emerald-300"
            href={p.driveFolderUrl}
            target="_blank"
            rel="noreferrer"
          >
            Abrir pasta criada no Drive
          </a>
        )}
      </div>

      <p className="text-xs text-white/50">
        Você pode enviar agora ou mandar depois pelo WhatsApp.
      </p>
    </div>
  );
}

export default IdentityUpload;
export { IdentityUpload };
