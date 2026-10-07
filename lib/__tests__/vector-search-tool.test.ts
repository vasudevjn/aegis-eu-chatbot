import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/pinecone", () => ({ searchPinecone: vi.fn() }));

import { searchPinecone } from "@/lib/pinecone";
import {
  createVectorDatabaseSearch,
  NO_LIBRARY_MATCH,
  LIBRARY_UNAVAILABLE,
} from "@/app/api/chat/tools/search-vector-database";

const run = (collect = vi.fn()) => {
  const t = createVectorDatabaseSearch(collect);
  return {
    collect,
    result: t.execute!({ query: "Article 6(3) exception" }, { toolCallId: "t1", messages: [] }),
  };
};

describe("vectorDatabaseSearch fallback signals", () => {
  // Braces matter: returning the mock from beforeEach would make Vitest call it as a cleanup hook.
  beforeEach(() => {
    vi.mocked(searchPinecone).mockReset();
  });

  it("tells the model when the library has no matching passages", async () => {
    vi.mocked(searchPinecone).mockResolvedValue({ text: "<results>\n\n</results>", sources: [] });
    const { result, collect } = run();
    expect(await result).toBe(NO_LIBRARY_MATCH);
    expect(NO_LIBRARY_MATCH).toContain("aiActReference");
    expect(collect).not.toHaveBeenCalled();
  });

  it("tells the model when the library is unavailable instead of throwing", async () => {
    vi.mocked(searchPinecone).mockRejectedValue(new Error("index not found"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { result } = run();
    expect(await result).toBe(LIBRARY_UNAVAILABLE);
  });

  it("returns the passages and registers the sources when there are matches", async () => {
    vi.mocked(searchPinecone).mockResolvedValue({
      text: "<results>passage</results>",
      sources: [
        {
          source_name: "AI Act",
          source_description: "Regulation (EU) 2024/1689",
          source_url: "https://eur-lex.europa.eu/eli/reg/2024/1689/oj",
          chunks: [{ text: "Article 6(3) text" } as never],
        },
      ],
    });
    const { result, collect } = run();
    expect(await result).toBe("<results>passage</results>");
    expect(collect).toHaveBeenCalledWith(
      expect.objectContaining({ kind: "kb", url: "https://eur-lex.europa.eu/eli/reg/2024/1689/oj" }),
      expect.stringContaining("Article 6(3) text")
    );
  });
});
