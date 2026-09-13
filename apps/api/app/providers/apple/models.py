from pydantic import BaseModel, Field


class ApplePickupQuote(BaseModel):
    store_number: str
    store_name: str
    address: str
    city: str
    region: str
    postal_code: str
    distance_miles: float = 0
    pickup_display: str = ""
    pickup_search_quote: str = ""
    pickup_type: str = ""
    part_number: str
    raw: dict[str, object] = Field(default_factory=dict, exclude=True)
