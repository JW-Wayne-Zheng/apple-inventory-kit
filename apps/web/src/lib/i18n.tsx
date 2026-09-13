"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type Locale = "en" | "zh";

const en = {
  language: "Language",
  english: "English",
  chinese: "中文",
  tracker: "Independent inventory tracker",
  eyebrow: "iPhone 18 Pro availability",
  heroLineOne: "Find your iPhone.",
  heroLineTwo: "Pick it up nearby.",
  heroBody:
    "Compare pickup availability for iPhone 18 Pro and Pro Max at Apple Stores near you.",
  searchProducts: "Search Apple products",
  zipCode: "ZIP code",
  search: "Search",
  findStores: "Find stores",
  checkAvailability: "Check availability",
  checking: "Checking…",
  locationChanged: "ZIP changed — check availability to update the nearby stores.",
  trySearch: "Try “iPhone” near 10001 →",
  invalidProduct: "Enter at least 2 characters",
  invalidZip: "Enter a 5-digit ZIP code",
  fromPrice: "From ${price}",
  nearZip: "Near ${zip}",
  pickupAvailability: "Pickup availability",
  startWatching: "Start watching",
  stopWatching: "Stop watching",
  stockFound: "Apple Store stock found",
  refresh: "Refresh",
  watchingEveryMinute: "Watching · checking every 60 seconds",
  storesAvailableNow: "${count} stores available now",
  nextCheck: "Next check in about ${seconds}s",
  refreshFailed:
    "We couldn’t refresh availability right now. Showing the most recent cached results.",
  availableOnly: "Available only",
  storeCount: "${count} stores",
  filteredStoreCount: "${count} of ${total} stores",
  range: "Range",
  withinMiles: "Within ${miles} mi",
  anyDistance: "Any distance",
  nearestFirst: "Nearest first",
  availabilityFirst: "Availability first",
  listView: "List view",
  mapView: "Map view",
  demoData: "Demonstration data",
  locationAwareDemoData: "Real Apple Store locations · Demo inventory",
  demoInventoryNotice: "Store locations and distances are real. Inventory status is sample data for now.",
  appleData: "Experimental Apple data",
  cachedResult: "Cached result",
  freshResult: "Fresh result",
  footer:
    "Orchard is an independent availability tool. Not affiliated with Apple Inc.",
  loadError: "We couldn’t load that right now.",
  noStores: "No stores match these filters",
  noStoresHelp: "Increase the distance or change the other filters.",
  checked: "Checked ${time}",
  details: "Details",
  orderAtApple: "Continue at Apple",
  pickupAtStore: "Choose ${store} for pickup",
  officialCheckout: "Exact configuration · official guest checkout",
  milesShort: "${distance} mi",
  available: "Available",
  limited: "Limited",
  unavailable: "Unavailable",
  unknown: "Unknown",
  alertButton: "Get stock alerts",
  closeAlert: "Close alert form",
  alertCreated: "Alert created",
  alertCreatedBody:
    "We’ll keep this configuration and location on your watchlist.",
  alertTitle: "Know when it’s back",
  alertBody:
    "Email delivery is ready to plug in; this MVP saves your watchlist.",
  saveAlert: "Save alert",
  invalidEmail: "Enter a valid email address",
  alertFailed: "Alert could not be saved.",
  color: "Color",
  storage: "Storage",
  nearbyStores: "Nearby stores",
  locations: "${count} locations",
  noCoordinates: "No map coordinates available",
  noCoordinatesHelp: "Switch back to list view to see these stores.",
  mapLabel: "Map showing ${count} Apple Stores",
  retailStore: "Apple Retail Store",
  backToResults: "Back to results",
  independentTracker: "Independent tracker",
  hoursUnavailable: "Hours not available",
  milesAway: "miles away",
  directions: "Directions",
  currentPickupStatus: "Current pickup status",
  lastChecked: "Last checked ${time}",
} as const;

type MessageKey = keyof typeof en;

const zh: Record<MessageKey, string> = {
  language: "语言",
  english: "English",
  chinese: "中文",
  tracker: "独立库存查询工具",
  eyebrow: "iPhone 18 Pro 库存",
  heroLineOne: "找到想要的 iPhone，",
  heroLineTwo: "就近到店取货。",
  heroBody: "比较附近 Apple Store 的 iPhone 18 Pro 和 Pro Max 到店取货库存。",
  searchProducts: "搜索 Apple 产品",
  zipCode: "邮政编码",
  search: "搜索",
  findStores: "查找门店",
  checkAvailability: "查询库存",
  checking: "查询中…",
  locationChanged: "邮政编码已更改，请查询库存以更新附近门店。",
  trySearch: "试试在 10001 附近搜索“iPhone” →",
  invalidProduct: "请至少输入 2 个字符",
  invalidZip: "请输入 5 位美国邮政编码",
  fromPrice: "${price} 起",
  nearZip: "${zip} 附近",
  pickupAvailability: "到店取货库存",
  startWatching: "开始蹲库存",
  stopWatching: "停止蹲库存",
  stockFound: "发现 Apple Store 库存",
  refresh: "刷新",
  watchingEveryMinute: "正在监控 · 每 60 秒检查一次",
  storesAvailableNow: "目前有 ${count} 家门店可取",
  nextCheck: "下次检查约 ${seconds} 秒后",
  refreshFailed: "暂时无法刷新库存，正在显示最近一次缓存结果。",
  availableOnly: "仅看有货",
  storeCount: "${count} 家门店",
  filteredStoreCount: "显示 ${count} / ${total} 家门店",
  range: "距离范围",
  withinMiles: "${miles} 英里内",
  anyDistance: "不限距离",
  nearestFirst: "距离优先",
  availabilityFirst: "库存优先",
  listView: "列表视图",
  mapView: "地图视图",
  demoData: "演示数据",
  locationAwareDemoData: "真实 Apple Store 位置 · 演示库存",
  demoInventoryNotice: "门店位置和距离是真实的；当前库存状态仍为演示数据。",
  appleData: "实验性 Apple 数据",
  cachedResult: "缓存结果",
  freshResult: "最新结果",
  footer: "Orchard 是独立库存查询工具，与 Apple Inc. 无关联。",
  loadError: "暂时无法加载。",
  noStores: "没有符合筛选条件的门店",
  noStoresHelp: "请扩大距离范围或调整其他筛选条件。",
  checked: "${time}检查",
  details: "详情",
  orderAtApple: "前往 Apple 下单",
  pickupAtStore: "在 Apple 页面选择 ${store} 取货",
  officialCheckout: "精确配置 · Apple 官方游客结账",
  milesShort: "${distance} 英里",
  available: "有货",
  limited: "库存紧张",
  unavailable: "无货",
  unknown: "未知",
  alertButton: "获取库存提醒",
  closeAlert: "关闭库存提醒表单",
  alertCreated: "提醒已创建",
  alertCreatedBody: "我们已将此配置和位置保存到你的关注列表。",
  alertTitle: "到货时通知我",
  alertBody: "当前版本会保存关注列表，之后可接入邮件发送服务。",
  saveAlert: "保存提醒",
  invalidEmail: "请输入有效的邮箱地址",
  alertFailed: "无法保存提醒。",
  color: "颜色",
  storage: "存储容量",
  nearbyStores: "附近门店",
  locations: "${count} 个地点",
  noCoordinates: "暂无地图坐标",
  noCoordinatesHelp: "请切换回列表视图查看这些门店。",
  mapLabel: "显示 ${count} 家 Apple Store 的地图",
  retailStore: "Apple 零售店",
  backToResults: "返回查询结果",
  independentTracker: "独立查询工具",
  hoursUnavailable: "暂无营业时间",
  milesAway: "英里",
  directions: "导航",
  currentPickupStatus: "当前取货状态",
  lastChecked: "上次检查：${time}",
};

type Variables = Record<string, string | number>;

function translate(locale: Locale, key: MessageKey, variables?: Variables) {
  let message: string = locale === "zh" ? zh[key] : en[key];
  if (!variables) return message;
  for (const [name, value] of Object.entries(variables)) {
    message = message.replaceAll(`\${${name}}`, String(value));
  }
  return message;
}

const noopSetLocale: (locale: Locale) => void = () => undefined;

const I18nContext = createContext({
  locale: "en" as Locale,
  setLocale: noopSetLocale,
  t: (key: MessageKey, variables?: Variables) =>
    translate("en", key, variables),
});

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    const saved = window.localStorage.getItem("orchard-locale");
    const initial =
      saved === "en" || saved === "zh"
        ? saved
        : navigator.language.toLowerCase().startsWith("zh")
          ? "zh"
          : "en";
    const timer = window.setTimeout(() => setLocaleState(initial), 0);
    return () => window.clearTimeout(timer);
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    window.localStorage.setItem("orchard-locale", next);
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale === "zh" ? "zh-CN" : "en";
  }, [locale]);

  const t = useCallback(
    (key: MessageKey, variables?: Variables) =>
      translate(locale, key, variables),
    [locale],
  );
  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}

export function localizePickupMessage(message: string, locale: Locale) {
  if (locale === "en") return message;
  const translations: Record<string, string> = {
    "Available today": "今日可取货",
    "Limited availability — order soon": "库存紧张，请尽快下单",
    "Currently unavailable for pickup": "目前无法到店取货",
    "Pickup status could not be confirmed": "暂时无法确认取货状态",
  };
  return translations[message] ?? message;
}

export function localizeProductDescription(
  productId: string,
  description: string | null,
  locale: Locale,
) {
  if (locale === "en") return description;
  const translations: Record<string, string> = {
    "iphone-18-pro": "A20 Pro 芯片、可变光圈 4800 万像素融合式摄像头，以及专业级性能。",
    "iphone-18-pro-max": "6.9 英寸显示屏，以及 iPhone 迄今最长的电池续航。",
  };
  return translations[productId] ?? description;
}

export function localizeAttributeValue(value: string, locale: Locale) {
  if (locale === "en") return value;
  const translations: Record<string, string> = {
    Black: "黑色",
    Silver: "银色",
    Glacier: "冰川色",
    Burgundy: "勃艮第红",
  };
  return translations[value] ?? value;
}
