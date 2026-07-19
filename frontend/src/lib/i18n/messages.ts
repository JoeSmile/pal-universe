import type { Locale } from "@/lib/i18n/locale";

export type MessageKey =
  | "nav.home"
  | "home.tagline"
  | "home.searchLabel"
  | "home.searchPlaceholder"
  | "home.searching"
  | "home.clearSearch"
  | "home.noResults"
  | "home.chatHint"
  | "home.askAi"
  | "home.didYouMean"
  | "home.chatTitle"
  | "home.features"
  | "home.hotPals"
  | "link.breeding"
  | "link.breedingDesc"
  | "link.types"
  | "link.typesDesc"
  | "link.map"
  | "link.mapDesc"
  | "link.pals"
  | "link.palsDesc"
  | "link.tier"
  | "link.tierDesc"
  | "link.items"
  | "link.itemsDesc"
  | "placeholder.comingSoon"
  | "placeholder.backHome"
  | "lang.en"
  | "lang.zh"
  | "lang.switch"
  | "rarity.label"
  | "stats.title"
  | "element.Fire"
  | "element.Water"
  | "element.Grass"
  | "element.Electric"
  | "element.Ice"
  | "element.Ground"
  | "element.Dark"
  | "element.Dragon"
  | "element.Neutral";

const en: Record<MessageKey, string> = {
  "nav.home": "Home",
  "home.tagline": "Smart search · AI guides · Pal encyclopedia",
  "home.searchLabel": "Search pals or ask AI",
  "home.searchPlaceholder": "Search pals, or ask a guide question…",
  "home.searching": "Searching",
  "home.clearSearch": "Clear search",
  "home.noResults": "No matching pals found",
  "home.chatHint": "Guide question detected — press Enter to ask AI",
  "home.askAi": "Press Enter to ask AI more",
  "home.didYouMean": "Did you mean:",
  "home.chatTitle": "AI Assistant (mock)",
  "home.features": "Features",
  "home.hotPals": "Popular Pals",
  "link.breeding": "Breeding Calculator",
  "link.breedingDesc": "Parents and offspring",
  "link.types": "Type Chart",
  "link.typesDesc": "Element matchups",
  "link.map": "Map",
  "link.mapDesc": "Spawns and regions",
  "link.pals": "Pal List",
  "link.palsDesc": "Browse all pals",
  "link.tier": "Tier Lists",
  "link.tierDesc": "Combat and work ranks",
  "link.items": "Items",
  "link.itemsDesc": "Drops and materials",
  "placeholder.comingSoon": "This page is under construction.",
  "placeholder.backHome": "Back to home",
  "lang.en": "EN",
  "lang.zh": "中文",
  "lang.switch": "Language",
  "rarity.label": "Rarity {n}",
  "stats.title": "Base stats",
  "element.Fire": "Fire",
  "element.Water": "Water",
  "element.Grass": "Grass",
  "element.Electric": "Electric",
  "element.Ice": "Ice",
  "element.Ground": "Ground",
  "element.Dark": "Dark",
  "element.Dragon": "Dragon",
  "element.Neutral": "Neutral",
};

const zh: Record<MessageKey, string> = {
  "nav.home": "首页",
  "home.tagline": "智能搜索 · AI 攻略 · 帕鲁百科",
  "home.searchLabel": "搜索帕鲁或提问 AI",
  "home.searchPlaceholder": "搜索帕鲁，或输入攻略问题…",
  "home.searching": "搜索中",
  "home.clearSearch": "清除搜索",
  "home.noResults": "未找到匹配的帕鲁",
  "home.chatHint": "检测到攻略问题 — 按 Enter 问 AI",
  "home.askAi": "按 Enter 问 AI 更多",
  "home.didYouMean": "您是不是要找:",
  "home.chatTitle": "AI 助手（mock）",
  "home.features": "功能入口",
  "home.hotPals": "热门帕鲁",
  "link.breeding": "繁殖计算器",
  "link.breedingDesc": "查父母组合与后代",
  "link.types": "属性克制",
  "link.typesDesc": "元素相克速查",
  "link.map": "地图",
  "link.mapDesc": "刷新点与区域",
  "link.pals": "帕鲁列表",
  "link.palsDesc": "浏览全部帕鲁",
  "link.tier": "Tier 排行",
  "link.tierDesc": "强度与劳作榜",
  "link.items": "物品图鉴",
  "link.itemsDesc": "掉落与材料",
  "placeholder.comingSoon": "页面建设中，敬请期待。",
  "placeholder.backHome": "返回首页",
  "lang.en": "EN",
  "lang.zh": "中文",
  "lang.switch": "语言",
  "rarity.label": "稀有度 {n}",
  "stats.title": "基础属性",
  "element.Fire": "火",
  "element.Water": "水",
  "element.Grass": "草",
  "element.Electric": "电",
  "element.Ice": "冰",
  "element.Ground": "地",
  "element.Dark": "暗",
  "element.Dragon": "龙",
  "element.Neutral": "无",
};

const catalogs: Record<Locale, Record<MessageKey, string>> = { en, zh };

export function t(
  locale: Locale,
  key: MessageKey,
  vars?: Record<string, string | number>,
): string {
  let text = catalogs[locale][key] ?? catalogs.en[key] ?? key;
  if (vars) {
    for (const [name, value] of Object.entries(vars)) {
      text = text.replaceAll(`{${name}}`, String(value));
    }
  }
  return text;
}
