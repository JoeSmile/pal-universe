const GUIDE_ANSWERS: Array<{ pattern: RegExp; answer: string }> = [
  {
    pattern: /暗系|dark\s*boss|打暗/i,
    answer:
      "打暗系 BOSS 建议带圣光骑士 / 阿努比斯等光/中立高输出帕鲁，优先控场再爆发。注意暗系对暗抗性高，别纯暗队硬刚。",
  },
  {
    pattern: /前期|early|抓什么/i,
    answer:
      "前期优先棉悠悠、捣蛋猫、皮皮鸡打基础劳作；探索带翠叶鼠/冲浪鸭过渡。先稳住基地产能再追稀有帕鲁。",
  },
  {
    pattern: /火队|fire\s*team|配火/i,
    answer:
      "火队可围绕焰煌 / 炽焰牛 / 火麒麟组核，补一只水或冰位应对岩石系。工作侧保留引火与挖矿分工。",
  },
  {
    pattern: /繁殖|breed|配种/i,
    answer:
      "繁殖按父母繁殖值取中再查表；特殊组合优先查特殊配方。想冲传说帕鲁，先锁定父母再刷性格被动。",
  },
  {
    pattern: /克制|属性|type\s*chart/i,
    answer:
      "水克火、火克草、草克地；电克水但怕地；冰克龙。组队时至少准备一对互相覆盖的属性。",
  },
];

const FALLBACK_ANSWER =
  "这是 mock 模式下的 AI 回答。正式环境会检索知识库后流式返回。你可以问问：怎么打暗系 BOSS、前期抓什么好、如何配火队。";

export function resolveMockAnswer(question: string): string {
  const trimmed = question.trim();
  for (const entry of GUIDE_ANSWERS) {
    if (entry.pattern.test(trimmed)) {
      return entry.answer;
    }
  }
  return FALLBACK_ANSWER;
}

export interface StreamMockChatOptions {
  /** Delay between characters in ms. Use 0 in tests. */
  delayMs?: number;
  signal?: AbortSignal;
}

function wait(ms: number, signal?: AbortSignal): Promise<void> {
  if (ms <= 0) {
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    const onAbort = (): void => {
      window.clearTimeout(timer);
      reject(new DOMException("Aborted", "AbortError"));
    };
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

/** Simulate SSE token streaming for homepage mock chat. */
export async function* streamMockChat(
  question: string,
  options: StreamMockChatOptions = {},
): AsyncGenerator<string, void, undefined> {
  const answer = resolveMockAnswer(question);
  const delayMs = options.delayMs ?? 12;

  for (const char of answer) {
    if (options.signal?.aborted) {
      throw new DOMException("Aborted", "AbortError");
    }
    yield char;
    await wait(delayMs, options.signal);
  }
}
