import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { FormationDraftState } from "../model/formationDraft";
import FormationEditor from "./FormationEditor";

type Action = (state: FormationDraftState, formData: FormData) => Promise<FormationDraftState>;
const noop: Action = async () => ({});

describe("커스텀 포메이션 만들기", () => {
  it("4-3-3 인원수로 시작하고 필드 인원을 보여 준다", () => {
    render(<FormationEditor action={noop} />);
    expect(screen.getByText("필드 10명 + 키퍼 1명")).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "미리보기" })).toBeInTheDocument();
  });

  it("+ / − 로 인원수를 바꾼다", async () => {
    const user = userEvent.setup();
    render(<FormationEditor action={noop} />);
    await user.click(screen.getByRole("button", { name: "공격수 빼기" }));
    expect(screen.getByText("필드 9명 + 키퍼 1명")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "센터백 더하기" }));
    expect(screen.getByText("필드 10명 + 키퍼 1명")).toBeInTheDocument();
  });

  it("필드가 10명이면 더 더할 수 없다", () => {
    render(<FormationEditor action={noop} />);
    expect(screen.getByRole("button", { name: "센터백 더하기" })).toBeDisabled();
  });

  it("이름과 인원수를 보낸다", async () => {
    const user = userEvent.setup();
    const action = vi.fn<Action>(noop);
    render(<FormationEditor action={action} />);
    await user.type(screen.getByLabelText("이름"), "4-4-1-1");
    await user.click(screen.getByRole("button", { name: "저장" }));

    await waitFor(() => expect(action).toHaveBeenCalledTimes(1));
    const formData = action.mock.calls[0][1];
    expect(formData.get("name")).toBe("4-4-1-1");
    expect(formData.get("CB")).toBe("2");
    expect(formData.get("MF")).toBe("3");
  });
});
