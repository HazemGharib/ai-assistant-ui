import type { Citation } from "@hazemgharib/ai-agent-contracts";

type CitationsPanelProps = {
  citations: Citation[] | undefined;
};

/**
 * Display-only citations (FR-008). URLs render as plain text — no navigation.
 */
export function CitationsPanel({ citations }: CitationsPanelProps) {
  if (!citations || citations.length === 0) {
    return null;
  }

  return (
    <details className="citations">
      <summary className="citations__summary">
        {citations.length} source{citations.length === 1 ? "" : "s"}
      </summary>
      <ul className="citations__list">
        {citations.map((c) => (
          <li key={`${c.documentId}-${c.chunkId ?? c.source}`} className="citations__item">
            <div className="citations__title">
              {c.title?.trim() || c.source}
            </div>
            {c.snippet ? (
              <p className="citations__snippet">{c.snippet}</p>
            ) : null}
            <p className="citations__meta">
              <span>{c.source}</span>
              {c.url ? (
                <>
                  {" · "}
                  <span className="citations__url">{c.url}</span>
                </>
              ) : null}
            </p>
          </li>
        ))}
      </ul>
    </details>
  );
}
