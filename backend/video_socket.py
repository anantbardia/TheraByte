from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict, List
import json
import asyncio
import api_services

router = APIRouter()

# --- WebRTC Signaling Manager ---
class SignalingManager:
    def __init__(self):
        # roomId -> { clientId: WebSocket }
        self.rooms: Dict[str, Dict[str, WebSocket]] = {}

    async def connect(self, websocket: WebSocket, room_id: str, client_id: str):
        await websocket.accept()
        if room_id not in self.rooms:
            self.rooms[room_id] = {}
        self.rooms[room_id][client_id] = websocket

    def disconnect(self, room_id: str, client_id: str):
        if room_id in self.rooms and client_id in self.rooms[room_id]:
            del self.rooms[room_id][client_id]
            if not self.rooms[room_id]:
                del self.rooms[room_id]

    async def broadcast(self, room_id: str, sender_id: str, message: dict):
        if room_id in self.rooms:
            for c_id, ws in self.rooms[room_id].items():
                if c_id != sender_id:
                    try:
                        await ws.send_text(json.dumps(message))
                    except Exception as e:
                        print(f"Error broadcasting signaling: {e}")

signaling_manager = SignalingManager()

@router.websocket("/ws/signaling/{room_id}/{client_id}")
async def signaling_endpoint(websocket: WebSocket, room_id: str, client_id: str):
    await signaling_manager.connect(websocket, room_id, client_id)
    # Broadcast that this peer just joined to trigger WebRTC offer
    await signaling_manager.broadcast(room_id, client_id, {"type": "peer-joined", "client_id": client_id})
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            # Broadcast offer, answer, ice-candidate
            await signaling_manager.broadcast(room_id, client_id, message)
    except WebSocketDisconnect:
        signaling_manager.disconnect(room_id, client_id)
        await signaling_manager.broadcast(room_id, client_id, {"type": "peer-left", "client_id": client_id})

# --- Copilot Manager ---
class CopilotManager:
    def __init__(self):
        # roomId -> [WebSockets]
        self.active_connections: Dict[str, List[WebSocket]] = {}
        # roomId -> full transcript so far
        self.transcripts: Dict[str, str] = {}

    async def connect(self, websocket: WebSocket, room_id: str):
        await websocket.accept()
        if room_id not in self.active_connections:
            self.active_connections[room_id] = []
        self.active_connections[room_id].append(websocket)
        if room_id not in self.transcripts:
            self.transcripts[room_id] = ""

    def disconnect(self, websocket: WebSocket, room_id: str):
        if room_id in self.active_connections:
            try:
                self.active_connections[room_id].remove(websocket)
            except ValueError:
                pass
            if not self.active_connections[room_id]:
                del self.active_connections[room_id]

    async def broadcast(self, room_id: str, message: dict):
        if room_id in self.active_connections:
            for ws in self.active_connections[room_id]:
                try:
                    await ws.send_text(json.dumps(message))
                except Exception as e:
                    print(f"Error broadcasting copilot insight: {e}")

copilot_manager = CopilotManager()

@router.websocket("/ws/copilot/{room_id}")
async def copilot_endpoint(websocket: WebSocket, room_id: str):
    await copilot_manager.connect(websocket, room_id)
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            if message.get("type") == "transcript":
                text = message.get("text", "")
                role = message.get("role", "unknown")
                if text:
                    # Append to full transcript
                    copilot_manager.transcripts[room_id] += f"\n{role}: {text}"
                    
                    # Generate live insights
                    insights = api_services.generate_live_copilot_insights(text)
                    if insights and "error" not in insights:
                        await copilot_manager.broadcast(room_id, {
                            "type": "insight",
                            "data": insights
                        })
                        
            elif message.get("type") == "session_complete":
                # Generate full report
                full_transcript = copilot_manager.transcripts.get(room_id, "")
                if full_transcript.strip():
                    report = api_services.analyze_consultation(full_transcript)
                    if report and "error" not in report:
                        await copilot_manager.broadcast(room_id, {
                            "type": "comprehensive_report",
                            "data": report
                        })
                
    except WebSocketDisconnect:
        copilot_manager.disconnect(websocket, room_id)
