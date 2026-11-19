import { Navigate, useLocation, useParams } from "react-router";

import { LEGACY_TOPICS } from "../lib/redirects";
import { NotFoundPage } from "./NotFoundPage";

/** /topics/<old slug>#hash → the page's new path, keeping the hash. */
export function LegacyTopicRedirect() {
  const { slug = "" } = useParams();
  const { hash } = useLocation();
  const to = LEGACY_TOPICS[slug];
  return to ? <Navigate to={`${to}${hash}`} replace /> : <NotFoundPage />;
}
