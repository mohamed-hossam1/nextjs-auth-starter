"use client";

import {
  parseProfileDialogTab,
  type ProfileDialogTab,
} from "@/lib/profile-dialog";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";

const QUERY_PARAM = "open";


export function useProfileDialogUrlState() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const openParam = searchParams.get(QUERY_PARAM);
  const parsedTab = parseProfileDialogTab(openParam);

  const isOpen = parsedTab !== null;
  const activeTab: ProfileDialogTab = parsedTab ?? "profile";

  const buildHref = useCallback(
    (mutate: (params: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParams.toString());
      mutate(params);
      const queryString = params.toString();
      return queryString ? `${pathname}?${queryString}` : pathname;
    },
    [pathname, searchParams],
  );

  const openTab = useCallback(
    (tab: ProfileDialogTab) => {
      const href = buildHref((params) => {
        params.set(QUERY_PARAM, tab);
      });
      router.replace(href, { scroll: false });
    },
    [buildHref, router],
  );

  const closeDialog = useCallback(() => {
    const href = buildHref((params) => {
      params.delete(QUERY_PARAM);
    });
    router.replace(href, { scroll: false });
  }, [buildHref, router]);

  return useMemo(
    () => ({ isOpen, activeTab, openTab, closeDialog }),
    [isOpen, activeTab, openTab, closeDialog],
  );
}
