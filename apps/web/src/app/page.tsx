import { InventoryExplorer } from "@/components/inventory-explorer";
import { Suspense } from "react";

export default function Home() {
  return <Suspense><InventoryExplorer /></Suspense>;
}
