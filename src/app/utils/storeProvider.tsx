"use client";

import { Provider } from "react-redux";
import { ReactNode, useRef } from "react";

import { AppStore, store } from "@/app/store/store";

const StoreProvider = ({ children }: { children: ReactNode }) => {
  const storeRef = useRef<AppStore>();
  if (!storeRef.current) {
    storeRef.current = store();
  }
  return <Provider store={storeRef.current}>{children}</Provider>;
};

export default StoreProvider;
