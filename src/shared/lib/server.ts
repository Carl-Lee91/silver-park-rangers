import { readFile } from "node:fs/promises";
import path from "node:path";

/**
 * 서버 이미지(next/og)에 쓸 한글 폰트. Satori 기본 폰트에는 한글이 없다.
 * Pretendard(OFL-1.1, src/shared/assets/fonts/Pretendard-LICENSE.txt).
 *
 * 🔴 경로는 이 모양 그대로 둔다. 배포 묶음에 폰트 파일이 들어가도록 next.config 의
 * outputFileTracingIncludes 가 같은 폴더를 가리킨다.
 */
const FONT_DIR = path.join(process.cwd(), "src/shared/assets/fonts");

let cached: Promise<{ name: string; data: ArrayBuffer; weight: 400 | 700; style: "normal" }[]> | null = null;

const load = async (file: string) => {
  const buffer = await readFile(path.join(FONT_DIR, file));
  return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;
};

export const loadImageFonts = () =>
  (cached ??= Promise.all([load("Pretendard-Regular.otf"), load("Pretendard-Bold.otf")]).then(([regular, bold]) => [
    { name: "Pretendard", data: regular, weight: 400 as const, style: "normal" as const },
    { name: "Pretendard", data: bold, weight: 700 as const, style: "normal" as const },
  ]));
