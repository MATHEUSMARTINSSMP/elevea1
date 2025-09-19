// /src/pages/Obrigado/StepNav.tsx
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function StepNav({
  tab, setTab, canNext, submitting
}: {
  tab: 1|2|3|4;
  setTab: (t: 1|2|3|4) => void;
  canNext: (t: 1|2|3|4) => boolean;
  submitting?: boolean;
}) {
  const prev = () => setTab((tab>1 ? (tab-1) : tab) as 1|2|3|4);
  const next = () => setTab((tab<4 && canNext(tab) ? (tab+1) : tab) as 1|2|3|4);

  return (
    <div className="flex items-center justify-between">
      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={prev} disabled={tab===1}>
          <ChevronLeft className="h-4 w-4 mr-1" /> Voltar
        </Button>
        {tab < 4 && (
          <Button type="button" onClick={next} disabled={!canNext(tab)}>
            Avançar <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        )}
      </div>
      {/* o botão "Enviar" fica na página principal quando tab === 4 */}
      <div />
    </div>
  );
}

