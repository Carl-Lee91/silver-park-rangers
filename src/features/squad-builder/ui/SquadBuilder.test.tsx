import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
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
  jerseyNumber: null,
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

  describe("선수 표(풋볼매니저 전술 화면)", () => {
    const lineup = () => screen.getByRole("group", { name: "선발" });

    it("선발 명단을 키퍼부터 뒤에서 앞으로 보여 주고, 누르면 그 자리를 고른다", async () => {
      const user = userEvent.setup();
      renderBuilder();
      await user.click(screen.getByRole("button", { name: "자동 배치" }));

      expect(within(lineup()).getAllByRole("button").map((row) => row.textContent)).toEqual([
        expect.stringMatching(/^GK.*김키퍼/),
        expect.stringMatching(/^CB.*이수비/),
        expect.stringMatching(/^FW.*박공격/),
      ]);
      await user.click(within(lineup()).getByRole("button", { name: /이수비/ }));
      await user.click(screen.getByRole("button", { name: "빼기" }));
      expect(within(bench()).getByRole("button", { name: /이수비/ })).toBeInTheDocument();
    });

    it("쿼터마다 필드 · 키퍼 · 쉼을 점으로 보여 준다", async () => {
      const user = userEvent.setup();
      renderBuilder();
      await user.click(screen.getByRole("button", { name: "자동 배치" }));

      const keeper = within(lineup()).getByRole("button", { name: /김키퍼/ });
      expect(within(keeper).getByRole("img")).toHaveAccessibleName("1쿼터 키퍼, 2쿼터 키퍼");
      const field = within(lineup()).getByRole("button", { name: /이수비/ });
      expect(within(field).getByRole("img")).toHaveAccessibleName("1쿼터 출전, 2쿼터 출전");
    });

    it("자리를 고르면 벤치를 그 자리에 맞는 사람부터 놓고 몇 순위인지 보여 준다", async () => {
      const user = userEvent.setup();
      renderBuilder();
      await user.click(within(pitch()).getByRole("button", { name: /^CB/ }));

      const rows = within(bench()).getAllByRole("button");
      expect(rows[0]).toHaveAccessibleName(/이수비/);
      expect(rows[0]).toHaveTextContent("1순위");
    });

    it("벤치 선수를 고르면 경기장 자리마다 그 선수에게 맞는 정도를 보여 준다", async () => {
      const user = userEvent.setup();
      renderBuilder();
      await user.click(within(bench()).getByRole("button", { name: /이수비/ }));

      expect(within(pitch()).getByRole("button", { name: /^CB/ })).toHaveAccessibleName(/고른 선수 1순위/);
      expect(within(pitch()).getByRole("button", { name: /^FW/ })).not.toHaveAccessibleName(/고른 선수/);
    });

    it("이 쿼터에 못 오는 사람은 벤치가 아니라 못 옴에 따로 보여 준다", () => {
      const late: BuilderPlayer = { ...player("l", "최늦음", ["MF"]), arriveAt: "10:30", availableQuarters: [1] };
      renderBuilder({ pool: [...pool, late] });

      expect(within(screen.getByRole("group", { name: "못 옴" })).getByText(/최늦음/)).toBeInTheDocument();
      expect(within(bench()).queryByRole("button", { name: /최늦음/ })).not.toBeInTheDocument();
    });

    it("경기장의 필드 선수는 우리 유니폼 색, 키퍼는 키퍼 색 동그라미다", async () => {
      const user = userEvent.setup();
      renderBuilder();
      await user.click(screen.getByRole("button", { name: "자동 배치" }));

      expect(within(within(pitch()).getByRole("button", { name: /CB 이수비/ })).getByText("CB")).toHaveClass("bg-kit");
      expect(within(within(pitch()).getByRole("button", { name: /GK 김키퍼/ })).getByText("GK")).toHaveClass("bg-kakao");
    });
  });

  describe("특이사항", () => {
    const notes = { c: "무릎 안 좋음 — 수비만" };

    it("경기장과 같은 화면에 이 매치의 특이사항을 모아 보여 준다", () => {
      renderBuilder({ notes, noteAction: noop });
      const list = screen.getByRole("region", { name: "특이사항" });
      expect(list).toHaveTextContent("이수비");
      expect(list).toHaveTextContent("무릎 안 좋음 — 수비만");
    });

    it("메모가 있는 선수는 벤치에서 표시된다", () => {
      renderBuilder({ notes, noteAction: noop });
      expect(within(bench()).getByRole("button", { name: /이수비/ })).toHaveTextContent("메모");
    });

    it("선수를 고르면 그 선수의 특이사항을 바로 고칠 수 있다", async () => {
      const user = userEvent.setup();
      renderBuilder({ notes, noteAction: noop });
      await user.click(within(bench()).getByRole("button", { name: /이수비/ }));
      expect(screen.getByLabelText("이수비 특이사항")).toHaveValue("무릎 안 좋음 — 수비만");
    });
  });

  describe("당일 변동", () => {
    afterEach(() => vi.restoreAllMocks());

    it("2쿼터부터 다시 배치하면 1쿼터는 그대로 둔다", async () => {
      const user = userEvent.setup();
      vi.spyOn(window, "confirm").mockReturnValue(true);
      renderBuilder();
      await user.click(screen.getByRole("button", { name: "자동 배치" }));
      const firstQuarter = within(pitch()).getAllByRole("button").map((button) => button.textContent);

      await user.click(screen.getByRole("tab", { name: /2쿼터/ }));
      await user.click(screen.getByRole("button", { name: "2쿼터부터 다시 배치" }));
      await user.click(screen.getByRole("tab", { name: /1쿼터/ }));

      expect(within(pitch()).getAllByRole("button").map((button) => button.textContent)).toEqual(firstQuarter);
    });

    it("1쿼터에서는 다시 배치 단추가 없다 — 그건 자동 배치다", () => {
      renderBuilder();
      expect(screen.queryByRole("button", { name: /쿼터부터 다시 배치/ })).not.toBeInTheDocument();
    });

    it("선수를 고르면 그 선수의 도착·떠나는 시간을 고칠 수 있다", async () => {
      const user = userEvent.setup();
      renderBuilder({ windowAction: noop });
      await user.click(within(bench()).getByRole("button", { name: /이수비/ }));
      expect(screen.getByLabelText("이수비 떠나는 시간")).toBeInTheDocument();
    });
  });
});
