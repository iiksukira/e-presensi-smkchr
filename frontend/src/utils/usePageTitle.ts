/** @format */

const BASE_TITLE = "E-Presensi SMKCHR";
export const setPageTitle = (pageName: string) => {
  document.title = `${BASE_TITLE} | ${pageName}`;
};
import { useEffect } from "react";

export const usePageTitle = (pageName: string) => {
  useEffect(() => {
    setPageTitle(pageName);
    return () => {
      document.title = BASE_TITLE;
    };
  }, [pageName]);
};
