import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { ActionState } from "@/shared/ui";
import TeamBuilder, { type TeamBuilderPlayer } from "./TeamBuilder";

type Action = (state: ActionState, formData: FormData) => Promise<ActionState>;
const ok: Action = async () => ({});

const players: TeamBuilderPlayer[] = ["가", "나", "다", "라", "마", "바", "사", "아", "자", "차", "카"].map((name, index) => ({
  id: `p${index + 1}`,
  realName: `${name}선수`,
  jerseyNumber: index + 1,
  strength: 9 - (index % 7),
  guest: index === 10,
}));

const renderBuilder = (props: Partial<Parameters<typeof TeamBuilder>[0]> = {}) =>
  render(
    <TeamBuilder
      matchId="m1"
      format="futsal5"
      players={players}
      initialTeamCount={2}
      initialAssignments={{}}
      published={false}
      saveAction={ok}
      publishAction={ok}
      random={() => 0.5}
      {...props}
    />,
  );

const team = (label: string) => screen.getByRole("region", { name: label });
const names = (region: HTMLElement) => within(region).queryAllByRole("button", { name: /선수/ }).map((button) => button.textContent);

describe("풋살 팀 나누기 화면 (PLAN.md §6 풋살)", () => {
  it("아직 나누지 않았으면 참석한 사람이 '팀 없음'에 있다", () => {
    renderBuilder();
    expect(names(team("팀 없음"))).toHaveLength(11);
    expect(names(team("A팀"))).toHaveLength(0);
  });

  it("자동으로 나누면 모두 팀에 들고 인원은 6 · 5 다", async () => {
    const user = userEvent.setup();
    renderBuilder();
    await user.click(screen.getByRole("button", { name: "자동으로 나누기" }));
    expect(screen.queryByRole("region", { name: "팀 없음" })).not.toBeInTheDocument();
    expect([names(team("A팀")).length, names(team("B팀")).length].sort()).toEqual([5, 6]);
    expect(team("A팀")).toHaveTextContent(/평균 \d\.\d/);
  });

  it("3팀을 고르고 나누면 세 팀(4 · 4 · 3)이 되고, 5명이 안 되는 팀을 알려 준다", async () => {
    const user = userEvent.setup();
    renderBuilder();
    await user.click(screen.getByRole("button", { name: "3팀" }));
    await user.click(screen.getByRole("button", { name: "자동으로 나누기" }));
    expect([names(team("A팀")).length, names(team("B팀")).length, names(team("C팀")).length].sort()).toEqual([3, 4, 4]);
    expect(screen.getByRole("status", { name: "모자란 팀" })).toHaveTextContent("5명이 안 돼요");
  });

  it("사람을 누르고 옮길 팀을 누르면 옮긴다", async () => {
    const user = userEvent.setup();
    renderBuilder({ initialAssignments: { p1: 1, p2: 2 } });
    await user.click(within(team("A팀")).getByRole("button", { name: /가선수/ }));
    await user.click(screen.getByRole("button", { name: "B팀으로" }));
    expect(names(team("B팀"))).toEqual(expect.arrayContaining([expect.stringContaining("가선수")]));
    expect(names(team("A팀"))).toHaveLength(0);
  });

  it("그날 용병은 관리자 화면에서 용병으로 보인다", () => {
    renderBuilder();
    expect(within(team("팀 없음")).getByRole("button", { name: /카선수/ })).toHaveTextContent("용병");
  });

  it("바꾼 것이 있어야 저장하고, 팀 수와 명단을 보낸다", async () => {
    const user = userEvent.setup();
    const action = vi.fn<Action>(ok);
    renderBuilder({ initialAssignments: { p1: 1, p2: 2 }, saveAction: action });
    const save = screen.getByRole("button", { name: "저장" });
    expect(save).toBeDisabled();

    await user.click(within(team("팀 없음")).getByRole("button", { name: /다선수/ }));
    await user.click(screen.getByRole("button", { name: "A팀으로" }));
    await user.click(save);

    await waitFor(() => expect(action).toHaveBeenCalledTimes(1));
    const data = action.mock.calls[0][1];
    expect(data.get("teamCount")).toBe("2");
    expect(JSON.parse(String(data.get("members")))).toEqual(
      expect.arrayContaining([
        { member_id: "p1", team_number: 1 },
        { member_id: "p2", team_number: 2 },
        { member_id: "p3", team_number: 1 },
      ]),
    );
    expect(await screen.findByRole("status", { name: "" })).toBeTruthy();
  });

  it("저장하기 전에는 공개할 수 없다", async () => {
    const user = userEvent.setup();
    renderBuilder();
    await user.click(screen.getByRole("button", { name: "자동으로 나누기" }));
    expect(screen.getByRole("button", { name: "공개하기" })).toBeDisabled();
  });
});
