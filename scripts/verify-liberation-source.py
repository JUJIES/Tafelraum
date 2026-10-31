#!/usr/bin/env python3
"""Optional read-only forensic check; normal builds need no Python/fontTools."""
import argparse
import hashlib
import io
import json
from pathlib import Path
import re
import tarfile


def ar_member(data, prefix):
    if not data.startswith(b"!<arch>\n"):
        raise ValueError("Not a Debian ar package")
    offset = 8
    while offset + 60 <= len(data):
        header = data[offset:offset + 60]
        size = int(header[48:58].strip())
        if size < 0 or offset + 60 + size > len(data):
            raise ValueError("Invalid ar member size")
        name = header[:16].decode("ascii").strip().rstrip("/")
        if name.startswith(prefix):
            return data[offset + 60:offset + 60 + size]
        offset += 60 + size + size % 2
    raise ValueError("Missing Debian data archive")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--evidence", type=Path, required=True, help="Published SOURCE_EVIDENCE.json; source archives must be beside it")
    parser.add_argument("--debian-package", type=Path, required=True, help="Original 1.04.93-1 .deb from the evidence URL")
    parser.add_argument("--font", type=Path, required=True, help="Installed Excalidraw LiberationSans-Regular.woff2")
    parser.add_argument("--output", type=Path, help="Optional new JSON report; never overwritten")
    args = parser.parse_args()
    try:
        from fontTools.ttLib import TTFont
        from fontTools import __version__ as version
    except ImportError:
        parser.error("This optional check needs fonttools[woff]; use a separate analysis environment, not an app dependency.")

    evidence = json.loads(args.evidence.read_text())
    digest = lambda data: hashlib.sha256(data).hexdigest()
    inputs = {}
    for key in ("sourceArchive", "debianPatch", "descriptor"):
        row = evidence[key]
        file = Path(row["file"])
        if file.is_absolute() or len(file.parts) != 1:
            raise ValueError("Source input must be beside the evidence file")
        inputs[key] = (args.evidence.parent / file).read_bytes()
        if digest(inputs[key]) != row["sha256"]:
            raise ValueError(f"Changed source input: {row['file']}")
    descriptor = inputs["descriptor"].decode("utf-8")
    declared = {name: (sha, int(size)) for sha, size, name in
                re.findall(r"^ ([0-9a-f]{64}) (\d+) (\S+)$", descriptor, re.M)}
    for key in ("sourceArchive", "debianPatch"):
        row = evidence[key]
        if declared.get(row["file"]) != (digest(inputs[key]), len(inputs[key])):
            raise ValueError("Source hash/size does not match the published Debian descriptor")
    with tarfile.open(fileobj=io.BytesIO(inputs["sourceArchive"])) as archive:
        sfd = next(row for row in archive.getmembers() if row.name.endswith("/src/LiberationSans-Regular.sfd"))
        sfd_text = archive.extractfile(sfd).read().decode("utf-8")

    package = args.debian_package.read_bytes()
    if digest(package) != evidence["binaryPackage"]["sha256"]:
        raise ValueError("Changed original Debian binary package")
    with tarfile.open(fileobj=io.BytesIO(ar_member(package, "data.tar"))) as archive:
        expected = evidence["binaryPackage"]["fontFile"]
        member = next(row for row in archive.getmembers() if row.name.removeprefix("./") == expected)
        ttf = archive.extractfile(member).read()
    woff = args.font.read_bytes()
    if digest(ttf) != evidence["binaryPackage"]["fontSha256"] or digest(woff) != evidence["font"]["sha256"]:
        raise ValueError("Font bytes do not match the recorded correspondence")
    original, shipped = TTFont(io.BytesIO(ttf)), TTFont(io.BytesIO(woff))
    glyphs = original.getGlyphOrder()
    if set(glyphs) != set(shipped.getGlyphOrder()):
        raise ValueError("Different glyph inventory")
    outlines, hinting = [], []
    bytecode = lambda glyph: glyph.program.getBytecode() if getattr(glyph, "program", None) else b""
    for name in glyphs:
        a, b = original["glyf"][name], shipped["glyf"][name]
        if a.getCoordinates(original["glyf"]) != b.getCoordinates(shipped["glyf"]):
            outlines.append(name)
        if bytecode(a) != bytecode(b):
            hinting.append(name)
    comparison = {"glyphs": len(glyphs), "outlineDifferences": outlines,
                  "hintProgramDifferences": hinting,
                  "cmapEqual": original.getBestCmap() == shipped.getBestCmap(),
                  "metricsEqual": original["hmtx"].metrics == shipped["hmtx"].metrics,
                  "tableBytesEqual": {tag: original.getTableData(tag) == shipped.getTableData(tag)
                                      for tag in original.reader.tables if tag in shipped.reader.tables}}
    if comparison != evidence["comparison"] or len(re.findall(r"^StartChar:", sfd_text, re.M)) != len(glyphs):
        raise ValueError("Comparison no longer matches the recorded source evidence")
    report = {"fontTools": version, "comparison": comparison,
              "sourceAndPatchMatchDescriptor": True, "sfdGlyphsMatch": True,
              "limits": "No PGP signature verification, byte-identical rebuild or legal compatibility approval."}
    if args.output:
        with args.output.open("x") as file:
            json.dump(report, file, indent=2)
            file.write("\n")
    print(json.dumps({"glyphs": len(glyphs), "outlineDifferences": len(outlines),
                      "hintDifferences": len(hinting), "verified": True}))


if __name__ == "__main__":
    main()
