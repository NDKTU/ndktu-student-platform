
import logging
import os
from datetime import datetime
from logging.handlers import TimedRotatingFileHandler
import logfire
from logfire import LogfireLoggingHandler

# --- Logfire Setup ---
logfire.configure()

# --- Base setup ---
LOG_DIR = "logs"
LEVELS = ["debug", "info", "warning", "error", "critical"]
RETENTION_DAYS = {"debug": 5, "info": 7, "warning": 30, "error": 30, "critical": 30}

# Ensure log folders exist
for level in LEVELS:
    os.makedirs(os.path.join(LOG_DIR, level), exist_ok=True)


# --- Formatters ---
detailed_formatter = logging.Formatter(
    (
        "%(asctime)s | %(levelname)-8s | %(name)s | "
        "%(filename)s:%(lineno)d | %(funcName)s() | %(message)s"
    ),
    datefmt="%Y-%m-%d %H:%M:%S",
)

console_formatter = logging.Formatter(
    "%(asctime)s | %(levelname)-8s | %(name)s | %(message)s", datefmt="%Y-%m-%d %H:%M:%S"
)

debug_formatter = logging.Formatter(
    "%(levelname)s | %(name)s | %(message)s"
)  # no timestamp


# --- Filters per level ---
class LevelFilter(logging.Filter):
    """Filter logs by level name."""

    def __init__(self, level_name):
        super().__init__()
        self.level_name = level_name.upper()

    def filter(self, record):
        return record.levelname == self.level_name


# --- Root logger ---
logger = logging.getLogger()
logger.setLevel(logging.INFO)  # Default to INFO to suppress noisy library debug logs

# --- App-specific loggers to DEBUG ---
# Enable DEBUG for our own application modules
for module in ["core", "middleware", "models", "modules", "dependence", "lifespan", "app"]:
    logging.getLogger(module).setLevel(logging.DEBUG)

# --- Suppress Noisy Libraries ---
logging.getLogger("watchfiles").setLevel(logging.WARNING)
logging.getLogger("uvicorn.error").setLevel(logging.WARNING)


# --- Logfire Handler ---
# Add Logfire handler to root logger
logfire_handler = LogfireLoggingHandler()
logfire_handler.setLevel(logging.INFO) # Default to INFO for Logfire to reduce noise, or DEBUG if preferred
logger.addHandler(logfire_handler)


# --- Console handler ---
console_handler = logging.StreamHandler()
console_handler.setLevel(logging.INFO)
console_handler.setFormatter(console_formatter)
logger.addHandler(console_handler)


# --- File handlers per level ---
today = datetime.now().strftime("%Y-%m-%d")  # prefix date in filename

for level in LEVELS:
    filename = os.path.join(LOG_DIR, level, f"{today}_{level}_log.log")
    handler = TimedRotatingFileHandler(
        filename,
        when="midnight",
        interval=1,
        backupCount=RETENTION_DAYS[level],
        encoding="utf-8",
    )
    handler.setLevel(getattr(logging, level.upper()))
    handler.addFilter(LevelFilter(level))  # only this level

    # Formatter: debug simplified, others detailed
    if level == "debug":
        handler.setFormatter(debug_formatter)
    else:
        handler.setFormatter(detailed_formatter)

    logger.addHandler(handler)
