import asyncio, websockets, json, os

WS_URL = os.getenv("WS_URL", "ws://localhost:8000/ws")

async def main():
    async with websockets.connect(WS_URL, ping_interval=20, ping_timeout=20) as ws:
        await ws.send(json.dumps({"type": "ping"}))
        print(await ws.recv())

if __name__ == "__main__":
    asyncio.run(main())
