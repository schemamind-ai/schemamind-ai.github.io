"""Fail if any published PDF contains private data.

Extracts the text of every PDF under the given directory and looks for runs of
nine or more digits (possible identification numbers) and e-mail addresses.
Usage: python3 scripts/check-pdfs.py dist
"""

import pathlib
import re
import sys

from pypdf import PdfReader

PATTERNS = {
    "digit run of 9 or more (possible ID number)": re.compile(r"\d{9,}"),
    "e-mail address": re.compile(r"[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}", re.I),
}


def main(root: str) -> int:
    pdfs = sorted(pathlib.Path(root).rglob("*.pdf"))
    problems = []
    for pdf in pdfs:
        reader = PdfReader(pdf)
        text = "\n".join(page.extract_text() or "" for page in reader.pages)
        if not text.strip():
            problems.append(f"{pdf}: no extractable text, cannot be checked")
        # Creation and modification dates are digit runs by format, so skip them.
        metadata = " ".join(
            str(value)
            for key, value in (reader.metadata or {}).items()
            if key not in ("/CreationDate", "/ModDate")
        )
        for name, pattern in PATTERNS.items():
            for source, content in (("text", text), ("metadata", metadata)):
                if pattern.search(content):
                    problems.append(f"{pdf}: {name} in {source}")

    if problems:
        print(f"PDF check failed ({len(problems)} problem(s)):")
        for problem in problems:
            print(f"  - {problem}")
        return 1
    print(f"PDF check passed: {len(pdfs)} PDF(s) checked.")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1] if len(sys.argv) > 1 else "dist"))
