import { RouterProvider } from "@heroui/react";
import { useEffect } from "react";
import { Route, Routes, useHref, useLocation, useNavigate } from "react-router";

import { SiteHeader } from "./components/SiteHeader";
import { ThemeProvider } from "./lib/theme";
import { HomePage } from "./pages/HomePage";
import { LegacyTopicRedirect } from "./pages/LegacyRedirect";
import { NotFoundPage } from "./pages/NotFoundPage";
import { PracticalPage } from "./pages/PracticalPage";
import { TagPage, TagsPage } from "./pages/TagsPage";
import { TopicPage } from "./pages/TopicPage";

const USER_SCROLL_EVENTS = ["wheel", "touchstart", "keydown", "mousedown"] as const;

// Scroll to the #hash target on in-page links, or to the top on a new page.
function ScrollManager() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (!hash) {
      window.scrollTo({ top: 0, behavior: "instant" });
      return;
    }
    const target = () => document.getElementById(decodeURIComponent(hash.slice(1)));
    target()?.scrollIntoView();

    // Mermaid diagrams render after load and push the target down. Keep it in place
    // until the page settles or the reader scrolls. The first callback is the initial
    // measurement, not a resize.
    let first = true;
    const observer = new ResizeObserver(() => {
      if (first) first = false;
      else target()?.scrollIntoView({ behavior: "instant" });
    });
    observer.observe(document.body);
    const stop = () => observer.disconnect();
    const timer = setTimeout(stop, 3000);
    USER_SCROLL_EVENTS.forEach((e) => window.addEventListener(e, stop, { once: true, passive: true }));
    return () => {
      stop();
      clearTimeout(timer);
      USER_SCROLL_EVENTS.forEach((e) => window.removeEventListener(e, stop));
    };
  }, [pathname, hash]);
  return null;
}

// React Router treats every href as a path, which would turn https://… into /base/page/https:/….
function useAppHref(href: string) {
  const routed = useHref(href);
  return /^[a-z][a-z\d+.-]*:/i.test(href) ? href : routed;
}

export function App() {
  const navigate = useNavigate();
  return (
    // Lets HeroUI links (href="/topics/…", href="#section") navigate through React Router.
    <RouterProvider navigate={(to) => navigate(to)} useHref={useAppHref}>
      <ThemeProvider>
        <ScrollManager />
        <div className="flex min-h-dvh flex-col">
          <SiteHeader />
          <Routes>
            <Route path="/" element={<HomePage />} />
            {/* Static segments outrank the :area routes, so area folders can't shadow these. */}
            <Route path="/topics/:slug" element={<LegacyTopicRedirect />} />
            <Route path="/practical/*" element={<PracticalPage />} />
            {/* React Router scores /practical/* (10) below /:area/:slug/:child (12), so a file one
                folder deep (/practical/argocd/root.yaml) would open as a topic and 404. This route scores 19. */}
            <Route path="/practical/:folder/:file" element={<PracticalPage />} />
            <Route path="/tags" element={<TagsPage />} />
            <Route path="/tags/:tag" element={<TagPage />} />
            <Route path="/:area/:slug" element={<TopicPage />} />
            <Route path="/:area/:slug/:child" element={<TopicPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </div>
      </ThemeProvider>
    </RouterProvider>
  );
}
