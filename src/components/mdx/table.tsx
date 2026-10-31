import { createContext, use, type ComponentProps } from "react";

// Markdown tables rendered with HeroUI's table classes. HeroUI's <Table> is a React Aria
// collection and does not accept arbitrary <thead>/<tr> children, so plain elements are used.

const InHead = createContext(false);

export function Table(props: ComponentProps<"table">) {
  return (
    <div className="table-root table-root--primary">
      <div className="table__scroll-container">
        <table
          {...props}
          className="table__content min-w-[620px] text-[15px] [&_td:first-child]:font-semibold [&_td]:align-top"
        />
      </div>
    </div>
  );
}

export function Thead(props: ComponentProps<"thead">) {
  return (
    <InHead value={true}>
      <thead {...props} className="table__header" />
    </InHead>
  );
}

export function Tbody(props: ComponentProps<"tbody">) {
  return <tbody {...props} className="table__body" />;
}

export function Tr(props: ComponentProps<"tr">) {
  return <tr {...props} className={use(InHead) ? undefined : "table__row"} />;
}

export function Th(props: ComponentProps<"th">) {
  return <th {...props} className="table__column font-mono tracking-[0.06em] uppercase" />;
}

export function Td(props: ComponentProps<"td">) {
  return <td {...props} className="table__cell" />;
}
