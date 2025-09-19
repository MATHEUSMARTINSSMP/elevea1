// /src/pages/obrigado/steps/StyleStep.tsx
import { useMemo, useState } from "react";
import { PALETAS } from "../constants";

type Props = {
  paleta: string;
  setPaleta: (v: string) => void;
};

/**
 * Suporta presets de PALETAS + opção "Outras",
 * que salva como `custom:#111111,#ffffff,#...`
 */
export default function StyleStep({ paleta, setPaleta }: Props) {
  const isCustom = paleta.startsWith("custom:");
  const initialCustom = useMemo(
    () => (isCustom ? paleta.replace(/^custom:/, "") : ""),
    [paleta, isCustom]
  );

  const [customList, setCustomList] = useState(initialCustom);

  function saveCustom(v: string) {
    setCustomList(v);
    const cleaned = v
      .split(/[,\s]+/)
      .map(x => x.trim())
      .filter(Boolean)
      .join(",");
    setPaleta(`custom:${cleaned}`);
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {PALETAS.map((p) => {
          const selected = paleta === p.id;
          return (
            <label
              key={p.id}
              className={`cursor-pointer rounded-xl border bg-white/[0.02] p-3 flex items-center gap-3 transition
              ${selected ? "ring-2 ring-emerald-400 border-emerald-400/40" : "border-white/10 hover:bg-white/[0.04]"}`}
            >
              <input
                type="radio"
                className="hidden"
                checked={selected}
                onChange={() => setPaleta(p.id)}
              />
              <div className="flex -space-x-1">
                {p.cores.map((c: string, i: number) => (
                  <span
                    key={i}
                    className="h-6 w-6 rounded-full border border-white/20"
                    style={{ background: c }}
                    title={c}
                  />
                ))}
              </div>
              <div className="text-sm text-white">{p.nome}</div>
            </label>
          );
        })}

        {/* Cartão "Outras" */}
        <label
          className={`cursor-pointer rounded-xl border bg-white/[0.02] p-3 flex flex-col gap-2 transition
          ${isCustom ? "ring-2 ring-emerald-400 border-emerald-400/40" : "border-white/10 hover:bg-white/[0.04]"}`}
        >
          <div className="flex items-center gap-3">
            <input
              type="radio"
              className="hidden"
              checked={isCustom}
              onChange={() => setPaleta(`custom:${customList || "#111,#fff"}`)}
            />
            <div className="text-sm text-white font-medium">Outras (digite cores)</div>
          </div>
          <input
            className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-white placeholder:text-white/40"
            placeholder="#98a2af, #111111, #6f63e3"
            value={customList}
            onChange={(e) => saveCustom(e.target.value)}
            onFocus={() => !isCustom && setPaleta(`custom:${customList || "#98a2af,#111111"}`)}
          />
          <p className="text-xs text-white/50">
            Separe por vírgula. Usaremos as 3–6 primeiras cores.
          </p>
        </label>
      </div>
    </div>
  );
}
