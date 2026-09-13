import Link from "next/link";

export function Logo() {
  return (
    <Link href="/" className="group flex items-center gap-2.5" aria-label="Orchard home">
      <span className="grid h-8 w-8 place-items-center rounded-xl bg-ink text-sm font-bold text-white transition-transform group-hover:-rotate-3">
        O
      </span>
      <span className="text-[17px] font-semibold tracking-[-0.025em]">Orchard</span>
    </Link>
  );
}

