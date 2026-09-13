from abc import ABC, abstractmethod

from app.schemas.domain import Alert, StoreAvailability


class NotificationProvider(ABC):
    @abstractmethod
    async def send(self, alert: Alert, result: StoreAvailability) -> None: ...


class LoggingNotificationProvider(NotificationProvider):
    """MVP boundary: deliberately does not send external messages."""

    async def send(self, alert: Alert, result: StoreAvailability) -> None:
        return None
