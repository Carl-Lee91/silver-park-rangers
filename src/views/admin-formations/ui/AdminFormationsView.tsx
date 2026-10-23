import { compositionLabel } from "@/entities/formation";
import { fetchFormations } from "@/entities/formation/server";
import { createFormation, deleteFormation, FormationEditor } from "@/features/formation-editor";
import { ROUTES } from "@/shared/config";
import { ActionButton, chipClass, Panel, Screen } from "@/shared/ui";

export default async function AdminFormationsView() {
  const formations = await fetchFormations();

  return (
    <Screen title="포메이션" overline="전술" back={{ href: ROUTES.admin, label: "관리" }} width="wide">
      <div className="flex flex-col gap-4 lg:grid lg:grid-cols-2 lg:items-start lg:gap-6">
        <Panel title="저장된 포메이션" aside={`${formations.length}`} flush>
          <ul className="divide-y divide-border">
            {formations.map((formation) => (
              <li key={formation.id} className="flex min-h-14 items-center justify-between gap-3 px-3 py-2 even:bg-bg-row md:px-4">
                <span className="min-w-0">
                  <span className="font-semibold">{formation.name}</span>
                  {formation.isPreset && (
                    <span className={chipClass("muted", "ml-1.5")}>기본</span>
                  )}
                  <span className="mt-0.5 block truncate text-xs text-text-tertiary">{compositionLabel(formation.slots)}</span>
                </span>
                {!formation.isPreset && (
                  <div className="w-20 shrink-0">
                    <ActionButton
                      action={deleteFormation}
                      fields={{ formationId: formation.id }}
                      label="지우기"
                      tone="danger"
                      confirmMessage={`${formation.name} 포메이션을 지울까요? 이미 짠 스쿼드는 그대로 남아요.`}
                    />
                  </div>
                )}
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="새 포메이션">
          <FormationEditor action={createFormation} />
        </Panel>
      </div>
    </Screen>
  );
}
