"""
팀 엠블럼 원본(assets/brand/spr_logo.png)에서 앱이 쓰는 크기를 모두 만든다.
엠블럼을 바꾸면 원본만 바꾸고 이 스크립트를 다시 돌린다(docs/SETUP.md "엠블럼").

    python3 scripts/brand-icons.py

Pillow 가 필요하다(pip install pillow). 결과 PNG 는 저장소에 같이 커밋한다 — 서버에서 그리지 않는다.
"""

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "assets/brand/spr_logo.png"

# globals.css 의 --color-bg-base(앱 바탕). 불투명해야 하는 아이콘(아이폰 · 안드로이드 마스크)의 바탕이다
BG_BASE = (11, 16, 22, 255)
# --color-kit(머리띠 하늘색)
KIT = (128, 196, 238, 255)


def crest(size: int) -> Image.Image:
    return Image.open(SOURCE).convert("RGBA").resize((size, size), Image.LANCZOS)


def transparent(size: int, scale: float = 1.0) -> Image.Image:
    """바탕이 투명한 정사각형 가운데에 엠블럼(scale = 한 변 대비 지름)"""
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    inner = round(size * scale)
    canvas.alpha_composite(crest(inner), ((size - inner) // 2, (size - inner) // 2))
    return canvas


def on_background(width: int, height: int, diameter: int, background=BG_BASE) -> Image.Image:
    canvas = Image.new("RGBA", (width, height), background)
    canvas.alpha_composite(crest(diameter), ((width - diameter) // 2, (height - diameter) // 2))
    return canvas


def save(image: Image.Image, path: str, opaque: bool = False) -> None:
    """엠블럼은 색이 몇 가지뿐이라 256색 팔레트로 줄여도 티가 나지 않고 파일이 서너 배 작아진다"""
    target = ROOT / path
    target.parent.mkdir(parents=True, exist_ok=True)
    flat = image.convert("RGB") if opaque else image
    flat.quantize(colors=256, method=Image.Quantize.FASTOCTREE).save(target, optimize=True)
    print(f"{path}  {image.width}x{image.height}")


# 화면 속 엠블럼(머리띠 · 관리 메뉴 · 로그인 · 매치 미리보기). 가장 크게 그리는 곳이 96px 라 레티나 2배 이상
save(transparent(256), "public/emblem.png")
# 서버 이미지(카톡 미리보기 카드 · 쿼터별 · 출전표 머리글). 서버가 읽어 data URI 로 넣는다(loadImageEmblem)
save(transparent(160), "src/shared/assets/brand/emblem.png")
# 브라우저 탭(파비콘)
save(transparent(64), "src/app/icon.png")
# 아이폰 홈 화면: 투명하면 검게 칠해지므로 앱 바탕 위에. 모서리는 아이폰이 둥글게 깎는다
save(on_background(180, 180, 158), "src/app/apple-icon.png", opaque=True)
# 홈 화면 앱(PWA) 기본 아이콘: 둥근 엠블럼 그대로
save(transparent(192, 0.96), "public/icons/icon-192.png")
save(transparent(512, 0.96), "public/icons/icon-512.png")
# 안드로이드 마스크 아이콘: 기기가 원 · 둥근 사각형으로 깎아도 엠블럼이 잘리지 않게 안전 영역(지름 80%) 안에
save(on_background(512, 512, 390), "public/icons/icon-maskable-512.png", opaque=True)

# 카톡 · 메신저 미리보기 기본 이미지(1200×630). 위에 머리띠 하늘색 줄, 가운데 엠블럼
og = on_background(1200, 630, 430)
og.paste(Image.new("RGBA", (1200, 16), KIT), (0, 0))
save(og, "src/app/opengraph-image.png", opaque=True)
