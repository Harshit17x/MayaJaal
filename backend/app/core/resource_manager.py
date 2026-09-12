from __future__ import annotations

import logging
import threading
from contextlib import contextmanager
from typing import Iterator


logger = logging.getLogger(__name__)


class ResourceManagerError(Exception):
    """Base exception for resource manager errors."""


class ResourceManager:
    """
    Controls concurrent inference execution.

    Designed for a CPU-first system where several ONNX models
    may be loaded but should not all consume unlimited CPU
    resources simultaneously.
    """

    def __init__(self, max_concurrent_inference: int = 2) -> None:
        if max_concurrent_inference < 1:
            raise ValueError(
                "max_concurrent_inference must be at least 1."
            )

        self.max_concurrent_inference = max_concurrent_inference

        # Semaphore limits the number of inference operations
        # running at the same time.
        self._inference_slots = threading.BoundedSemaphore(
            max_concurrent_inference
        )

        self._active_inference = 0
        self._counter_lock = threading.Lock()

    def acquire(self, timeout: float | None = None) -> bool:
        """
        Acquire an inference slot.

        Returns:
            True if a slot was acquired.
            False if the timeout expired.
        """

        if timeout is not None and timeout <= 0:
            raise ValueError("timeout must be greater than 0.")

        acquired = (
            self._inference_slots.acquire(
                timeout=timeout
            )
            if timeout is not None
            else self._inference_slots.acquire()
        )

        if acquired:
            with self._counter_lock:
                self._active_inference += 1

            logger.debug(
                "Inference slot acquired. Active: %d/%d",
                self._active_inference,
                self.max_concurrent_inference,
            )

        return acquired

    def release(self) -> None:
        """Release an inference slot."""

        with self._counter_lock:
            if self._active_inference <= 0:
                raise ResourceManagerError(
                    "Cannot release an inference slot that is not active."
                )

            self._active_inference -= 1

        try:
            self._inference_slots.release()

            logger.debug(
                "Inference slot released. Active: %d/%d",
                self._active_inference,
                self.max_concurrent_inference,
            )

        except ValueError as exc:
            logger.exception(
                "Resource semaphore release failed."
            )

            raise ResourceManagerError(
                "Resource semaphore state became invalid."
            ) from exc

    @contextmanager
    def inference_slot(
        self,
        timeout: float | None = None,
    ) -> Iterator[None]:
        """
        Context manager for safe inference execution.

        Example:

            with resource_manager.inference_slot(timeout=10):
                run_inference()
        """

        acquired = self.acquire(timeout=timeout)

        if not acquired:
            raise ResourceManagerError(
                "No inference slot became available within "
                f"{timeout} seconds."
            )

        try:
            yield

        finally:
            self.release()

    def get_status(self) -> dict[str, int]:
        """Return current resource usage."""

        with self._counter_lock:
            active = self._active_inference

        return {
            "max_concurrent_inference": (
                self.max_concurrent_inference
            ),
            "active_inference": active,
            "available_slots": (
                self.max_concurrent_inference - active
            ),
        }

    def is_available(self) -> bool:
        """Return whether an inference slot is currently available."""

        with self._counter_lock:
            return (
                self._active_inference
                < self.max_concurrent_inference
            )