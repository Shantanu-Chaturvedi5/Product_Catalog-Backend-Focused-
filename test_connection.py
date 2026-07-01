import asyncio
import socket
import asyncpg

HOST = "ep-green-forest-ah4mj3sp.c-3.us-east-1.aws.neon.tech"

print("Host:", HOST)

try:
    print(socket.getaddrinfo(HOST, 5432))
except Exception as e:
    print("Socket error:", e)

async def main():
    conn = await asyncpg.connect(
        host=HOST,
        database="neondb",
        user="neondb_owner",
        password="npg_TdCQ5ePSK3Nf",
        ssl="require"
    )
    print("Connected!")

asyncio.run(main())