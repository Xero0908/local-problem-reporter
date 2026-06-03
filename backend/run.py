#!/usr/bin/env python
"""
Run the FastAPI application
"""
import uvicorn
import os
from dotenv import load_dotenv
from app.main import app

# Load environment variables from .env file
load_dotenv()


if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=port,
        log_level="info"
    )
