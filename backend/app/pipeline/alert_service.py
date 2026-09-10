import asyncio
from datetime import datetime
import json
import logging
import math
from pathlib import Path
import threading
import time
from typing import Any, Optional
import uuid

from fastapi import WebSocket

logger = logging.getLogger("SIH26187.AlertService")

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
ALERTS_FILE = DATA_DIR / "alerts.json"
SNAPSHOTS_DIR = DATA_DIR / "alerts" / "snapshots"


class AlertBroadcaster:
    """Thread-safe WebSocket broadcaster for real-time security alerts."""

    def __init__(self) -> None:
        self.active_connections: set[WebSocket] = set()
        self.lock = threading.Lock()
        self._loop: Optional[asyncio.AbstractEventLoop] = None

    def set_event_loop(self, loop: asyncio.AbstractEventLoop) -> None:
        self._loop = loop

    async def connect(self, websocket: WebSocket) -> None:
        await websocket.accept()
        with self.lock:
            self.active_connections.add(websocket)
        logger.info("Alert WebSocket client connected. Total clients: %d", len(self.active_connections))

    def disconnect(self, websocket: WebSocket) -> None:
        with self.lock:
            self.active_connections.discard(websocket)
        logger.info("Alert WebSocket client disconnected. Remaining clients: %d", len(self.active_connections))

    async def broadcast(self, message: dict[str, Any]) -> None:
        """Asynchronously send JSON payload to all connected WebSocket clients."""
        with self.lock:
            conns = list(self.active_connections)

        dead_connections: list[WebSocket] = []
        for ws in conns:
            try:
                await ws.send_json(message)
            except Exception as exc:
                logger.debug("Failed to send alert to WebSocket client: %s", exc)
                dead_connections.append(ws)

        if dead_connections:
            with self.lock:
                for ws in dead_connections:
                    self.active_connections.discard(ws)

    def broadcast_sync(self, message: dict[str, Any]) -> None:
        """Thread-safe sync wrapper for background worker threads to broadcast alerts."""
        try:
            loop = self._loop
            if loop and loop.is_running():
                asyncio.run_coroutine_threadsafe(self.broadcast(message), loop)
            else:
                # Try getting the current running loop
                curr_loop = asyncio.get_event_loop()
                if curr_loop.is_running():
                    asyncio.run_coroutine_threadsafe(self.broadcast(message), curr_loop)
        except Exception as exc:
            logger.debug("Unable to dispatch WebSocket alert broadcast: %s", exc)


class AlertService:
    """
    Centralized Alert Management Service for MayaJaal.
    Maintains a persistent ring buffer of security triggers and suspect sightings,
    coordinates camera status changes, and manages real-time broadcast.
    """

    def __init__(self, max_alerts: int = 200) -> None:
        self.max_alerts = max_alerts
        self.lock = threading.Lock()
        self.alerts: list[dict[str, Any]] = []
        self.broadcaster = AlertBroadcaster()

        # Ensure directories exist
        DATA_DIR.mkdir(parents=True, exist_ok=True)
        SNAPSHOTS_DIR.mkdir(parents=True, exist_ok=True)

        self._load_alerts()

    def _load_alerts(self) -> None:
        with self.lock:
            if not ALERTS_FILE.exists():
                self.alerts = []
                self._save_alerts()
                return

            try:
                with open(ALERTS_FILE, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    if isinstance(data, list):
                        self.alerts = data[: self.max_alerts]
                    else:
                        self.alerts = []
                logger.info("Loaded %d alerts into AlertService.", len(self.alerts))
            except Exception as exc:
                logger.warning("Failed to load alerts file from %s: %s", ALERTS_FILE, exc)
                self.alerts = []

    def _save_alerts(self) -> None:
        try:
            temp_file = ALERTS_FILE.with_suffix(".tmp")
            with open(temp_file, "w", encoding="utf-8") as f:
                json.dump(self.alerts, f, indent=2)
            temp_file.replace(ALERTS_FILE)
        except Exception as exc:
            logger.error("Failed to save alerts to %s: %s", ALERTS_FILE, exc)

    def create_alert(
        self,
        title: str,
        location: str,
        severity: str = "High",
        camera_id: Optional[str] = None,
        camera_name: Optional[str] = None,
        class_name: str = "suspect",
        confidence: float = 0.90,
        box: Optional[list[float]] = None,
        snapshot_filename: Optional[str] = None,
        suspect_name: Optional[str] = None,
        threat_level: Optional[str] = None,
        category: Optional[str] = None,
        notes: Optional[str] = None,
    ) -> dict[str, Any]:
        """Create a new alert record, persist it, update camera status, and broadcast to clients."""
        alert_id = f"alert-{int(time.time() * 1000)}-{uuid.uuid4().hex[:4]}"
        now_ts = int(time.time() * 1000)

        snapshot_url = (
            f"/api/alerts/snapshots/{snapshot_filename}"
            if snapshot_filename
            else None
        )

        alert_item: dict[str, Any] = {
            "id": alert_id,
            "title": title,
            "location": location,
            "time": "Just now",
            "timestamp": now_ts,
            "severity": severity,
            "cameraId": camera_id,
            "cameraName": camera_name or camera_id or "Unknown Feed",
            "className": class_name,
            "confidence": round(confidence, 2),
            "acknowledged": False,
            "box": box or [],
            "snapshotUrl": snapshot_url,
            "suspectName": suspect_name,
            "threatLevel": threat_level or severity,
            "category": category,
            "notes": notes,
        }

        with self.lock:
            self.alerts.insert(0, alert_item)
            if len(self.alerts) > self.max_alerts:
                self.alerts.pop()
            self._save_alerts()

        # Update matching camera status in cameras.json to 'alert'
        if camera_id:
            self._set_camera_alert_status(camera_id)

        # Broadcast alert payload to all active WebSocket connections
        self.broadcaster.broadcast_sync({
            "type": "NEW_ALERT",
            "alert": alert_item,
        })

        logger.info("Security Alert dispatched: %s (Severity: %s, Camera: %s)", title, severity, camera_id)
        return alert_item

    def _set_camera_alert_status(self, camera_id: str) -> None:
        """Mark camera node status as 'alert' in cameras.json."""
        try:
            cameras_file = DATA_DIR / "cameras.json"
            if not cameras_file.exists():
                return
            with open(cameras_file, "r", encoding="utf-8") as f:
                cameras = json.load(f)

            updated = False
            for c in cameras:
                if c.get("id") == camera_id:
                    c["status"] = "alert"
                    c["lastActive"] = "Just now"
                    updated = True
                    break

            if updated:
                temp_file = cameras_file.with_suffix(".tmp")
                with open(temp_file, "w", encoding="utf-8") as f:
                    json.dump(cameras, f, indent=2)
                temp_file.replace(cameras_file)
        except Exception as exc:
            logger.debug("Failed to update camera %s status to 'alert': %s", camera_id, exc)

    def get_alerts(
        self,
        severity: Optional[str] = None,
        acknowledged: Optional[bool] = None,
        camera_id: Optional[str] = None,
        limit: int = 50,
    ) -> list[dict[str, Any]]:
        with self.lock:
            results = list(self.alerts)

        if severity and severity.lower() != "all":
            results = [a for a in results if a.get("severity", "").lower() == severity.lower()]
        if acknowledged is not None:
            results = [a for a in results if a.get("acknowledged") == acknowledged]
        if camera_id:
            results = [a for a in results if a.get("cameraId") == camera_id]

        return results[:limit]

    def acknowledge_alert(self, alert_id: str) -> bool:
        with self.lock:
            found = False
            for a in self.alerts:
                if a["id"] == alert_id:
                    a["acknowledged"] = True
                    found = True
                    break
            if found:
                self._save_alerts()

        if found:
            self.broadcaster.broadcast_sync({
                "type": "ACKNOWLEDGE_ALERT",
                "alertId": alert_id,
            })
        return found

    def clear_all(self) -> None:
        with self.lock:
            self.alerts = []
            self._save_alerts()
        self.broadcaster.broadcast_sync({
            "type": "CLEAR_ALERTS",
        })

    def get_suspect_trajectory(self, suspect_name: str) -> dict[str, Any]:
        """
        Reconstruct the chronological multi-camera trajectory of an enrolled suspect.
        Returns sequential camera waypoints, GPS coordinates, transit times, and distances.
        """
        with self.lock:
            matched = [
                a for a in self.alerts
                if a.get("suspectName") and a["suspectName"].strip().lower() == suspect_name.strip().lower()
            ]

        if not matched:
            return {
                "suspect_name": suspect_name,
                "found": False,
                "total_sightings": 0,
                "waypoints": [],
                "total_distance_km": 0.0,
            }

        matched_sorted = sorted(matched, key=lambda x: x.get("timestamp", 0))

        cameras_map: dict[str, dict[str, Any]] = {}
        try:
            cameras_file = DATA_DIR / "cameras.json"
            if cameras_file.exists():
                with open(cameras_file, "r", encoding="utf-8") as f:
                    cams = json.load(f)
                    for c in cams:
                        cameras_map[str(c.get("id"))] = c
        except Exception as err:
            logger.debug("Could not read cameras.json for trajectory: %s", err)

        def _calc_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
            r = 6371.0
            dlat = math.radians(lat2 - lat1)
            dlon = math.radians(lon2 - lon1)
            a = (
                math.sin(dlat / 2) ** 2
                + math.cos(math.radians(lat1))
                * math.cos(math.radians(lat2))
                * math.sin(dlon / 2) ** 2
            )
            c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
            return r * c

        waypoints = []
        total_distance = 0.0
        prev_coords: Optional[tuple[float, float]] = None
        prev_time = 0

        for idx, alert in enumerate(matched_sorted):
            cam_id = str(alert.get("cameraId", ""))
            cam_info = cameras_map.get(cam_id, {})
            lat = float(cam_info.get("latitude") or 32.7240 + (idx * 0.008))
            lng = float(cam_info.get("longitude") or 74.6710 + (idx * 0.008))

            delta_km = 0.0
            elapsed_min = 0.0
            if prev_coords is not None:
                delta_km = _calc_distance(prev_coords[0], prev_coords[1], lat, lng)
                total_distance += delta_km
                if prev_time > 0:
                    elapsed_min = round((alert.get("timestamp", 0) - prev_time) / 60000.0, 1)

            prev_coords = (lat, lng)
            prev_time = alert.get("timestamp", 0)

            waypoints.append({
                "step": idx + 1,
                "alert_id": alert.get("id"),
                "camera_id": cam_id,
                "camera_name": alert.get("cameraName") or cam_info.get("name", f"Camera {cam_id}"),
                "location": alert.get("location") or cam_info.get("location", "Perimeter Zone"),
                "sector": cam_info.get("sector", "Sector-04"),
                "latitude": lat,
                "longitude": lng,
                "timestamp": alert.get("timestamp"),
                "time_str": alert.get("time", "Recent"),
                "threat_level": alert.get("threatLevel", "HIGH"),
                "confidence": alert.get("confidence", 0.90),
                "snapshot_url": alert.get("snapshotUrl"),
                "delta_km": round(delta_km, 2),
                "elapsed_minutes": elapsed_min,
            })

        latest_threat = matched_sorted[-1].get("threatLevel", "HIGH")
        latest_category = matched_sorted[-1].get("category", "Wanted Suspect")

        return {
            "suspect_name": suspect_name,
            "found": True,
            "threat_level": latest_threat,
            "category": latest_category,
            "total_sightings": len(waypoints),
            "total_distance_km": round(total_distance, 2),
            "first_seen": waypoints[0]["time_str"] if waypoints else "N/A",
            "last_seen": waypoints[-1]["time_str"] if waypoints else "N/A",
            "last_location": waypoints[-1]["location"] if waypoints else "N/A",
            "waypoints": waypoints,
        }

    def dispatch_qrt_team(self, alert_id: str, unit_name: str, notes: Optional[str] = None) -> Optional[dict[str, Any]]:
        """Dispatch Quick Reaction Team to alert location and broadcast to operators."""
        with self.lock:
            target_alert = None
            for a in self.alerts:
                if a["id"] == alert_id:
                    dispatch_data = {
                        "unit": unit_name,
                        "notes": notes or "Tactical Quick Reaction Team deployed for intercept.",
                        "dispatched_at": int(time.time() * 1000),
                        "status": "Dispatched",
                    }
                    a["qrt_dispatch"] = dispatch_data
                    target_alert = a
                    break
            if target_alert:
                self._save_alerts()

        if target_alert:
            self.broadcaster.broadcast_sync({
                "type": "QRT_DISPATCHED",
                "alertId": alert_id,
                "dispatch": target_alert["qrt_dispatch"],
                "location": target_alert.get("location"),
                "suspectName": target_alert.get("suspectName"),
            })
            logger.info("QRT Team '%s' deployed for alert %s", unit_name, alert_id)
            return target_alert["qrt_dispatch"]
        return None


alert_service = AlertService()
