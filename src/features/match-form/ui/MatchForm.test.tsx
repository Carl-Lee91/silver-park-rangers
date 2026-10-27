import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { MatchFormState } from "../model/matchSchema";
import MatchForm from "./MatchForm";

type Action = (state: MatchFormState, formData: FormData) => Promise<MatchFormState>;
const noop: Action = async () => ({});

describe("매치 폼", () => {
  it("기본값은 10:00~13:00, 6쿼터이고 쿼터 시작 시각을 미리 보여 준다", () => {
    render(<MatchForm action={noop} submitLabel="만들기" />);
    expect(screen.getByLabelText("시작")).toHaveValue("10:00");
    expect(screen.getByLabelText("끝")).toHaveValue("13:00");
    expect(screen.getByLabelText("쿼터 수")).toHaveValue("6");
    expect(screen.getByText("10:00 · 10:30 · 11:00 · 11:30 · 12:00 · 12:30")).toBeInTheDocument();
  });

  it("쿼터 수를 바꾸면 미리보기도 바뀐다", async () => {
    const user = userEvent.setup();
    render(<MatchForm action={noop} submitLabel="만들기" />);
    await user.selectOptions(screen.getByLabelText("쿼터 수"), "4");
    expect(screen.getByText("10:00 · 10:45 · 11:30 · 12:15")).toBeInTheDocument();
  });

  it("입력한 값을 보낸다", async () => {
    const user = userEvent.setup();
    const action = vi.fn<Action>(noop);
    render(<MatchForm action={action} submitLabel="만들기" />);

    fireEvent.change(screen.getByLabelText("날짜"), { target: { value: "2026-10-25" } });
    await user.type(screen.getByLabelText(/^상대 팀/), "FC 서울");
    await user.click(screen.getByRole("button", { name: "만들기" }));

    await waitFor(() => expect(action).toHaveBeenCalledTimes(1));
    const formData = action.mock.calls[0][1];
    expect(formData.get("date")).toBe("2026-10-25");
    expect(formData.get("opponent")).toBe("FC 서울");
    expect(formData.get("quarterCount")).toBe("6");
  });

  it("고치기 화면은 저장된 값으로 시작한다", () => {
    render(
      <MatchForm
        action={noop}
        submitLabel="저장"
        initial={{
          date: "2026-10-25",
          startsAt: "09:00",
          endsAt: "12:00",
          quarterCount: "4",
          venue: "실버파크",
          opponent: "",
          voteDeadline: "",
        }}
      />,
    );
    expect(screen.getByLabelText("날짜")).toHaveValue("2026-10-25");
    expect(screen.getByLabelText(/^장소/)).toHaveValue("실버파크");
    expect(screen.getByText("09:00 · 09:45 · 10:30 · 11:15")).toBeInTheDocument();
  });

  it("서버가 돌려준 오류를 칸 아래에 보여 준다", async () => {
    const user = userEvent.setup();
    const action = vi.fn<Action>(async () => ({ errors: { date: "날짜를 골라 주세요." } }));
    render(<MatchForm action={action} submitLabel="만들기" />);
    await user.click(screen.getByRole("button", { name: "만들기" }));
    expect(await screen.findByText("날짜를 골라 주세요.")).toBeInTheDocument();
  });

  it("장소·상대 팀은 고르지 않아도 되는 칸이라 '(선택)'을 달고 예시를 보여 준다", () => {
    render(<MatchForm action={noop} submitLabel="만들기" />);
    expect(screen.getByLabelText(/^장소/)).toHaveAttribute("placeholder", "예: 실버파크 구장");
    expect(document.querySelector('label[for="venue"]')).toHaveTextContent("장소 (선택)");
    expect(document.querySelector('label[for="opponent"]')).toHaveTextContent("상대 팀 (선택)");
    expect(screen.getByLabelText(/^상대 팀/)).toHaveAttribute("placeholder", "예: FC 서울");
  });

  it("종류(축구 · 풋살 5:5 · 풋살 6:6)를 고르고, 풋살이면 쿼터 수 칸이 없다", async () => {
    const user = userEvent.setup();
    const action = vi.fn<Action>(noop);
    render(<MatchForm action={action} submitLabel="만들기" />);
    expect(screen.getByLabelText("종류")).toHaveValue("football");
    expect(screen.getAllByRole("option").filter((option) => option.closest("select")?.id === "format").map((option) => option.textContent)).toEqual([
      "축구",
      "풋살 5:5",
      "풋살 6:6",
    ]);

    await user.selectOptions(screen.getByLabelText("종류"), "futsal6");
    expect(screen.queryByLabelText("쿼터 수")).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("날짜"), { target: { value: "2026-10-25" } });
    await user.click(screen.getByRole("button", { name: "만들기" }));
    await waitFor(() => expect(action).toHaveBeenCalledTimes(1));
    expect(action.mock.calls[0][1].get("format")).toBe("futsal6");
  });
});
