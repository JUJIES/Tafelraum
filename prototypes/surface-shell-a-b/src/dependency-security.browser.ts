// Browser-only dependency integration check; not a production entry point.
import DOMPurify from "dompurify";
import { parseMermaidToExcalidraw } from "@excalidraw/mermaid-to-excalidraw";
import mermaid from "mermaid";
import katex from "katex";

export async function dependencySecurityFixture() {
  const diagram = await parseMermaidToExcalidraw("flowchart TD\n  A[Start] --> B[Ziel]");
  const sanitized = DOMPurify.sanitize('<img src="x" onerror="alert(1)"><a href="javascript:alert(1)">Link</a><script>alert(1)</script>');
  mermaid.initialize({ startOnLoad: false, securityLevel: "strict" });
  const math = await mermaid.render("dependency-math", 'flowchart TD\n A["$$\\frac{1}{2}+\\sqrt{x}$$"] --> B["Ziel"]');
  const mathDocument = new DOMParser().parseFromString(math.svg, "image/svg+xml");
  return {
    elements: diagram.elements.map(({ id, type }) => ({ id, type })),
    sanitized,
    math: {
      version: katex.version,
      fractions: mathDocument.querySelectorAll("mfrac").length,
      roots: mathDocument.querySelectorAll("msqrt").length,
      parseErrors: mathDocument.querySelectorAll("parsererror").length,
    },
  };
}
