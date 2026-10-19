import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Testing Library 는 전역 afterEach 가 있을 때만 스스로 정리한다. 이 저장소는
// vitest 의 globals 를 끄고 명시적으로 import 하므로, 정리도 직접 걸어 준다.
// 안 걸면 앞 테스트가 그린 화면이 남아 "같은 버튼이 둘"로 보인다.
afterEach(cleanup);
