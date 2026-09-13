import { Headphones, Keyboard, Laptop, Smartphone, Tablet, Watch } from "lucide-react";
import type { Product } from "@/lib/types";

const icons = {
  iPhone: Smartphone,
  Mac: Laptop,
  iPad: Tablet,
  Watch,
  AirPods: Headphones,
  Accessories: Keyboard,
};

export function ProductGlyph({ product, large = false }: { product: Product; large?: boolean }) {
  const Icon = icons[product.category as keyof typeof icons] ?? Smartphone;
  return (
    <div
      className={`relative grid shrink-0 place-items-center overflow-hidden rounded-[1.6rem] bg-gradient-to-br from-white to-black/[.06] ${large ? "h-36 w-36" : "h-16 w-16"}`}
    >
      <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-white/80 blur-xl" />
      <Icon strokeWidth={1.25} className={large ? "h-20 w-20 text-black/75" : "h-9 w-9 text-black/70"} />
    </div>
  );
}

