from __future__ import annotations

import sys
from pathlib import Path


def bootstrap_repo_paths() -> None:
    repo_root = Path(__file__).resolve().parents[3]
    core_path = repo_root / "packages" / "core"
    if str(core_path) not in sys.path:
        sys.path.insert(0, str(core_path))

