"use client";

import { useDraggable, useDroppable } from "@dnd-kit/core";
import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";

/**
 * 드래그 조각. 탭(onClick)은 그대로 두고 드래그만 덧붙인다 — 마우스는 8px 이상 움직여야,
 * 손가락은 0.2초 눌러야 드래그가 시작되므로 그냥 탭하거나 스크롤하면 드래그가 되지 않는다.
 *
 * dnd-kit 의 attributes(aria-pressed·role 등)는 쓰지 않는다. 선택 상태(aria-pressed)는 탭이 정하고,
 * 키보드로는 탭 두 번으로 같은 일을 할 수 있다.
 */
type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode };

/** 경기장 자리: 놓을 수 있고, 사람이 있으면 끌 수도 있다 */
export function SlotButton({ index, occupied, className = "", ...button }: ButtonProps & { index: number; occupied: boolean }) {
  const { setNodeRef: setDropRef, isOver } = useDroppable({ id: `slot:${index}` });
  const { setNodeRef: setDragRef, listeners, isDragging } = useDraggable({ id: `slot:${index}`, disabled: !occupied });
  return (
    <button
      ref={(node) => {
        setDropRef(node);
        setDragRef(node);
      }}
      type="button"
      {...listeners}
      {...button}
      className={`${className} touch-manipulation ${isDragging ? "opacity-40" : ""} ${isOver ? "scale-110" : ""}`}
    />
  );
}

/** 벤치 선수 칩: 끌어서 자리에 놓는다 */
export function BenchChip({ memberId, className = "", ...button }: ButtonProps & { memberId: string }) {
  const { setNodeRef, listeners, isDragging } = useDraggable({ id: `bench:${memberId}` });
  return (
    <button
      ref={setNodeRef}
      type="button"
      {...listeners}
      {...button}
      className={`${className} touch-manipulation ${isDragging ? "opacity-40" : ""}`}
    />
  );
}

/** 벤치 자리: 경기장의 사람을 여기 놓으면 뺀다 */
export function BenchDropZone({ className = "", ...div }: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: "bench" });
  return <div ref={setNodeRef} {...div} className={`${className} ${isOver ? "rounded-box bg-bg-subtle" : ""}`} />;
}
