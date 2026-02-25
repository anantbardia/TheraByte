from fastapi import WebSocket
from typing import Dict, List, Set
import json
import asyncio

class ConnectionManager:
    def __init__(self):
        # room_id -> list of active WebSockets in that room
        self.active_connections: Dict[str, List[WebSocket]] = {}
        # room_id -> AI Copilot WebSocket connection (usually the therapist)
        self.copilot_connections: Dict[str, WebSocket] = {}

    async def connect(self, websocket: WebSocket, room_id: str):
        await websocket.accept()
        if room_id not in self.active_connections:
            self.active_connections[room_id] = []
        self.active_connections[room_id].append(websocket)

    def disconnect(self, websocket: WebSocket, room_id: str):
        if room_id in self.active_connections:
            if websocket in self.active_connections[room_id]:
                self.active_connections[room_id].remove(websocket)
            if not self.active_connections[room_id]:
                del self.active_connections[room_id]

    async def broadcast_to_room(self, message: str, room_id: str, exclude: WebSocket = None):
        if room_id in self.active_connections:
            for connection in self.active_connections[room_id]:
                if connection != exclude:
                    try:
                        await connection.send_text(message)
                    except Exception:
                        pass

    # Co-pilot specific
    async def connect_copilot(self, websocket: WebSocket, room_id: str):
        await websocket.accept()
        self.copilot_connections[room_id] = websocket

    def disconnect_copilot(self, room_id: str):
        if room_id in self.copilot_connections:
            del self.copilot_connections[room_id]

    async def send_copilot_insight(self, insight_data: dict, room_id: str):
        if room_id in self.copilot_connections:
            try:
                await self.copilot_connections[room_id].send_text(json.dumps(insight_data))
            except Exception:
                pass

manager = ConnectionManager()
