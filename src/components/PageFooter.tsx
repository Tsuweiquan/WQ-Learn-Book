export function PageFooter({ left, right }: { left: string; right: string }) {
  return (
    <footer className="mx-auto w-full max-w-[920px] px-4">
      <div className="flex flex-wrap justify-between gap-2 border-t border-border pt-6 pb-10 text-sm text-muted">
        <span>{left}</span>
        <span className="font-mono">{right}</span>
      </div>
    </footer>
  );
}
