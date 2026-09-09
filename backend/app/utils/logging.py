from __future__ import annotations

import logging
from logging.handlers import RotatingFileHandler
from pathlib import Path

from app.core.config import settings


def setup_logging() -> None:
    """
    Configure application-wide logging.

    Logs are written to both:
    - the console
    - a rotating log file
    """

    log_directory: Path = settings.log_directory
    log_directory.mkdir(parents=True, exist_ok=True)

    log_file = log_directory / "backend.log"

    formatter = logging.Formatter(
        "%(asctime)s | %(levelname)s | "
        "%(name)s | %(message)s"
    )

    root_logger = logging.getLogger()

    # Avoid duplicate handlers if setup_logging()
    # is called more than once.
    if root_logger.handlers:
        return

    root_logger.setLevel(settings.log_level.upper())

    console_handler = logging.StreamHandler()
    console_handler.setFormatter(formatter)

    file_handler = RotatingFileHandler(
        log_file,
        maxBytes=5 * 1024 * 1024,
        backupCount=3,
        encoding="utf-8",
    )
    file_handler.setFormatter(formatter)

    root_logger.addHandler(console_handler)
    root_logger.addHandler(file_handler)


def get_logger(name: str) -> logging.Logger:
    """Return a logger for a specific application module."""

    return logging.getLogger(name)
