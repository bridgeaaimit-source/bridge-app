"use client";

import dynamic from "next/dynamic";

const SupportWidget = dynamic(() => import("./SupportWidget"), {
  ssr: false
});

export default function ClientSupportWidget() {
  return <SupportWidget />;
}
