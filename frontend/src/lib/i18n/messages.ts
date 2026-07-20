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
  | "element.Neutral"
  | "list.title"
  | "list.searchLabel"
  | "list.searchPlaceholder"
  | "list.elements"
  | "list.works"
  | "list.resultCount"
  | "list.empty"
  | "list.clearFilters"
  | "list.loadingMore"
  | "list.scrollForMore"
  | "list.loadMore"
  | "list.endOfList"
  | "list.apiFallback"
  | "work.kindling"
  | "work.watering"
  | "work.electricity"
  | "work.mining"
  | "work.lumbering"
  | "work.cooling"
  | "work.medicine"
  | "work.transport"
  | "work.farming"
  | "work.planting"
  | "work.gathering"
  | "work.base_worker"
  | "work.fishing"
  | "work.fighter"
  | "work.mount"
  | "work.flyer"
  | "work.swimmer"
  | "work.level"
  | "detail.backToList"
  | "detail.notFound"
  | "detail.size"
  | "detail.price"
  | "detail.nocturnal"
  | "detail.diurnal"
  | "detail.movement"
  | "detail.walk"
  | "detail.run"
  | "detail.sprint"
  | "detail.partnerSkill"
  | "detail.activeSkills"
  | "detail.skillName"
  | "detail.skillElement"
  | "detail.skillPower"
  | "detail.skillCooldown"
  | "detail.skillEffect"
  | "detail.showAllSkills"
  | "detail.hideSkills"
  | "detail.noSkills"
  | "detail.work"
  | "detail.breeding"
  | "detail.breedingRank"
  | "detail.breedingRare"
  | "detail.breedingCommon"
  | "detail.breedingMid"
  | "detail.viewBreeding"
  | "detail.drops"
  | "detail.dropName"
  | "detail.dropChance"
  | "detail.dropUse"
  | "detail.dropUnknown"
  | "detail.locations"
  | "detail.region"
  | "detail.levelRange"
  | "detail.spawnCount"
  | "detail.coordinates"
  | "detail.noLocations"
  | "detail.aiTitle"
  | "detail.aiPlaceholder"
  | "detail.aiSend"
  | "detail.loading"
  | "detail.stat.hp"
  | "detail.stat.melee"
  | "detail.stat.shot"
  | "detail.stat.defense"
  | "detail.stat.support"
  | "detail.stat.stamina"
  | "chat.title"
  | "chat.empty";

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
  "list.title": "Pal List",
  "list.searchLabel": "Search pals",
  "list.searchPlaceholder": "Search by name…",
  "list.elements": "Elements",
  "list.works": "Work suitability",
  "list.resultCount": "{n} pals",
  "list.empty": "No matching pals found",
  "list.clearFilters": "Clear filters",
  "list.loadingMore": "Loading more…",
  "list.scrollForMore": "Scroll for more",
  "list.loadMore": "Load more",
  "list.endOfList": "Showing all {n} pals",
  "list.apiFallback": "API unavailable — showing local catalog",
  "work.kindling": "Kindling",
  "work.watering": "Watering",
  "work.electricity": "Electricity",
  "work.mining": "Mining",
  "work.lumbering": "Lumbering",
  "work.cooling": "Cooling",
  "work.medicine": "Medicine",
  "work.transport": "Transport",
  "work.farming": "Farming",
  "work.planting": "Planting",
  "work.gathering": "Gathering",
  "work.base_worker": "Handiwork",
  "work.fishing": "Fishing",
  "work.fighter": "Combat Specialist",
  "work.mount": "Mount",
  "work.flyer": "Flying",
  "work.swimmer": "Swimming",
  "work.level": "Level {n}",
  "detail.backToList": "Back to list",
  "detail.notFound": "Pal not found",
  "detail.size": "Size",
  "detail.price": "Price",
  "detail.nocturnal": "Nocturnal",
  "detail.diurnal": "Diurnal",
  "detail.movement": "Movement",
  "detail.walk": "Walk",
  "detail.run": "Run",
  "detail.sprint": "Sprint",
  "detail.partnerSkill": "Partner skill",
  "detail.activeSkills": "Active skills",
  "detail.skillName": "Name",
  "detail.skillElement": "Element",
  "detail.skillPower": "Power",
  "detail.skillCooldown": "CD",
  "detail.skillEffect": "Effect",
  "detail.showAllSkills": "Show all {n} skills",
  "detail.hideSkills": "Show less",
  "detail.noSkills": "No active skill data yet",
  "detail.work": "Work suitability",
  "detail.breeding": "Breeding",
  "detail.breedingRank": "Breeding rank",
  "detail.breedingRare": "Rare",
  "detail.breedingCommon": "Common",
  "detail.breedingMid": "Standard",
  "detail.viewBreeding": "View breeding routes",
  "detail.drops": "Drops",
  "detail.dropName": "Item",
  "detail.dropChance": "Chance",
  "detail.dropUse": "Use",
  "detail.dropUnknown": "—",
  "detail.locations": "Locations",
  "detail.region": "Region",
  "detail.levelRange": "Level",
  "detail.spawnCount": "Spawn points",
  "detail.coordinates": "Center",
  "detail.noLocations": "No spawn data",
  "detail.aiTitle": "Ask AI about this pal",
  "detail.aiPlaceholder": "Ask a guide question…",
  "detail.aiSend": "Ask",
  "detail.loading": "Loading pal…",
  "detail.stat.hp": "HP",
  "detail.stat.melee": "Melee",
  "detail.stat.shot": "Ranged",
  "detail.stat.defense": "Defense",
  "detail.stat.support": "Support",
  "detail.stat.stamina": "Stamina",
  "chat.title": "AI Chat",
  "chat.empty": "Ask anything about Palworld guides.",
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
  "list.title": "帕鲁列表",
  "list.searchLabel": "搜索帕鲁",
  "list.searchPlaceholder": "按名称搜索…",
  "list.elements": "元素属性",
  "list.works": "工作适性",
  "list.resultCount": "{n} 只帕鲁",
  "list.empty": "没有找到匹配的帕鲁",
  "list.clearFilters": "清除筛选",
  "list.loadingMore": "加载更多…",
  "list.scrollForMore": "继续下滑加载更多",
  "list.loadMore": "加载更多",
  "list.endOfList": "已显示全部 {n} 只帕鲁",
  "list.apiFallback": "后端暂不可用 — 已切换本地图鉴数据",
  "work.kindling": "引火",
  "work.watering": "浇水",
  "work.electricity": "发电",
  "work.mining": "挖矿",
  "work.lumbering": "伐木",
  "work.cooling": "冷却",
  "work.medicine": "制药",
  "work.transport": "运输",
  "work.farming": "耕作",
  "work.planting": "种植",
  "work.gathering": "采集",
  "work.base_worker": "手工",
  "work.fishing": "钓鱼",
  "work.fighter": "战斗特化",
  "work.mount": "骑乘",
  "work.flyer": "飞行",
  "work.swimmer": "游泳",
  "work.level": "等级 {n}",
  "detail.backToList": "返回列表",
  "detail.notFound": "未找到该帕鲁",
  "detail.size": "体形",
  "detail.price": "售价",
  "detail.nocturnal": "夜间活动",
  "detail.diurnal": "昼行",
  "detail.movement": "移动速度",
  "detail.walk": "步行",
  "detail.run": "奔跑",
  "detail.sprint": "冲刺",
  "detail.partnerSkill": "伙伴技能",
  "detail.activeSkills": "主动技能",
  "detail.skillName": "名称",
  "detail.skillElement": "属性",
  "detail.skillPower": "威力",
  "detail.skillCooldown": "冷却",
  "detail.skillEffect": "效果",
  "detail.showAllSkills": "查看全部 {n} 个",
  "detail.hideSkills": "收起",
  "detail.noSkills": "暂无主动技能数据",
  "detail.work": "工作适性",
  "detail.breeding": "繁殖",
  "detail.breedingRank": "繁殖排名",
  "detail.breedingRare": "稀有",
  "detail.breedingCommon": "常见",
  "detail.breedingMid": "普通",
  "detail.viewBreeding": "查看繁殖路线",
  "detail.drops": "掉落物",
  "detail.dropName": "物品",
  "detail.dropChance": "概率",
  "detail.dropUse": "用途",
  "detail.dropUnknown": "—",
  "detail.locations": "刷新位置",
  "detail.region": "区域",
  "detail.levelRange": "等级",
  "detail.spawnCount": "刷新点数",
  "detail.coordinates": "中心坐标",
  "detail.noLocations": "暂无位置数据",
  "detail.aiTitle": "向 AI 提问这只帕鲁",
  "detail.aiPlaceholder": "输入攻略问题…",
  "detail.aiSend": "提问",
  "detail.loading": "加载帕鲁中…",
  "detail.stat.hp": "HP",
  "detail.stat.melee": "近战",
  "detail.stat.shot": "远程",
  "detail.stat.defense": "防御",
  "detail.stat.support": "支援",
  "detail.stat.stamina": "耐力",
  "chat.title": "AI 对话",
  "chat.empty": "可以问任何帕鲁攻略问题。",
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
