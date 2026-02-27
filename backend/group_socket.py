from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict, List
import database
from core.therabyte import analyze_risk_score
import json

router = APIRouter()

# Store active websocket connections per group
# Format: { "group_id": [WebSocket1, WebSocket2, ...] }
active_connections: Dict[str, List[WebSocket]] = {}

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, group_id: str):
        await websocket.accept()
        if group_id not in self.active_connections:
            self.active_connections[group_id] = []
        self.active_connections[group_id].append(websocket)

    def disconnect(self, websocket: WebSocket, group_id: str):
        if group_id in self.active_connections:
            self.active_connections[group_id].remove(websocket)

    async def broadcast(self, message: dict, group_id: str):
        if group_id in self.active_connections:
            for connection in self.active_connections[group_id]:
                await connection.send_text(json.dumps(message))

manager = ConnectionManager()

@router.get("/api/groups")
def get_groups():
    """Returns the list of available peer support groups."""
    return database.get_groups()

@router.get("/api/groups/{group_id}/messages")
def get_group_messages(group_id: str):
    """Returns past messages for a specific group."""
    return database.get_group_messages(group_id)

@router.websocket("/ws/groups/{group_id}")
async def websocket_endpoint(websocket: WebSocket, group_id: str, user_id: str):
    await manager.connect(websocket, group_id)
    try:
        while True:
            data = await websocket.receive_text()
            
            # --- AI Moderation Layer ---
            # Instead of broadcasting immediately, we run the message through our ML risk models.
            # If the user is in severe crisis, we intercept the message.
            risk_data = analyze_risk_score([{"role": "user", "content": data}])
            
            if risk_data.get("combined_score", 0) > 80 or "CRISIS" in risk_data.get("flags", []):
                # Intercepted! Send a private message back to the sender ONLY.
                crisis_response = {
                    "type": "system_alert",
                    "content": "Your message was not sent to the group because it indicates you might be in crisis. Please return to the 1-on-1 TheraByte chat for immediate support, or use the helpline toolkit.",
                    "author_name": "TheraByte Moderator",
                    "user_id": "system"
                }
                await websocket.send_text(json.dumps(crisis_response))
                continue # Do not save or broadcast

            # Normal message: Save to DB and broadcast
            database.add_group_message(group_id, user_id, data)
            user_info = database.get_user(user_id)
            nickname = user_info['nickname'] if user_info else f"anon-{user_id[:4]}"

            broadcast_msg = {
                "type": "chat_message",
                "content": data,
                "author_name": nickname,
                "user_id": user_id
            }
            await manager.broadcast(broadcast_msg, group_id)

    except WebSocketDisconnect:
        manager.disconnect(websocket, group_id)
