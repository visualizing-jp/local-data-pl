"""ZIP 内の 【財政状況資料集】_{code}_*.xlsx を {dest}/{code}.xlsx に出す。"""

import re
import sys
import zipfile
from pathlib import Path

src, dest = Path(sys.argv[1]), Path(sys.argv[2])
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
