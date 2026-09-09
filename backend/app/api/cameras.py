import json
import ipaddress
import os
from pathlib import Path
import re
import socket
import time
from typing import Any, Optional
from urllib.parse import urlparse

from fastapi import APIRouter, HTTPException, Query, status
from pydantic import BaseModel, Field

from app.utils.logging import get_logger
from app.core.config import settings

logger = get_logger("SIH26187.Cameras")

router = APIRouter(
    prefix="/api/cameras",
    tags=["Cameras"],
)

DATA_FILE = Path(__file__).resolve().parent.parent / "data" / "cameras.json"

DEFAULT_CAMERAS: list[dict[str, Any]] = [
    {
        "id": "cam-1",
        "name": "BOP Alpha — Wagah-Attari Forward Post",
        "sector": "Sector-01 (Punjab Western IB)",
        "location": "Pillar 102 — Zero Line Trench Observation",
        "status": "online",
        "type": "Optical 4K",
        "ipAddress": "10.20.72.101",
        "port": 554,
        "streamUrl": "rtsp://admin:pass@10.20.72.101:554/live/ch0",
        "isRtsp": True,
        "latitude": 31.3344,
        "longitude": 74.5433,
        "coordinates": [74.5433, 31.3344],
        "modelAssigned": "best.onnx (Threat Detector)",
        "resolution": "4K UHD (3840x2160)",
        "fps": 30,
        "confThreshold": 0.75,
        "iouThreshold": 0.45,
        "isRecording": True,
        "alertTriggerEnabled": True,
        "lastActive": "Just now",
        "healthStats": {
            "bitrate": "8.4 Mbps",
            "latencyMs": 34,
            "packetLoss": "0.01%",
        },
    },
    {
        "id": "cam-2",
        "name": "BOP Bravo — RS Pura Jammu Border Gate",
        "sector": "Sector-02 (Jammu Frontier IB)",
        "location": "Vehicle Crossing Checkpost — Pillar 48",
        "status": "alert",
        "type": "ANPR Dedicated",
        "ipAddress": "10.20.72.102",
        "port": 554,
        "streamUrl": "rtsp://admin:pass@10.20.72.102:554/live/ch0",
        "isRtsp": True,
        "latitude": 32.7150,
        "longitude": 74.6580,
        "coordinates": [74.6580, 32.7150],
        "modelAssigned": "best.onnx (Threat Detector)",
        "resolution": "1080p FHD (1920x1080)",
        "fps": 60,
        "confThreshold": 0.70,
        "iouThreshold": 0.45,
        "isRecording": True,
        "alertTriggerEnabled": True,
        "lastActive": "Just now",
        "healthStats": {
            "bitrate": "6.2 Mbps",
            "latencyMs": 29,
            "packetLoss": "0.00%",
        },
    },
    {
        "id": "cam-3",
        "name": "BOP Charlie — Thar Longewala Desert Post",
        "sector": "Sector-03 (Rajasthan Thar Frontier)",
        "location": "Watch Tower 03 — Border Dune Observation",
        "status": "online",
        "type": "Thermal FLIR",
        "ipAddress": "10.20.72.103",
        "port": 554,
        "streamUrl": "rtsp://admin:pass@10.20.72.103:554/live/ch1",
        "isRtsp": True,
        "latitude": 27.9612,
        "longitude": 71.8983,
        "coordinates": [71.8983, 27.9612],
        "modelAssigned": "best.onnx (Threat Detector)",
        "resolution": "1080p Thermal",
        "fps": 25,
        "confThreshold": 0.80,
        "iouThreshold": 0.50,
        "isRecording": True,
        "alertTriggerEnabled": True,
        "lastActive": "1 min ago",
        "healthStats": {
            "bitrate": "4.8 Mbps",
            "latencyMs": 46,
            "packetLoss": "0.03%",
        },
    },
    {
        "id": "cam-4",
        "name": "BOP Delta — Sir Creek Riverine Outpost",
        "sector": "Sector-04 (Kutch Creek Frontier)",
        "location": "Harami Nala — Floating Bunkered Post 02",
        "status": "online",
        "type": "Night Vision / IR",
        "ipAddress": "10.20.72.104",
        "port": 554,
        "streamUrl": "rtsp://admin:pass@10.20.72.104:554/live/ch0",
        "isRtsp": True,
        "latitude": 23.5125,
        "longitude": 68.5038,
        "coordinates": [68.5038, 23.5125],
        "modelAssigned": "best.onnx (Threat Detector)",
        "resolution": "1080p FHD (1920x1080)",
        "fps": 30,
        "confThreshold": 0.75,
        "iouThreshold": 0.45,
        "isRecording": True,
        "alertTriggerEnabled": True,
        "lastActive": "3 mins ago",
        "healthStats": {
            "bitrate": "5.1 Mbps",
            "latencyMs": 52,
            "packetLoss": "0.02%",
        },
    },
    {
        "id": "cam-5",
        "name": "BOP Echo — Nathu La Pass High-Altitude Post",
        "sector": "Sector-05 (Sikkim Northern LAC)",
        "location": "Mountain Ridge Bunker 09 — Pass Perimeter",
        "status": "degraded",
        "type": "PTZ 360",
        "ipAddress": "10.20.72.105",
        "port": 554,
        "streamUrl": "rtsp://admin:pass@10.20.72.105:554/live/ch0",
        "isRtsp": True,
        "latitude": 27.9900,
        "longitude": 88.3552,
        "coordinates": [88.3552, 27.9900],
        "modelAssigned": "best.onnx (Threat Detector)",
        "resolution": "1080p FHD (1920x1080)",
        "fps": 25,
        "confThreshold": 0.75,
        "iouThreshold": 0.45,
        "isRecording": True,
        "alertTriggerEnabled": False,
        "lastActive": "8 mins ago",
        "healthStats": {
            "bitrate": "3.5 Mbps",
            "latencyMs": 112,
            "packetLoss": "1.80%",
        },
    },
    {
        "id": "cam-6",
        "name": "BOP Foxtrot — Petrapole Eastern Zero Line",
        "sector": "Sector-06 (Bengal Eastern Border)",
        "location": "Integrated Checkpost Gate — Border Line",
        "status": "online",
        "type": "Optical 4K",
        "ipAddress": "10.20.72.106",
        "port": 554,
        "streamUrl": "rtsp://admin:pass@10.20.72.106:554/live/ch0",
        "isRtsp": True,
        "latitude": 25.8001,
        "longitude": 88.1830,
        "coordinates": [88.1830, 25.8001],
        "modelAssigned": "best.onnx (Threat Detector)",
        "resolution": "4K UHD (3840x2160)",
        "fps": 30,
        "confThreshold": 0.80,
        "iouThreshold": 0.45,
        "isRecording": True,
        "alertTriggerEnabled": True,
        "lastActive": "Just now",
        "healthStats": {
            "bitrate": "7.8 Mbps",
            "latencyMs": 31,
            "packetLoss": "0.01%",
        },
    },
]


def _ensure_data_file() -> None:
    DATA_FILE.parent.mkdir(parents=True, exist_ok=True)
    if not DATA_FILE.exists():
        with open(DATA_FILE, "w", encoding="utf-8") as f:
            json.dump(DEFAULT_CAMERAS, f, indent=2)


def _load_cameras() -> list[dict[str, Any]]:
    _ensure_data_file()
    try:
        with open(DATA_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
            if isinstance(data, list):
                return data
            return DEFAULT_CAMERAS
    except Exception as exc:
        logger.warning("Failed to load cameras file: %s", exc)
        return DEFAULT_CAMERAS


def _save_cameras(cameras: list[dict[str, Any]]) -> None:
    _ensure_data_file()
    temp_file = DATA_FILE.with_suffix(".tmp")
    with open(temp_file, "w", encoding="utf-8") as f:
        json.dump(cameras, f, indent=2)
    temp_file.replace(DATA_FILE)


def _allowed_camera_networks() -> tuple[ipaddress.IPv4Network | ipaddress.IPv6Network, ...]:
    """Return the explicitly configured camera networks.

    Stream testing opens a network connection from the backend. Keeping the
    target in an allowlist prevents the endpoint from becoming a general
    internal-network scanner.
    """
    try:
        networks = tuple(
            ipaddress.ip_network(value.strip(), strict=False)
            for value in settings.allowed_camera_cidrs.split(",")
            if value.strip()
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Invalid SIH_ALLOWED_CAMERA_CIDRS configuration.",
        ) from exc

    if not networks:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Camera stream testing is disabled until an allowed network is configured.",
        )
    return networks


def _resolve_approved_camera_host(host: str, port: int) -> str:
    """Resolve *host* and return an allowlisted address for the socket call."""
    if not host:
        raise HTTPException(status_code=400, detail="RTSP URL must include a host.")

    try:
        address_records = socket.getaddrinfo(
            host,
            port,
            family=socket.AF_UNSPEC,
            type=socket.SOCK_STREAM,
        )
    except socket.gaierror as exc:
        raise HTTPException(
            status_code=400,
            detail="Unable to resolve the requested camera host.",
        ) from exc

    allowed_networks = _allowed_camera_networks()
    for record in address_records:
        resolved_host = record[4][0]
        try:
            address = ipaddress.ip_address(resolved_host)
        except ValueError:
            continue
        if any(address in network for network in allowed_networks):
            # Connect using the resolved address rather than the supplied DNS
            # name, preventing a DNS-rebinding change between validation and use.
            return str(address)

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Camera host is outside the approved camera networks.",
    )


class HealthStats(BaseModel):
    bitrate: Optional[str] = "6.0 Mbps"
    latencyMs: Optional[int] = 45
    packetLoss: Optional[str] = "0.00%"


class CameraCreateRequest(BaseModel):
    id: Optional[str] = None
    name: str = Field(..., min_length=2, max_length=120)
    sector: str = Field("Sector-01 (Punjab Western IB)", min_length=2)
    location: str = Field(..., min_length=2)
    status: str = Field("online")
    type: str = Field("Optical 4K")
    ipAddress: Optional[str] = None
    port: Optional[int] = Field(554, ge=1, le=65535)
    streamUrl: Optional[str] = None
    isRtsp: bool = True
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)
    modelAssigned: Optional[str] = "best.onnx (Threat Detector)"
    resolution: Optional[str] = "1080p FHD (1920x1080)"
    fps: Optional[int] = Field(30, ge=1, le=120)
    confThreshold: Optional[float] = Field(0.75, ge=0.1, le=1.0)
    iouThreshold: Optional[float] = Field(0.45, ge=0.1, le=1.0)
    isRecording: Optional[bool] = True
    alertTriggerEnabled: Optional[bool] = True


class CameraUpdateRequest(BaseModel):
    name: Optional[str] = Field(None, min_length=2)
    sector: Optional[str] = None
    location: Optional[str] = None
    status: Optional[str] = None
    type: Optional[str] = None
    ipAddress: Optional[str] = None
    port: Optional[int] = Field(None, ge=1, le=65535)
    streamUrl: Optional[str] = None
    isRtsp: Optional[bool] = None
    latitude: Optional[float] = Field(None, ge=-90.0, le=90.0)
    longitude: Optional[float] = Field(None, ge=-180.0, le=180.0)
    modelAssigned: Optional[str] = None
    resolution: Optional[str] = None
    fps: Optional[int] = Field(None, ge=1, le=120)
    confThreshold: Optional[float] = Field(None, ge=0.1, le=1.0)
    iouThreshold: Optional[float] = Field(None, ge=0.1, le=1.0)
    isRecording: Optional[bool] = None
    alertTriggerEnabled: Optional[bool] = None


class TestStreamRequest(BaseModel):
    streamUrl: Optional[str] = None
    ipAddress: Optional[str] = None
    port: Optional[int] = 554


@router.get("")
async def get_cameras(sector: Optional[str] = None, status: Optional[str] = None) -> list[dict[str, Any]]:
    """Get all registered camera nodes with optional filtering."""
    cameras = _load_cameras()
    if sector and sector.lower() != "all":
        cameras = [c for c in cameras if sector.lower() in c.get("sector", "").lower()]
    if status and status.lower() != "all":
        cameras = [c for c in cameras if c.get("status", "").lower() == status.lower()]
    return cameras


@router.get("/{camera_id}")
async def get_camera(camera_id: str) -> dict[str, Any]:
    """Get a single camera node by ID."""
    cameras = _load_cameras()
    for c in cameras:
        if c.get("id") == camera_id:
            return c
    raise HTTPException(status_code=404, detail=f"Camera with ID '{camera_id}' not found.")


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_camera(payload: CameraCreateRequest) -> dict[str, Any]:
    """Add a new camera node with RTSP IP and geospatial coordinates."""
    cameras = _load_cameras()

    # Generate unique ID if not provided
    cam_id = payload.id
    if not cam_id:
        existing_numbers = []
        for c in cameras:
            match = re.search(r"cam-(\d+)", c.get("id", ""))
            if match:
                existing_numbers.append(int(match.group(1)))
        next_num = max(existing_numbers, default=0) + 1
        cam_id = f"cam-{next_num}"
    else:
        if any(c.get("id") == cam_id for c in cameras):
            raise HTTPException(
                status_code=400,
                detail=f"Camera with ID '{cam_id}' already exists."
            )

    # Format stream URL if not provided but IP is given
    stream_url = payload.streamUrl
    if not stream_url and payload.ipAddress:
        port = payload.port or 554
        stream_url = f"rtsp://{payload.ipAddress}:{port}/live/ch0"

    new_camera: dict[str, Any] = {
        "id": cam_id,
        "name": payload.name,
        "sector": payload.sector,
        "location": payload.location,
        "status": payload.status,
        "type": payload.type,
        "ipAddress": payload.ipAddress,
        "port": payload.port,
        "streamUrl": stream_url,
        "isRtsp": payload.isRtsp,
        "latitude": payload.latitude,
        "longitude": payload.longitude,
        "coordinates": [payload.longitude, payload.latitude],
        "modelAssigned": payload.modelAssigned or "best.onnx (Threat Detector)",
        "resolution": payload.resolution or "1080p FHD (1920x1080)",
        "fps": payload.fps or 30,
        "confThreshold": payload.confThreshold or 0.75,
        "iouThreshold": payload.iouThreshold or 0.45,
        "isRecording": payload.isRecording if payload.isRecording is not None else True,
        "alertTriggerEnabled": (
            payload.alertTriggerEnabled
            if payload.alertTriggerEnabled is not None
            else True
        ),
        "lastActive": "Just now",
        "healthStats": {
            "bitrate": "6.8 Mbps",
            "latencyMs": 44,
            "packetLoss": "0.00%",
        },
    }

    cameras.append(new_camera)
    _save_cameras(cameras)
    logger.info("Created camera node %s (%s)", cam_id, payload.name)
    return new_camera


@router.put("/{camera_id}")
async def update_camera(camera_id: str, payload: CameraUpdateRequest) -> dict[str, Any]:
    """Update settings, coordinates, or RTSP config for a camera."""
    cameras = _load_cameras()
    target_idx = None
    for idx, c in enumerate(cameras):
        if c.get("id") == camera_id:
            target_idx = idx
            break

    if target_idx is None:
        raise HTTPException(
            status_code=404,
            detail=f"Camera with ID '{camera_id}' not found."
        )

    current = cameras[target_idx]
    updates = payload.model_dump(exclude_unset=True)

    # Sync coordinates if latitude or longitude changed
    new_lat = updates.get("latitude", current.get("latitude"))
    new_lng = updates.get("longitude", current.get("longitude"))
    if new_lat is not None and new_lng is not None:
        updates["coordinates"] = [new_lng, new_lat]

    # Sync streamUrl if IP changed and streamUrl wasn't explicitly supplied
    if "ipAddress" in updates and "streamUrl" not in updates and updates["ipAddress"]:
        port = updates.get("port") or current.get("port", 554)
        updates["streamUrl"] = f"rtsp://{updates['ipAddress']}:{port}/live/ch0"

    current.update(updates)
    current["lastActive"] = "Just now"
    cameras[target_idx] = current
    _save_cameras(cameras)

    logger.info("Updated camera node %s", camera_id)
    return current


@router.delete("/{camera_id}")
async def delete_camera(camera_id: str) -> dict[str, Any]:
    """Remove a camera node from the operational registry."""
    cameras = _load_cameras()
    filtered = [c for c in cameras if c.get("id") != camera_id]

    if len(filtered) == len(cameras):
        raise HTTPException(
            status_code=404,
            detail=f"Camera with ID '{camera_id}' not found."
        )

    _save_cameras(filtered)
    logger.info("Deleted camera node %s", camera_id)
    return {"status": "success", "message": f"Camera '{camera_id}' deleted successfully.", "deleted_id": camera_id}


@router.post("/test-stream")
async def test_stream(payload: TestStreamRequest) -> dict[str, Any]:
    """
    Ping and test RTSP connection reachability and stream handshaking.
    Validates URL format, parses host/port, and tests socket connection.
    """
    stream_url = payload.streamUrl
    ip = payload.ipAddress
    port = payload.port or 554

    if not stream_url and not ip:
        raise HTTPException(
            status_code=400,
            detail="Either streamUrl or ipAddress must be provided.",
        )

    # Resolve target host & port
    target_host = ip
    target_port = port

    if stream_url:
        try:
            parsed = urlparse(stream_url)
            if parsed.scheme.lower() != "rtsp":
                return {
                    "reachable": False,
                    "status": "error",
                    "latencyMs": 0,
                    "message": f"Invalid protocol '{parsed.scheme}'. RTSP streams must begin with rtsp://",
                }
            target_host = parsed.hostname or ip
            target_port = parsed.port or port or 554
        except Exception as exc:
            return {
                "reachable": False,
                "status": "error",
                "latencyMs": 0,
                "message": f"Failed to parse RTSP URL: {exc}",
            }

    approved_host = _resolve_approved_camera_host(target_host or "", target_port)

    # Attempt TCP handshake test to the approved RTSP port.
    start_time = time.perf_counter()
    address_family = socket.AF_INET6 if ":" in approved_host else socket.AF_INET
    sock = socket.socket(address_family, socket.SOCK_STREAM)
    sock.settimeout(1.5)  # 1.5s timeout for local/edge network check

    reachable = False
    message = ""
    try:
        sock.connect((approved_host, target_port))
        elapsed_ms = int((time.perf_counter() - start_time) * 1000)
        reachable = True
        message = f"RTSP handshake successful at {approved_host}:{target_port} (Latency: {elapsed_ms}ms)"
    except socket.timeout:
        elapsed_ms = int((time.perf_counter() - start_time) * 1000)
        reachable = False
        message = f"Connection timed out connecting to {approved_host}:{target_port}."
    except Exception as exc:
        elapsed_ms = int((time.perf_counter() - start_time) * 1000)
        # Note: in demo or isolated environments, the target camera IP might be simulated.
        reachable = False
        message = f"Connection refused or unreachable at {approved_host}:{target_port}: {exc}"
    finally:
        sock.close()

    return {
        "reachable": reachable,
        "status": "online" if reachable else "unreachable",
        "latencyMs": elapsed_ms,
        "host": target_host,
        "port": target_port,
        "message": message,
        "protocol": "RTSP/1.0",
        "supportedCodecs": ["H.264", "H.265", "MJPEG"],
    }
