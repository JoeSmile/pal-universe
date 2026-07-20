"""LangGraph tools for enhanced language model capabilities.

This package contains custom tools that can be used with LangGraph to extend
the capabilities of language models. Currently includes tools for web search,
Palworld data querying, and other external integrations.
"""

from langchain_core.tools.base import BaseTool

from .ask_human import ask_human
from .duckduckgo_search import duckduckgo_search_tool
from .palworld_search import (
    breeding_calc,
    breeding_reverse,
    map_search,
    pal_search,
)

tools: list[BaseTool] = [
    duckduckgo_search_tool,
    ask_human,
    pal_search,
    breeding_calc,
    breeding_reverse,
    map_search,
]
