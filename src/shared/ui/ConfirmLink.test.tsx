import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const router = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => router }));

const { default: ConfirmLink } = await import("./ConfirmLink");

const LEAVE = { message: "저장하지 않은 변경이 있어요.", confirmLabel: "나가기" };

describe("확인하고 가는 링크", () => {
  beforeEach(() => router.push.mockClear());

  it("물을 것이 없으면 그냥 링크다", () => {
    render(
      <ConfirmLink href="/admin/members/a1" confirm={null}>
        선수 상세
      </ConfirmLink>,
    );
    expect(screen.getByRole("link", { name: "선수 상세" })).toHaveAttribute("href", "/admin/members/a1");
  });

  it("물을 것이 있으면 누를 때 확인 창을 띄우고, 취소하면 그대로 있는다", async () => {
    const user = userEvent.setup();
    render(
      <ConfirmLink href="/admin/members/a1" confirm={LEAVE}>
        선수 상세
      </ConfirmLink>,
    );
    await user.click(screen.getByRole("button", { name: "선수 상세" }));
    expect(screen.getByRole("alertdialog")).toHaveTextContent("저장하지 않은 변경이 있어요.");
    await user.click(screen.getByRole("button", { name: "취소" }));
    expect(router.push).not.toHaveBeenCalled();
  });

  it("확인하면 그 주소로 간다", async () => {
    const user = userEvent.setup();
    render(
      <ConfirmLink href="/admin/members/a1" confirm={LEAVE}>
        선수 상세
      </ConfirmLink>,
    );
    await user.click(screen.getByRole("button", { name: "선수 상세" }));
    await user.click(screen.getByRole("button", { name: "나가기" }));
    expect(router.push).toHaveBeenCalledWith("/admin/members/a1");
  });
});
