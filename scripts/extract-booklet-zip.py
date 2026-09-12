"""ZIP から資料集 Excel を出す。

dest が .xlsx なら ZIP 内の xlsx を1本だけそこに書く。
dest がディレクトリなら 【財政状況資料集】_{code}_*.xlsx を {dest}/{code}.xlsx に出す。
"""

import re
import sys
import zipfile
from pathlib import Path


def xlsx_members(z: zipfile.ZipFile) -> list[zipfile.ZipInfo]:
    return [
        info
        for info in z.infolist()
        if not info.is_dir() and info.filename.replace("\\", "/").lower().endswith(".xlsx")
    ]


src, dest = Path(sys.argv[1]), Path(sys.argv[2])
if dest.suffix.lower() == ".xlsx":
    with zipfile.ZipFile(src) as z:
        files = xlsx_members(z)
        if len(files) != 1:
            raise SystemExit(f"{src}: xlsx が {len(files)} 本")
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_bytes(z.read(files[0]))
    raise SystemExit(0)

dest.mkdir(parents=True, exist_ok=True)
with zipfile.ZipFile(src) as z:
    for info in z.infolist():
        if info.is_dir():
            continue
        name = info.filename.replace("\\", "/")
        if not name.lower().endswith(".xlsx"):
            continue
        hit = re.search(r"_(\d{6})_", name.rsplit("/", 1)[-1])
        if hit is None:
            continue
        dest.joinpath(f"{hit.group(1)}.xlsx").write_bytes(z.read(info))
