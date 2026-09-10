"""
Virtual Geofencing & Directional Tripwire Engine.

Provides mathematical algorithms and real-time evaluation for:
1. Polygonal Virtual Geofences (Ray-Casting Jordan Curve Theorem with footpoint calibration).
2. Directional Tripwires (2D CCW Segment Intersection & Normal Vector Dot Product).
3. Cooldown debouncing, track history persistence, and automated alert dispatch to AlertService.
"""
from __future__ import annotations

from datetime import datetime, timezone
import json
import logging
from pathlib import Path
import threading
import time
from typing import Any, Optional
import uuid

from app.pipeline.alert_service import alert_service

logger = logging.getLogger("SIH26187.GeofenceEngine")

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
GEOFENCES_FILE = DATA_DIR / "geofences.json"


# ─────────────────────────────────────────────────────────────────────────────
# Geometric & Algorithmic Primitives
# ─────────────────────────────────────────────────────────────────────────────

def is_point_in_polygon(x: float, y: float, polygon: list[list[float]]) -> bool:
    """
    Ray-casting algorithm (Jordan Curve Theorem).
    Returns True if point (x, y) is strictly inside the polygon.
    Works for convex and concave polygons in normalized or pixel coordinates.
    """
    n = len(polygon)
    if n < 3:
        return False

    inside = False
    p1x, p1y = polygon[0]
    for i in range(1, n + 1):
        p2x, p2y = polygon[i % n]
        if y > min(p1y, p2y):
            if y <= max(p1y, p2y):
                if x <= max(p1x, p2x):
                    if p1y != p2y:
                        xinters = (y - p1y) * (p2x - p1x) / (p2y - p1y) + p1x
                    else:
                        xinters = p1x
                    if p1x == p2x or x <= xinters:
                        inside = not inside
        p1x, p1y = p2x, p2y

    return inside


def ccw(ax: float, ay: float, bx: float, by: float, cx: float, cy: float) -> float:
    """2D Counter-Clockwise orientation test (cross product determinant)."""
    return (bx - ax) * (cy - ay) - (by - ay) * (cx - ax)


def check_tripwire_crossing(
    p1: list[float],
    p2: list[float],
    prev_pt: tuple[float, float],
    curr_pt: tuple[float, float],
    direction: str = "FORWARD",
) -> tuple[bool, str, float]:
    """
    Evaluates whether a target moving from prev_pt to curr_pt crossed the tripwire p1 -> p2.

    Returns:
        (crossed: bool, crossed_direction: str, dot_product: float)
    """
    ax, ay = float(p1[0]), float(p1[1])
    bx, by = float(p2[0]), float(p2[1])
    u1, v1 = float(prev_pt[0]), float(prev_pt[1])
    u2, v2 = float(curr_pt[0]), float(curr_pt[1])

    # 1. Check segment-segment intersection via CCW sign checks
    ccw_ab_1 = ccw(ax, ay, bx, by, u1, v1)
    ccw_ab_2 = ccw(ax, ay, bx, by, u2, v2)
    ccw_uv_1 = ccw(u1, v1, u2, v2, ax, ay)
    ccw_uv_2 = ccw(u1, v1, u2, v2, bx, by)

    # They intersect if and only if points lie on opposite sides of both lines
    intersects = ((ccw_ab_1 * ccw_ab_2) <= 0) and ((ccw_uv_1 * ccw_uv_2) <= 0)
    if not intersects:
        return False, "NONE", 0.0

    # 2. Determine direction using right-handed normal vector
    # Tripwire vector W = B - A = (bx - ax, by - ay)
    # Right normal vector N = (-(by - ay), bx - ax) -> Points to "FORWARD" side
    dx = bx - ax
    dy = by - ay
    nx = -dy
    ny = dx

    # Target movement vector V = (u2 - u1, v2 - v1)
    vx = u2 - u1
    vy = v2 - v1

    dot = vx * nx + vy * ny
    crossed_direction = "FORWARD" if dot >= 0 else "REVERSE"

    # 3. Compare with configured direction constraint
    req_dir = (direction or "FORWARD").upper()
    if req_dir == "BIDIRECTIONAL":
        return True, crossed_direction, dot
    if req_dir == crossed_direction:
        return True, crossed_direction, dot

    return False, crossed_direction, dot


def compute_footpoint(
    box: list[float],
    frame_resolution: Optional[tuple[int, int]] = None,
) -> tuple[float, float]:
    """
    Computes the bottom-center anchor point (ground contact) of a bounding box.
    Normalizes to [0.0, 1.0] if frame_resolution (width, height) is provided.
    """
    x1, y1, x2, y2 = [float(v) for v in box[:4]]
    mid_x = (x1 + x2) / 2.0
    bot_y = y2

    if frame_resolution and frame_resolution[0] > 0 and frame_resolution[1] > 0:
        w, h = frame_resolution
        mid_x = max(0.0, min(1.0, mid_x / float(w)))
        bot_y = max(0.0, min(1.0, bot_y / float(h)))
    else:
        # If coordinates already appear normalized or clamped
        mid_x = max(0.0, min(1.0, mid_x))
        bot_y = max(0.0, min(1.0, bot_y))

    return mid_x, bot_y


# ─────────────────────────────────────────────────────────────────────────────
# Geofence Engine
# ─────────────────────────────────────────────────────────────────────────────

class GeofenceEngine:
    """
    Thread-safe Geofence and Tripwire evaluation service.
    Persists configuration to backend/app/data/geofences.json.
    """

    def __init__(self) -> None:
        self.lock = threading.Lock()
        self.zones: list[dict[str, Any]] = []
        self.tripwires: list[dict[str, Any]] = []

        # In-memory alert cooldowns: key -> timestamp
        # key format: "zone:{zone_id}:{track_id}" or "wire:{wire_id}:{track_id}"
        self._cooldowns: dict[str, float] = {}

        # Trajectory footpoint history: camera_id -> track_id -> (norm_x, norm_y)
        self._history: dict[str, dict[int, tuple[float, float]]] = {}

        self._load()

    def _load(self) -> None:
        """Load geofences from disk."""
        with self.lock:
            if not GEOFENCES_FILE.exists():
                self.zones = []
                self.tripwires = []
                self._save()
                return

            try:
                with open(GEOFENCES_FILE, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    self.zones = data.get("zones", [])
                    self.tripwires = data.get("tripwires", [])
                logger.info("Loaded %d zones and %d tripwires from %s", len(self.zones), len(self.tripwires), GEOFENCES_FILE.name)
            except Exception as exc:
                logger.error("Error loading geofences from %s: %s", GEOFENCES_FILE, exc)
                self.zones = []
                self.tripwires = []

    def _save(self) -> None:
        """Persist geofences to disk."""
        DATA_DIR.mkdir(parents=True, exist_ok=True)
        data = {
            "zones": self.zones,
            "tripwires": self.tripwires,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
        try:
            with open(GEOFENCES_FILE, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2)
        except Exception as exc:
            logger.error("Failed to save geofences to disk: %s", exc)

    # ── CRUD Operations ──────────────────────────────────────────────────────

    def get_all(self, camera_id: Optional[str] = None) -> dict[str, list[dict[str, Any]]]:
        with self.lock:
            if not camera_id:
                return {"zones": list(self.zones), "tripwires": list(self.tripwires)}
            filtered_zones = [z for z in self.zones if z.get("cameraId") == camera_id]
            filtered_wires = [w for w in self.tripwires if w.get("cameraId") == camera_id]
            return {"zones": filtered_zones, "tripwires": filtered_wires}

    def add_zone(self, data: dict[str, Any]) -> dict[str, Any]:
        with self.lock:
            zone_id = data.get("id") or f"zone-{uuid.uuid4().hex[:8]}"
            new_zone = {
                "id": zone_id,
                "name": data.get("name", f"Geofence Zone {zone_id}"),
                "cameraId": data.get("cameraId", "bop-jk-01"),
                "color": data.get("color", "#ef4444"),
                "severity": data.get("severity", "CRITICAL"),
                "polygon": data.get("polygon", []),
                "targetClasses": data.get("targetClasses", ["person", "car", "truck", "suspect"]),
                "enabled": bool(data.get("enabled", True)),
                "cooldownSeconds": float(data.get("cooldownSeconds", 20.0)),
                "description": data.get("description", ""),
                "createdAt": datetime.now(timezone.utc).isoformat(),
            }
            self.zones.append(new_zone)
            self._save()
            return new_zone

    def update_zone(self, zone_id: str, updates: dict[str, Any]) -> Optional[dict[str, Any]]:
        with self.lock:
            for zone in self.zones:
                if zone["id"] == zone_id:
                    for k, v in updates.items():
                        if k != "id":
                            zone[k] = v
                    zone["updatedAt"] = datetime.now(timezone.utc).isoformat()
                    self._save()
                    return dict(zone)
            return None

    def delete_zone(self, zone_id: str) -> bool:
        with self.lock:
            initial_len = len(self.zones)
            self.zones = [z for z in self.zones if z["id"] != zone_id]
            if len(self.zones) < initial_len:
                self._save()
                return True
            return False

    def add_tripwire(self, data: dict[str, Any]) -> dict[str, Any]:
        with self.lock:
            wire_id = data.get("id") or f"wire-{uuid.uuid4().hex[:8]}"
            new_wire = {
                "id": wire_id,
                "name": data.get("name", f"Tripwire {wire_id}"),
                "cameraId": data.get("cameraId", "bop-jk-01"),
                "color": data.get("color", "#dc2626"),
                "severity": data.get("severity", "CRITICAL"),
                "p1": data.get("p1", [0.1, 0.5]),
                "p2": data.get("p2", [0.9, 0.5]),
                "direction": data.get("direction", "FORWARD").upper(),
                "targetClasses": data.get("targetClasses", ["person", "suspect"]),
                "enabled": bool(data.get("enabled", True)),
                "cooldownSeconds": float(data.get("cooldownSeconds", 15.0)),
                "description": data.get("description", ""),
                "createdAt": datetime.now(timezone.utc).isoformat(),
            }
            self.tripwires.append(new_wire)
            self._save()
            return new_wire

    def update_tripwire(self, wire_id: str, updates: dict[str, Any]) -> Optional[dict[str, Any]]:
        with self.lock:
            for wire in self.tripwires:
                if wire["id"] == wire_id:
                    for k, v in updates.items():
                        if k != "id":
                            wire[k] = v
                    wire["updatedAt"] = datetime.now(timezone.utc).isoformat()
                    self._save()
                    return dict(wire)
            return None

    def delete_tripwire(self, wire_id: str) -> bool:
        with self.lock:
            initial_len = len(self.tripwires)
            self.tripwires = [w for w in self.tripwires if w["id"] != wire_id]
            if len(self.tripwires) < initial_len:
                self._save()
                return True
            return False

    # ── Evaluation & Alert Triggering ────────────────────────────────────────

    def evaluate_tracks(
        self,
        camera_id: str,
        tracked_objects: list[dict[str, Any]],
        frame_resolution: Optional[tuple[int, int]] = None,
        auto_alert: bool = True,
    ) -> list[dict[str, Any]]:
        """
        Evaluates a frame's tracked objects against all enabled zones and tripwires
        for the given camera_id.

        Args:
            camera_id: Camera identifier.
            tracked_objects: List of dicts with 'box', 'track_id', 'class_name', 'confidence', etc.
            frame_resolution: (width, height) for pixel coordinate normalization.
            auto_alert: Whether to automatically dispatch security alerts to AlertService.

        Returns:
            List of detected breach events.
        """
        now = time.time()
        breaches: list[dict[str, Any]] = []

        # Get active zones & tripwires for this camera
        with self.lock:
            def cam_match(entity_cam: Optional[str]) -> bool:
                if not entity_cam:
                    return True
                ent_s = str(entity_cam).strip().lower()
                tgt_s = str(camera_id).strip().lower()
                return ent_s == tgt_s or ent_s in tgt_s or tgt_s in ent_s

            active_zones = [z for z in self.zones if z.get("enabled", True) and cam_match(z.get("cameraId"))]
            active_wires = [w for w in self.tripwires if w.get("enabled", True) and cam_match(w.get("cameraId"))]

            # Fallback to all enabled fences if camera-specific match returned none
            if not active_zones and self.zones:
                active_zones = [z for z in self.zones if z.get("enabled", True)]
            if not active_wires and self.tripwires:
                active_wires = [w for w in self.tripwires if w.get("enabled", True)]

        if camera_id not in self._history:
            self._history[camera_id] = {}
        cam_history = self._history[camera_id]

        for obj in tracked_objects:
            box = obj.get("box", [])
            if len(box) < 4:
                continue

            track_id = obj.get("track_id", 0)
            class_name = str(obj.get("class_name", "person")).lower()
            conf = float(obj.get("confidence", 0.9))
            suspect_name = obj.get("suspect_name")

            # Footpoint normalized to [0.0, 1.0]
            curr_fp = compute_footpoint(box, frame_resolution)
            prev_fp = cam_history.get(track_id)
            cam_history[track_id] = curr_fp

            # 1. Check Virtual Geofence Polygon Breaches
            for zone in active_zones:
                target_classes = [c.lower() for c in zone.get("targetClasses", [])]
                if target_classes and class_name not in target_classes and "all" not in target_classes:
                    continue

                poly = zone.get("polygon", [])
                if len(poly) < 3:
                    continue

                if is_point_in_polygon(curr_fp[0], curr_fp[1], poly):
                    # Always register visual breach event for stream HUD and bounding box rendering
                    breach_event = {
                        "type": "zone_breach",
                        "zoneId": zone["id"],
                        "name": zone.get("name", "Restricted Perimeter"),
                        "cameraId": camera_id,
                        "trackId": track_id,
                        "className": class_name,
                        "confidence": conf,
                        "suspectName": suspect_name,
                        "footpoint": [round(curr_fp[0], 4), round(curr_fp[1], 4)],
                        "severity": zone.get("severity", "CRITICAL"),
                        "timestamp": datetime.now(timezone.utc).isoformat(),
                    }
                    breaches.append(breach_event)

                    # Debounce heavy system/database/WebSocket alert dispatch
                    cd_key = f"zone:{zone['id']}:{track_id}"
                    cooldown = float(zone.get("cooldownSeconds", 20.0))
                    last_alert_time = self._cooldowns.get(cd_key, 0.0)

                    if (now - last_alert_time) >= cooldown:
                        self._cooldowns[cd_key] = now

                        if auto_alert:
                            try:
                                alert_service.create_alert(
                                    title=f"Geofence Breach: {zone.get('name', 'Perimeter')}",
                                    location=f"Sector Grid [{camera_id}] — {zone.get('name')}",
                                    severity=zone.get("severity", "CRITICAL"),
                                    camera_id=camera_id,
                                    class_name=class_name,
                                    confidence=conf,
                                    box=box,
                                    suspect_name=suspect_name,
                                    threat_level=zone.get("severity", "CRITICAL"),
                                    category="geofence_breach",
                                    notes=f"Track #{track_id} ({class_name}) entered restricted zone. Footpoint: ({curr_fp[0]:.2f}, {curr_fp[1]:.2f})",
                                )
                            except Exception as exc:
                                logger.error("Failed to dispatch geofence alert: %s", exc)

            # 2. Check Directional Tripwire Crossings
            if prev_fp is not None:
                for wire in active_wires:
                    target_classes = [c.lower() for c in wire.get("targetClasses", [])]
                    if target_classes and class_name not in target_classes and "all" not in target_classes:
                        continue

                    p1 = wire.get("p1", [])
                    p2 = wire.get("p2", [])
                    if len(p1) < 2 or len(p2) < 2:
                        continue

                    direction = wire.get("direction", "FORWARD")
                    crossed, crossed_dir, dot = check_tripwire_crossing(
                        p1, p2, prev_fp, curr_fp, direction=direction
                    )

                    if crossed:
                        cd_key = f"wire:{wire['id']}:{track_id}"
                        cooldown = float(wire.get("cooldownSeconds", 15.0))
                        last_alert_time = self._cooldowns.get(cd_key, 0.0)

                        if (now - last_alert_time) >= cooldown:
                            self._cooldowns[cd_key] = now
                            breach_event = {
                                "type": "tripwire_crossing",
                                "wireId": wire["id"],
                                "name": wire.get("name", "Tactical Tripwire"),
                                "cameraId": camera_id,
                                "trackId": track_id,
                                "className": class_name,
                                "confidence": conf,
                                "suspectName": suspect_name,
                                "footpoint": [round(curr_fp[0], 4), round(curr_fp[1], 4)],
                                "directionCrossed": crossed_dir,
                                "requiredDirection": direction,
                                "severity": wire.get("severity", "CRITICAL"),
                                "timestamp": datetime.now(timezone.utc).isoformat(),
                            }
                            breaches.append(breach_event)

                            if auto_alert:
                                try:
                                    alert_service.create_alert(
                                        title=f"Tripwire Triggered: {wire.get('name', 'Tripwire')}",
                                        location=f"Sector Grid [{camera_id}] — {wire.get('name')}",
                                        severity=wire.get("severity", "CRITICAL"),
                                        camera_id=camera_id,
                                        class_name=class_name,
                                        confidence=conf,
                                        box=box,
                                        suspect_name=suspect_name,
                                        threat_level=wire.get("severity", "CRITICAL"),
                                        category="tripwire_crossing",
                                        notes=f"Track #{track_id} ({class_name}) traversed tripwire in {crossed_dir} direction.",
                                    )
                                except Exception as exc:
                                    logger.error("Failed to dispatch tripwire alert: %s", exc)

        return breaches

    def reset_history(self, camera_id: Optional[str] = None) -> None:
        """Clear track history and cooldowns."""
        with self.lock:
            if camera_id:
                self._history.pop(camera_id, None)
                self._cooldowns = {
                    k: v for k, v in self._cooldowns.items() if not k.startswith(f"zone:{camera_id}")
                }
            else:
                self._history.clear()
                self._cooldowns.clear()


# Global Singleton Instance
geofence_engine = GeofenceEngine()
