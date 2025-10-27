import { createContext, useContext } from "react";

export const ViewContext = createContext({
  view: { scale: 1, offsetX: 0, offsetY: 0 },
  setView: () => {},
});

export function useView() {
  return useContext(ViewContext);
}
