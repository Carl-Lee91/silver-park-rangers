import { compositionLabel } from "@/entities/formation";
import { fetchFormations } from "@/entities/formation/server";
import { createFormation, deleteFormation, FormationEditor } from "@/features/formation-editor";
import { ActionButton } from "@/shared/ui";

export default async function AdminFormationsView() {
  const formations = await fetchFormations();

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-xl font-bold">포메이션</h1>

      <div className="flex flex-col gap-8 lg:grid lg:grid-cols-2 lg:items-start lg:gap-10">
        <section>
          <h2 className="mb-3 text-sm font-semibold text-text-secondary">저장된 포메이션</h2>
          <ul className="flex flex-col gap-2">
            {formations.map((formation) => (
              <li key={formation.id} className="flex items-center justify-between gap-3 rounded-box border border-border p-3">
                <span className="min-w-0">
                  <span className="font-semibold">{formation.name}</span>
                  {formation.isPreset && (
                    <span className="ml-1.5 rounded-chip bg-bg-subtle px-1.5 py-0.5 text-xs text-text-secondary">기본</span>
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
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold text-text-secondary">새 포메이션</h2>
          <FormationEditor action={createFormation} />
        </section>
      </div>
    </div>
  );
}
