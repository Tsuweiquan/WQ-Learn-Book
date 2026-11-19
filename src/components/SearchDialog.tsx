import { Modal, SearchField } from "@heroui/react";
import { useMemo, useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router";

import { searchTopics } from "../lib/search";
import { PAGE_TYPE_LABEL } from "../lib/topics";

export function SearchDialog({ isOpen, onOpenChange }: { isOpen: boolean; onOpenChange: (open: boolean) => void }) {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const results = useMemo(() => searchTopics(query), [query]);
  const close = () => onOpenChange(false);

  return (
    <Modal.Backdrop isOpen={isOpen} onOpenChange={onOpenChange}>
      <Modal.Container placement="top" size="lg" scroll="inside">
        <Modal.Dialog>
          <Modal.CloseTrigger />
          <Modal.Header>
            <Modal.Heading>Search the Learn Book</Modal.Heading>
          </Modal.Header>
          <Modal.Body className="grid gap-3">
            <SearchField
              aria-label="Search pages"
              value={query}
              onChange={setQuery}
              autoFocus
              fullWidth
              onSubmit={() => {
                const [first] = results;
                if (!first) return;
                close();
                navigate(first.path);
              }}
            >
              <SearchField.Group>
                <SearchField.SearchIcon />
                <SearchField.Input placeholder="Title, tag, area or type…" />
                <SearchField.ClearButton />
              </SearchField.Group>
            </SearchField>
            <p className="font-mono text-xs text-muted" aria-live="polite">
              {results.length} {results.length === 1 ? "page" : "pages"}
              {query && results.length > 0 && " · Enter opens the first"}
            </p>
            <ul className="grid gap-1">
              {results.map((t) => (
                <li key={t.id}>
                  <RouterLink
                    to={t.path}
                    onClick={close}
                    className="grid gap-0.5 rounded-lg px-3 py-2 text-foreground no-underline hover:bg-sky focus-visible:bg-sky"
                  >
                    <span className="font-mono text-[11px] tracking-[0.06em] text-muted uppercase">
                      {t.area.title} · {PAGE_TYPE_LABEL[t.type]}
                    </span>
                    <b className="leading-snug">{t.title}</b>
                    <small className="text-sm text-muted">{t.indexSummary}</small>
                  </RouterLink>
                </li>
              ))}
            </ul>
          </Modal.Body>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
