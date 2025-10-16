import os
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# Define a complete default data source for testing
DEFAULT_SOURCE_TYPE = os.getenv("DEFAULT_SOURCE_TYPE", "postgresql")
DEFAULT_DATABASE_URI = os.getenv("DATABASE_URL")

if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY environment variable not set!")
if not DEFAULT_DATABASE_URI:
    raise ValueError("Default DATABASE_URL environment variable is not set!")