import type { Locale } from "@/lib/i18n/locale";

export type MessageKey =
  | "auth.anonTip"
  | "auth.chatFailed"
  | "auth.confirmPassword"
  | "auth.email"
  | "auth.error.badCredentials"
  | "auth.error.emailExists"
  | "auth.error.emailInvalid"
  | "auth.error.generic"
  | "auth.error.passwordMismatch"
  | "auth.error.passwordTooShort"
  | "auth.goLogin"
  | "auth.goRegister"
  | "auth.login"
  | "auth.loginSubmit"
  | "auth.loginTitle"
  | "auth.logout"
  | "auth.password"
  | "auth.passwordHint"
  | "auth.register"
  | "auth.registerLink"
  | "auth.registerSubmit"
  | "auth.registerTitle"
  | "auth.sessionExpired"
  | "auth.submitting"
  | "auth.usageExhausted"
  | "auth.usageRemaining"
  | "auth.user"
  | "auth.username"
  | "chat.empty"
  | "chat.title"
  | "password.needDigit"
  | "password.needLower"
  | "password.needSpecial"
  | "password.needUpper"
  | "password.tooShort"
  | "detail.activeSkills"
  | "detail.aiPlaceholder"
  | "detail.aiSend"
  | "detail.aiTitle"
  | "detail.backToList"
  | "detail.breeding"
  | "detail.breedingCommon"
  | "detail.breedingMid"
  | "detail.breedingRank"
  | "detail.breedingRare"
  | "detail.coordinates"
  | "detail.diurnal"
  | "detail.dropChance"
  | "detail.dropName"
  | "detail.dropUnknown"
  | "detail.dropUse"
  | "detail.drops"
  | "detail.hideSkills"
  | "detail.levelRange"
  | "detail.loading"
  | "detail.locations"
  | "detail.movement"
  | "detail.noLocations"
  | "detail.noSkills"
  | "detail.nocturnal"
  | "detail.notFound"
  | "detail.partnerSkill"
  | "detail.price"
  | "detail.region"
  | "detail.run"
  | "detail.showAllSkills"
  | "detail.size"
  | "detail.skillCooldown"
  | "detail.skillEffect"
  | "detail.skillElement"
  | "detail.skillName"
  | "detail.skillPower"
  | "detail.spawnCount"
  | "detail.sprint"
  | "detail.stat.defense"
  | "detail.stat.hp"
  | "detail.stat.melee"
  | "detail.stat.shot"
  | "detail.stat.stamina"
  | "detail.stat.support"
  | "detail.viewBreeding"
  | "detail.walk"
  | "detail.work"
  | "element.Dark"
  | "element.Dragon"
  | "element.Electric"
  | "element.Fire"
  | "element.Grass"
  | "element.Ground"
  | "element.Ice"
  | "element.Neutral"
  | "element.Water"
  | "footer.contact"
  | "footer.contactTitle"
  | "footer.disclaimer"
  | "footer.disclaimerTitle"
  | "footer.github"
  | "footer.learning"
  | "home.askAi"
  | "home.chatClose"
  | "home.chatHint"
  | "home.chatTitle"
  | "home.clearSearch"
  | "home.didYouMean"
  | "home.features"
  | "home.hotPals"
  | "home.noResults"
  | "home.searchLabel"
  | "home.searchPlaceholder"
  | "home.searching"
  | "home.tagline"
  | "lang.en"
  | "lang.switch"
  | "lang.zh"
  | "link.breeding"
  | "link.breedingDesc"
  | "link.items"
  | "link.itemsDesc"
  | "link.map"
  | "link.mapDesc"
  | "link.pals"
  | "link.palsDesc"
  | "link.tier"
  | "link.tierDesc"
  | "link.types"
  | "link.typesDesc"
  | "list.apiFallback"
  | "list.clearFilters"
  | "list.elements"
  | "list.empty"
  | "list.endOfList"
  | "list.loadMore"
  | "list.loadingMore"
  | "list.resultCount"
  | "list.scrollForMore"
  | "list.searchLabel"
  | "list.searchPlaceholder"
  | "list.title"
  | "list.works"
  | "nav.home"
  | "placeholder.backHome"
  | "placeholder.comingSoon"
  | "rarity.label"
  | "stats.title"
  | "work.base_worker"
  | "work.cooling"
  | "work.electricity"
  | "work.farming"
  | "work.fighter"
  | "work.fishing"
  | "work.flyer"
  | "work.gathering"
  | "work.kindling"
  | "work.level"
  | "work.lumbering"
  | "work.medicine"
  | "work.mining"
  | "work.mount"
  | "work.planting"
  | "work.swimmer"
  | "work.transport"
  | "work.watering";

const en: Record<MessageKey, string> = {
  "auth.anonTip": "Register for a higher daily chat quota.",
  "auth.chatFailed": "Failed to generate an answer. Please try again.",
  "auth.confirmPassword": "Confirm password",
  "auth.email": "Email",
  "auth.error.badCredentials": "Incorrect email or password.",
  "auth.error.emailExists": "This email is already registered.",
  "auth.error.emailInvalid": "Please enter a valid email address.",
  "auth.error.generic": "Something went wrong. Please try again.",
  "auth.error.passwordMismatch": "Passwords do not match.",
  "auth.error.passwordTooShort": "Password must be at least 6 characters.",
  "auth.goLogin": "← Log in",
  "auth.goRegister": "Register →",
  "auth.login": "Log in",
  "auth.loginSubmit": "Log in",
  "auth.loginTitle": "Log in",
  "auth.logout": "Log out",
  "auth.password": "Password",
  "auth.passwordHint":
    "At least 8 characters with upper, lower, digit, and special character.",
  "auth.register": "Register",
  "auth.registerLink": "Register",
  "auth.registerSubmit": "Create account",
  "auth.registerTitle": "Create account",
  "auth.sessionExpired": "Session expired — please log in again.",
  "auth.submitting": "Please wait…",
  "auth.usageExhausted": "Daily chat quota reached. Try again tomorrow or register for more.",
  "auth.usageRemaining": "Today remaining: {remaining}/{limit}",
  "auth.user": "User",
  "auth.username": "Username (optional)",
  "chat.empty": "Ask anything about Palworld guides.",
  "chat.title": "AI Chat",
  "password.needDigit": "Password must include a number.",
  "password.needLower": "Password must include a lowercase letter.",
  "password.needSpecial": "Password must include a special character.",
  "password.needUpper": "Password must include an uppercase letter.",
  "password.tooShort": "Password must be at least 8 characters.",
  "detail.activeSkills": "Active skills",
  "detail.aiPlaceholder": "Ask a guide question…",
  "detail.aiSend": "Ask",
  "detail.aiTitle": "Ask AI about this pal",
  "detail.backToList": "Back to list",
  "detail.breeding": "Breeding",
  "detail.breedingCommon": "Common",
  "detail.breedingMid": "Standard",
  "detail.breedingRank": "Breeding rank",
  "detail.breedingRare": "Rare",
  "detail.coordinates": "Center",
  "detail.diurnal": "Diurnal",
  "detail.dropChance": "Chance",
  "detail.dropName": "Item",
  "detail.dropUnknown": "—",
  "detail.dropUse": "Use",
  "detail.drops": "Drops",
  "detail.hideSkills": "Show less",
  "detail.levelRange": "Level",
  "detail.loading": "Loading pal…",
  "detail.locations": "Locations",
  "detail.movement": "Movement",
  "detail.noLocations": "No spawn data",
  "detail.noSkills": "No active skill data yet",
  "detail.nocturnal": "Nocturnal",
  "detail.notFound": "Pal not found",
  "detail.partnerSkill": "Partner skill",
  "detail.price": "Price",
  "detail.region": "Region",
  "detail.run": "Run",
  "detail.showAllSkills": "Show all {n} skills",
  "detail.size": "Size",
  "detail.skillCooldown": "CD",
  "detail.skillEffect": "Effect",
  "detail.skillElement": "Element",
  "detail.skillName": "Name",
  "detail.skillPower": "Power",
  "detail.spawnCount": "Spawn points",
  "detail.sprint": "Sprint",
  "detail.stat.defense": "Defense",
  "detail.stat.hp": "HP",
  "detail.stat.melee": "Melee",
  "detail.stat.shot": "Ranged",
  "detail.stat.stamina": "Stamina",
  "detail.stat.support": "Support",
  "detail.viewBreeding": "View breeding routes",
  "detail.walk": "Walk",
  "detail.work": "Work suitability",
  "element.Dark": "Dark",
  "element.Dragon": "Dragon",
  "element.Electric": "Electric",
  "element.Fire": "Fire",
  "element.Grass": "Grass",
  "element.Ground": "Ground",
  "element.Ice": "Ice",
  "element.Neutral": "Neutral",
  "element.Water": "Water",
  "footer.contact": "Issues, ideas, and PRs welcome on",
  "footer.contactTitle": "Contact",
  "footer.disclaimer": "Pal Universe is an unofficial fan project for learning software engineering. It is not affiliated with Pocketpair. Palworld and related assets belong to their respective owners. Game data may be incomplete or outdated.",
  "footer.disclaimerTitle": "Disclaimer",
  "footer.github": "GitHub",
  "footer.learning": "Built as a hands-on project to practice full-stack development (Next.js, FastAPI, LangGraph, and more).",
  "home.askAi": "Press Enter to ask AI more",
  "home.chatClose": "Close",
  "home.chatHint": "Guide question detected — press Enter to ask AI",
  "home.chatTitle": "AI Assistant",
  "home.clearSearch": "Clear search",
  "home.didYouMean": "Did you mean:",
  "home.features": "Features",
  "home.hotPals": "Popular Pals",
  "home.noResults": "No matching pals found",
  "home.searchLabel": "Search pals or ask AI",
  "home.searchPlaceholder": "Search pals, or ask a guide question…",
  "home.searching": "Searching",
  "home.tagline": "Smart search · AI guides · Pal encyclopedia",
  "lang.en": "EN",
  "lang.switch": "Language",
  "lang.zh": "中文",
  "link.breeding": "Breeding Calculator",
  "link.breedingDesc": "Parents and offspring",
  "link.items": "Items",
  "link.itemsDesc": "Drops and materials",
  "link.map": "Map",
  "link.mapDesc": "Spawns and regions",
  "link.pals": "Pal List",
  "link.palsDesc": "Browse all pals",
  "link.tier": "Tier Lists",
  "link.tierDesc": "Combat and work ranks",
  "link.types": "Type Chart",
  "link.typesDesc": "Element matchups",
  "list.apiFallback": "API unavailable — showing local catalog",
  "list.clearFilters": "Clear filters",
  "list.elements": "Elements",
  "list.empty": "No matching pals found",
  "list.endOfList": "Showing all {n} pals",
  "list.loadMore": "Load more",
  "list.loadingMore": "Loading more…",
  "list.resultCount": "{n} pals",
  "list.scrollForMore": "Scroll for more",
  "list.searchLabel": "Search pals",
  "list.searchPlaceholder": "Search by name…",
  "list.title": "Pal List",
  "list.works": "Work suitability",
  "nav.home": "Home",
  "placeholder.backHome": "Back to home",
  "placeholder.comingSoon": "This page is under construction.",
  "rarity.label": "Rarity {n}",
  "stats.title": "Base stats",
  "work.base_worker": "Handiwork",
  "work.cooling": "Cooling",
  "work.electricity": "Electricity",
  "work.farming": "Farming",
  "work.fighter": "Combat Specialist",
  "work.fishing": "Fishing",
  "work.flyer": "Flying",
  "work.gathering": "Gathering",
  "work.kindling": "Kindling",
  "work.level": "Level {n}",
  "work.lumbering": "Lumbering",
  "work.medicine": "Medicine",
  "work.mining": "Mining",
  "work.mount": "Mount",
  "work.planting": "Planting",
  "work.swimmer": "Swimming",
  "work.transport": "Transport",
  "work.watering": "Watering",
};

const zh: Record<MessageKey, string> = {
  "auth.anonTip": "注册后可获得更多每日对话额度。",
  "auth.chatFailed": "回答生成失败，请再试一次。",
  "auth.confirmPassword": "确认密码",
  "auth.email": "邮箱",
  "auth.error.badCredentials": "邮箱或密码错误。",
  "auth.error.emailExists": "该邮箱已注册。",
  "auth.error.emailInvalid": "请输入有效的邮箱地址。",
  "auth.error.generic": "出错了，请稍后再试。",
  "auth.error.passwordMismatch": "两次输入的密码不一致。",
  "auth.error.passwordTooShort": "密码至少 6 位。",
  "auth.goLogin": "← 去登录",
  "auth.goRegister": "去注册 →",
  "auth.login": "登录",
  "auth.loginSubmit": "登录",
  "auth.loginTitle": "登录",
  "auth.logout": "退出",
  "auth.password": "密码",
  "auth.passwordHint": "至少 8 位，需包含大小写字母、数字和特殊字符。",
  "auth.register": "注册",
  "auth.registerLink": "注册",
  "auth.registerSubmit": "注册",
  "auth.registerTitle": "注册",
  "auth.sessionExpired": "登录已过期，请重新登录。",
  "auth.submitting": "请稍候…",
  "auth.usageExhausted": "今日对话额度已用完。明天再试，或注册获取更多额度。",
  "auth.usageRemaining": "今日剩余: {remaining}/{limit} 次",
  "auth.user": "用户",
  "auth.username": "用户名（可选）",
  "chat.empty": "可以问任何帕鲁攻略问题。",
  "chat.title": "AI 对话",
  "password.needDigit": "密码需包含数字。",
  "password.needLower": "密码需包含小写字母。",
  "password.needSpecial": "密码需包含特殊字符。",
  "password.needUpper": "密码需包含大写字母。",
  "password.tooShort": "密码至少 8 位。",
  "detail.activeSkills": "主动技能",
  "detail.aiPlaceholder": "输入攻略问题…",
  "detail.aiSend": "提问",
  "detail.aiTitle": "向 AI 提问这只帕鲁",
  "detail.backToList": "返回列表",
  "detail.breeding": "繁殖",
  "detail.breedingCommon": "常见",
  "detail.breedingMid": "普通",
  "detail.breedingRank": "繁殖排名",
  "detail.breedingRare": "稀有",
  "detail.coordinates": "中心坐标",
  "detail.diurnal": "昼行",
  "detail.dropChance": "概率",
  "detail.dropName": "物品",
  "detail.dropUnknown": "—",
  "detail.dropUse": "用途",
  "detail.drops": "掉落物",
  "detail.hideSkills": "收起",
  "detail.levelRange": "等级",
  "detail.loading": "加载帕鲁中…",
  "detail.locations": "刷新位置",
  "detail.movement": "移动速度",
  "detail.noLocations": "暂无位置数据",
  "detail.noSkills": "暂无主动技能数据",
  "detail.nocturnal": "夜间活动",
  "detail.notFound": "未找到该帕鲁",
  "detail.partnerSkill": "伙伴技能",
  "detail.price": "售价",
  "detail.region": "区域",
  "detail.run": "奔跑",
  "detail.showAllSkills": "查看全部 {n} 个",
  "detail.size": "体形",
  "detail.skillCooldown": "冷却",
  "detail.skillEffect": "效果",
  "detail.skillElement": "属性",
  "detail.skillName": "名称",
  "detail.skillPower": "威力",
  "detail.spawnCount": "刷新点数",
  "detail.sprint": "冲刺",
  "detail.stat.defense": "防御",
  "detail.stat.hp": "HP",
  "detail.stat.melee": "近战",
  "detail.stat.shot": "远程",
  "detail.stat.stamina": "耐力",
  "detail.stat.support": "支援",
  "detail.viewBreeding": "查看繁殖路线",
  "detail.walk": "步行",
  "detail.work": "工作适性",
  "element.Dark": "暗",
  "element.Dragon": "龙",
  "element.Electric": "电",
  "element.Fire": "火",
  "element.Grass": "草",
  "element.Ground": "地",
  "element.Ice": "冰",
  "element.Neutral": "无",
  "element.Water": "水",
  "footer.contact": "欢迎在以下仓库提 Issue、建议或 PR：",
  "footer.contactTitle": "联系我们",
  "footer.disclaimer": "Pal Universe 是非官方粉丝向学习项目，与 Pocketpair 无关。《幻兽帕鲁》及相关素材归其权利方所有。站内数据可能不完整或未及时更新。",
  "footer.disclaimerTitle": "免责声明",
  "footer.github": "GitHub",
  "footer.learning": "本项目用于学习全栈开发实践（Next.js、FastAPI、LangGraph 等）。",
  "home.askAi": "按 Enter 问 AI 更多",
  "home.chatClose": "关闭",
  "home.chatHint": "检测到攻略问题 — 按 Enter 问 AI",
  "home.chatTitle": "AI 助手",
  "home.clearSearch": "清除搜索",
  "home.didYouMean": "您是不是要找:",
  "home.features": "功能入口",
  "home.hotPals": "热门帕鲁",
  "home.noResults": "未找到匹配的帕鲁",
  "home.searchLabel": "搜索帕鲁或提问 AI",
  "home.searchPlaceholder": "搜索帕鲁，或输入攻略问题…",
  "home.searching": "搜索中",
  "home.tagline": "智能搜索 · AI 攻略 · 帕鲁百科",
  "lang.en": "EN",
  "lang.switch": "语言",
  "lang.zh": "中文",
  "link.breeding": "繁殖计算器",
  "link.breedingDesc": "查父母组合与后代",
  "link.items": "物品图鉴",
  "link.itemsDesc": "掉落与材料",
  "link.map": "地图",
  "link.mapDesc": "刷新点与区域",
  "link.pals": "帕鲁列表",
  "link.palsDesc": "浏览全部帕鲁",
  "link.tier": "Tier 排行",
  "link.tierDesc": "强度与劳作榜",
  "link.types": "属性克制",
  "link.typesDesc": "元素相克速查",
  "list.apiFallback": "后端暂不可用 — 已切换本地图鉴数据",
  "list.clearFilters": "清除筛选",
  "list.elements": "元素属性",
  "list.empty": "没有找到匹配的帕鲁",
  "list.endOfList": "已显示全部 {n} 只帕鲁",
  "list.loadMore": "加载更多",
  "list.loadingMore": "加载更多…",
  "list.resultCount": "{n} 只帕鲁",
  "list.scrollForMore": "继续下滑加载更多",
  "list.searchLabel": "搜索帕鲁",
  "list.searchPlaceholder": "按名称搜索…",
  "list.title": "帕鲁列表",
  "list.works": "工作适性",
  "nav.home": "首页",
  "placeholder.backHome": "返回首页",
  "placeholder.comingSoon": "页面建设中，敬请期待。",
  "rarity.label": "稀有度 {n}",
  "stats.title": "基础属性",
  "work.base_worker": "手工",
  "work.cooling": "冷却",
  "work.electricity": "发电",
  "work.farming": "耕作",
  "work.fighter": "战斗特化",
  "work.fishing": "钓鱼",
  "work.flyer": "飞行",
  "work.gathering": "采集",
  "work.kindling": "引火",
  "work.level": "等级 {n}",
  "work.lumbering": "伐木",
  "work.medicine": "制药",
  "work.mining": "挖矿",
  "work.mount": "骑乘",
  "work.planting": "种植",
  "work.swimmer": "游泳",
  "work.transport": "运输",
  "work.watering": "浇水",
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
