import path from "node:path";
import { describe, expect, it } from "vitest";
import { isPathInside } from "../../src/io/fs.js";

describe("path utilities", () => {
  it("treats only the parent directory and its descendants as inside", () => {
    const root = path.resolve("/tmp/draftpine-site");

    expect(isPathInside(root, root)).toBe(true);
    expect(isPathInside(root, path.join(root, "prototype/index.html"))).toBe(true);
    expect(isPathInside(root, path.resolve("/tmp/draftpine-site-sibling/index.html"))).toBe(false);
    expect(isPathInside(root, path.join(root, "../outside.html"))).toBe(false);
  });
});
