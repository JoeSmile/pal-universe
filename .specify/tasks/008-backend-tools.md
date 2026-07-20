# 008-backend-tools

## Status
- status: pending
- assigned_to: cursor
- depends_on: []

## Goal

在 backend 中添加 Palworld 查询工具，供 LangGraph Agent 调用。包含帕鲁搜索、繁殖计算、位置查询。

## Files
- Create: `backend/app/core/langgraph/tools/palworld_search.py`
- Create: `backend/app/core/langgraph/tools/__init__.py` (修改)

## Acceptance Criteria
- [x] `pal_search(name, types, work_type)` — 按名称/属性/工作查询帕鲁，返回结构化数据
- [x] `breeding_calc(parent1, parent2)` — 返回繁殖结果 + 计算公式
- [x] `breeding_reverse(target)` — 返回所有父代组合
- [x] `map_search(pal_name)` — 返回帕鲁位置
- [x] 工具函数有类型标注和 docstring
- [x] 工具注册到 tools 列表（修改 `__init__.py`）
- [x] 可以手动测试：`python3 -m app.core.langgraph.tools.palworld_search` 能跑

## Implementation Hints
- 继承 LangChain's `@tool` 装饰器模式（参考已有的 duckduckgo_search.py）
- 数据从 palworld-kb JSON 文件加载（同 seed 脚本的路径逻辑）
- breeding 算法实现参考 PRD-003 的 BFS 伪代码
- 特殊组合（28 组）硬编码为常量
- 不需要数据库依赖，Phase 2 再迁移到 pgvector
