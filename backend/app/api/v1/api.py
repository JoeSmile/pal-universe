"""API v1 router configuration.

This module sets up the main API router and includes all sub-routers.
"""

from fastapi import APIRouter

from app.api.v1.auth import router as auth_router
from app.api.v1.chatbot import router as chatbot_router
from app.api.v1.pals import router as pals_router
from app.api.v1.breeding import router as breeding_router
from app.core.logging import logger

api_router = APIRouter()

# Include routers
api_router.include_router(auth_router, prefix="/auth", tags=["Auth"])
api_router.include_router(chatbot_router, prefix="/chatbot", tags=["Chatbot"])
api_router.include_router(pals_router, prefix="/pals", tags=["Pals"])
api_router.include_router(breeding_router, prefix="/breeding", tags=["Breeding"])


@api_router.get("/health")
async def health_check():
    """Health check endpoint."""
    logger.info("health_check_called")
    return {"status": "healthy", "version": "1.0.0"}
