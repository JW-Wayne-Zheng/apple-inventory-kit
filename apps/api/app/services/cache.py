from __future__ import annotations

import asyncio
import json
from dataclasses import dataclass
from time import monotonic

from redis.asyncio import Redis


class CacheBackend:
    async def get(self, key: str) -> str | None:
        raise NotImplementedError

    async def set(self, key: str, value: str, ttl: int) -> None:
        raise NotImplementedError

    async def close(self) -> None:
        return None


class MemoryCache(CacheBackend):
    def __init__(self) -> None:
        self._values: dict[str, tuple[float, str]] = {}
        self._lock = asyncio.Lock()

    async def get(self, key: str) -> str | None:
        async with self._lock:
            item = self._values.get(key)
            if not item:
                return None
            expires_at, value = item
            if monotonic() >= expires_at:
                self._values.pop(key, None)
                return None
            return value

    async def set(self, key: str, value: str, ttl: int) -> None:
        async with self._lock:
            self._values[key] = (monotonic() + ttl, value)


class RedisCache(CacheBackend):
    def __init__(self, redis: Redis) -> None:
        self.redis = redis

    async def get(self, key: str) -> str | None:
        value = await self.redis.get(key)
        return value.decode() if isinstance(value, bytes) else value

    async def set(self, key: str, value: str, ttl: int) -> None:
        await self.redis.set(key, value, ex=ttl)

    async def close(self) -> None:
        await self.redis.aclose()


@dataclass
class CacheEnvelope:
    payload: str
    fresh: bool

    def encode(self) -> str:
        return json.dumps({"payload": self.payload, "fresh": self.fresh})
