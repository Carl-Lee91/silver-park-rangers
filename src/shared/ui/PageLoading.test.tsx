import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import PageLoading from "./PageLoading";

describe("화면 불러오는 중", () => {
  it("불러오는 중임을 알린다", () => {
    render(<PageLoading />);
    expect(screen.getByRole("status")).toHaveTextContent("불러오는 중이에요");
  });
});
