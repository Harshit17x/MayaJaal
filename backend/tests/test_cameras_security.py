import socket

import pytest
from fastapi import HTTPException

from app.api import cameras


def test_stream_target_uses_allowlisted_resolved_address(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(cameras.settings, "allowed_camera_cidrs", "10.20.72.0/24")
    monkeypatch.setattr(
        socket,
        "getaddrinfo",
        lambda *args, **kwargs: [
            (socket.AF_INET, socket.SOCK_STREAM, 6, "", ("10.20.72.101", 554))
        ],
    )

    assert cameras._resolve_approved_camera_host("camera.example", 554) == "10.20.72.101"


def test_stream_target_rejects_addresses_outside_camera_network(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(cameras.settings, "allowed_camera_cidrs", "10.20.72.0/24")
    monkeypatch.setattr(
        socket,
        "getaddrinfo",
        lambda *args, **kwargs: [
            (socket.AF_INET, socket.SOCK_STREAM, 6, "", ("127.0.0.1", 554))
        ],
    )

    with pytest.raises(HTTPException) as exc_info:
        cameras._resolve_approved_camera_host("localhost", 554)

    assert exc_info.value.status_code == 403
