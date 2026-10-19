import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { Formation } from "@/entities/formation";
import { quarterSchedule } from "@/entities/match";
import type { ActionState } from "@/shared/ui";
import { initialBuilder } from "../model/builder";
import type { BuilderPlayer } from "../model/pool";
import SquadBuilder from "./SquadBuilder";

type Action = (state: ActionState, formData: FormData) => Promise<ActionState>;
const noop: Action = async () => ({});

const F: Formation = {
  id: "f",
  name: "미니",
  isPreset: true,
  slots: [
    { position: "GK", x: 50, y: 92 },
    { position: "CB", x: 50, y: 70 },
    { position: "FW", x: 50, y: 20 },
  ],
};
const schedule = quarterSchedule({ startsAt: "10:00", endsAt: "11:00", quarterCount: 2 });
const player = (id: string, realName: string, preferredPositions: BuilderPlayer["preferredPositions"]): BuilderPlayer => ({
  id,
  realName,
  memberType: "member",
  preferredPositions,
  feet: ["right"],
  response: "yes",
  arriveAt: null,
  leaveAt: null,
  availableQuarters: [0, 1],
});
const pool = [player("k", "김키퍼", ["GK"]), player("c", "이수비", ["CB"]), player("f", "박공격", ["FW"])];

const renderBuilder = (props: Partial<Parameters<typeof SquadBuilder>[0]> = {}) =>
  render(
    <SquadBuilder
      matchId="m1"
      schedule={schedule}
      pool={pool}
      formations={[F]}
      initial={initialBuilder(2, [], F)}
      published={false}
      saveAction={noop}
      publishAction={noop}
      {...props}
    />,
  );

const pitch = () => screen.getByRole("group", { name: "경기장" });
const bench = () => screen.getByRole("group", { name: "벤치" });

describe("스쿼드 빌더", () => {
  it("벤치 선수를 누르고 자리를 누르면 들어간다", async () => {
    const user = userEvent.setup();
    renderBuilder();

    await user.click(within(bench()).getByRole("button", { name: /이수비/ }));
    await user.click(within(pitch()).getByRole("button", { name: /^CB/ }));

    expect(within(pitch()).getByRole("button", { name: /CB 이수비/ })).toBeInTheDocument();
    expect(within(bench()).queryByRole("button", { name: /이수비/ })).not.toBeInTheDocument();
  });

  it("자리에 있는 선수를 골라 빼면 벤치로 돌아간다", async () => {
    const user = userEvent.setup();
    renderBuilder();
    await user.click(within(bench()).getByRole("button", { name: /이수비/ }));
    await user.click(within(pitch()).getByRole("button", { name: /^CB/ }));

    await user.click(within(pitch()).getByRole("button", { name: /CB 이수비/ }));
    await user.click(screen.getByRole("button", { name: "빼기" }));

    expect(within(bench()).getByRole("button", { name: /이수비/ })).toBeInTheDocument();
  });

  it("자동 배치를 누르면 키퍼와 필드를 채운다", async () => {
    const user = userEvent.setup();
    renderBuilder();
    await user.click(screen.getByRole("button", { name: "자동 배치" }));

    expect(within(pitch()).getByRole("button", { name: /GK 김키퍼/ })).toBeInTheDocument();
    expect(within(pitch()).getByRole("button", { name: /CB 이수비/ })).toBeInTheDocument();
    expect(within(pitch()).getByRole("button", { name: /FW 박공격/ })).toBeInTheDocument();
  });

  it("쿼터 탭을 바꾸면 그 쿼터의 배치를 보여 준다", async () => {
    const user = userEvent.setup();
    renderBuilder();
    await user.click(within(bench()).getByRole("button", { name: /이수비/ }));
    await user.click(within(pitch()).getByRole("button", { name: /^CB/ }));

    await user.click(screen.getByRole("tab", { name: /2쿼터/ }));
    expect(within(pitch()).queryByRole("button", { name: /이수비/ })).not.toBeInTheDocument();
    await user.click(screen.getByRole("tab", { name: /1쿼터/ }));
    expect(within(pitch()).getByRole("button", { name: /CB 이수비/ })).toBeInTheDocument();
  });

  it("비어 있는 키퍼 자리와 필드를 경고한다", () => {
    renderBuilder();
    expect(screen.getByText("1쿼터 키퍼가 비었어요.")).toBeInTheDocument();
    expect(screen.getByText("1쿼터 필드가 2자리 비었어요.")).toBeInTheDocument();
  });

  it("저장하면 전 쿼터를 save_squad 모양으로 보낸다", async () => {
    const user = userEvent.setup();
    const saveAction = vi.fn<Action>(noop);
    renderBuilder({ saveAction });
    await user.click(screen.getByRole("button", { name: "자동 배치" }));
    await user.click(screen.getByRole("button", { name: "저장" }));

    await waitFor(() => expect(saveAction).toHaveBeenCalledTimes(1));
    const formData = saveAction.mock.calls[0][1];
    expect(formData.get("matchId")).toBe("m1");
    const payload = JSON.parse(String(formData.get("quarters")));
    expect(payload).toHaveLength(2);
    expect(payload[0].slots[0]).toMatchObject({ position: "GK", member_id: "k" });
  });

  it("저장하지 않은 변경이 있으면 공개할 수 없다", async () => {
    const user = userEvent.setup();
    renderBuilder();
    expect(screen.getByRole("button", { name: "공개하기" })).toBeEnabled();
    await user.click(screen.getByRole("button", { name: "자동 배치" }));
    expect(screen.getByRole("button", { name: "공개하기" })).toBeDisabled();
  });

  it("올해 평균 출전 쿼터를 벤치에 보여 준다 — 최근 덜 뛴 사람을 고르기 쉽게", () => {
    renderBuilder({ seasonAverages: { c: 3.4 } });
    expect(within(bench()).getByRole("button", { name: /이수비/ })).toHaveTextContent("올해 평균 3.4");
    expect(within(bench()).getByRole("button", { name: /박공격/ })).not.toHaveTextContent("올해 평균");
  });
});
