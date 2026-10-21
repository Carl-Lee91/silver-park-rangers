import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import SquadImageViewer from "./SquadImageViewer";

const urls = { quarters: "/q.png?v=1", rotation: "/r.png?v=1" };

describe("스쿼드 이미지 보기 — 새 창 없이 앱 안에서 연다", () => {
  afterEach(() => window.history.replaceState(null, "", "/"));

  it("단추를 누르면 앱 안에서 열고, 이미지를 만드는 동안 기다리라고 한다", async () => {
    const user = userEvent.setup();
    render(<SquadImageViewer urls={urls} fileName="10월 25일 스쿼드" />);

    await user.click(screen.getByRole("button", { name: "출전표 이미지" }));

    const dialog = screen.getByRole("dialog", { name: "출전표 이미지" });
    expect(dialog).toHaveTextContent("이미지를 만드는 중이에요");
    expect(window.location.search).toBe("?image=rotation");
  });

  it("다 그려지면 이미지와 저장 단추를 보여 준다", async () => {
    const user = userEvent.setup();
    render(<SquadImageViewer urls={urls} fileName="10월 25일 스쿼드" />);
    await user.click(screen.getByRole("button", { name: "쿼터별 이미지" }));

    fireEvent.load(screen.getByAltText("쿼터별 이미지"));

    expect(screen.queryByText("이미지를 만드는 중이에요")).toBeNull();
    expect(screen.getByRole("img", { name: "쿼터별 이미지" })).toBeVisible();
    const save = screen.getByRole("link", { name: "이미지 저장" });
    expect(save).toHaveAttribute("href", urls.quarters);
    expect(save).toHaveAttribute("download", "10월 25일 스쿼드 쿼터별.png");
  });

  it("안에서 다른 이미지로 바꿔도 뒤로 가기 한 번이면 닫힌다(기록을 쌓지 않는다)", async () => {
    const user = userEvent.setup();
    render(<SquadImageViewer urls={urls} fileName="스쿼드" />);
    const before = window.history.length;

    await user.click(screen.getByRole("button", { name: "쿼터별 이미지" }));
    await user.click(screen.getByRole("tab", { name: "출전표" }));

    expect(screen.getByAltText("출전표 이미지")).toHaveAttribute("src", urls.rotation);
    expect(window.location.search).toBe("?image=rotation");
    expect(window.history.length).toBe(before + 1);
  });

  it("뒤로 가기를 누르면 앱이 아니라 이미지 보기만 닫힌다", async () => {
    const user = userEvent.setup();
    render(<SquadImageViewer urls={urls} fileName="스쿼드" />);
    await user.click(screen.getByRole("button", { name: "출전표 이미지" }));

    window.history.back();

    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(window.location.search).toBe("");
  });

  it("닫기를 눌러도 닫힌다", async () => {
    const user = userEvent.setup();
    render(<SquadImageViewer urls={urls} fileName="스쿼드" />);
    await user.click(screen.getByRole("button", { name: "출전표 이미지" }));

    await user.click(screen.getByRole("button", { name: "닫기" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("주소에 ?image= 를 달고 바로 들어와도 연다 — 닫으면 그 표시만 지운다", async () => {
    window.history.replaceState(null, "", "/?image=quarters");
    const user = userEvent.setup();
    render(<SquadImageViewer urls={urls} fileName="스쿼드" />);
    expect(screen.getByRole("dialog", { name: "쿼터별 이미지" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "닫기" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(window.location.pathname).toBe("/");
  });

  it("못 그리면 다시 시도할 수 있다", async () => {
    const user = userEvent.setup();
    render(<SquadImageViewer urls={urls} fileName="스쿼드" />);
    await user.click(screen.getByRole("button", { name: "출전표 이미지" }));

    fireEvent.error(screen.getByAltText("출전표 이미지"));
    expect(screen.getByText("이미지를 만들지 못했어요.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "다시 시도" }));
    expect(screen.getByText("이미지를 만드는 중이에요")).toBeInTheDocument();
  });
});
