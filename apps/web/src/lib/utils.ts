import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRelativeTime(value: string, locale: "en" | "zh" = "en"): string {
  const seconds = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 1000));
  if (locale === "zh") {
    if (seconds < 10) return "刚刚";
    if (seconds < 60) return `${seconds} 秒前`;
    return `${Math.floor(seconds / 60)} 分钟前`;
  }
  if (seconds < 10) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  return `${Math.floor(seconds / 60)}m ago`;
}
