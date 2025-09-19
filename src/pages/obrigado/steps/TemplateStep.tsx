// /src/pages/obrigado/steps/TemplateStep.tsx
import { TEMPLATES } from "../constants";

type Props = {
  template: string;
  setTemplate: (v: string) => void;
};

export default function TemplateStep({ template, setTemplate }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {TEMPLATES.map((t) => {
        const selected = template === t.id;
        return (
          <label
            key={t.id}
            className={`cursor-pointer rounded-xl border bg-white/[0.02] p-4 flex flex-col gap-2 transition
            ${selected ? "ring-2 ring-emerald-400 border-emerald-400/40" : "border-white/10 hover:bg-white/[0.04]"}`}
          >
            <input
              type="radio"
              className="hidden"
              checked={selected}
              onChange={() => setTemplate(t.id)}
            />
            <div className="font-medium text-white">{t.nome}</div>
            <div className="text-sm text-white/60">{t.descricao}</div>
          </label>
        );
      })}
    </div>
  );
}
