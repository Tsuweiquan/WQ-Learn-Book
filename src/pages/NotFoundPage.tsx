import { buttonVariants } from "@heroui/react";
import { Link } from "react-router";

export function NotFoundPage() {
  return (
    <main className="mx-auto grid w-full max-w-[920px] flex-1 content-center justify-items-start gap-4 px-4 py-24">
      <title>Not found · WQ Learn Book</title>
      <p className="font-mono text-xs tracking-[0.12em] text-accent uppercase">404</p>
      <h1 className="text-4xl font-extrabold">No page here</h1>
      <p className="text-muted">That topic doesn't exist, or its file was renamed.</p>
      <Link to="/" className={buttonVariants({ variant: "primary" })}>
        Back to the Learn Book
      </Link>
    </main>
  );
}
