from app.schemas.domain import Product, ProductVariant


def variant(product_id: str, sku: str, price: float, **attributes: str) -> ProductVariant:
    return ProductVariant(
        id=f"var-{sku.lower()}",
        product_id=product_id,
        sku=sku,
        part_number=sku,
        price=price,
        attributes=attributes,
    )


FINISH_CODES = {
    "Black": "BK",
    "Silver": "SV",
    "Glacier": "GL",
    "Burgundy": "BU",
}


def iphone_variants(
    product_id: str,
    sku_prefix: str,
    prices: dict[str, float],
) -> list[ProductVariant]:
    return [
        variant(
            product_id,
            f"{sku_prefix}-{storage.upper()}-{finish_code}",
            price,
            Color=finish,
            Storage=storage,
        )
        for finish, finish_code in FINISH_CODES.items()
        for storage, price in prices.items()
    ]


CATALOG = [
    Product(
        id="iphone-18-pro",
        name="iPhone 18 Pro",
        category="iPhone",
        description="A20 Pro, a 48MP Fusion camera with variable aperture, and pro performance.",
        product_url="https://www.apple.com/iphone-18-pro/",
        variants=iphone_variants(
            "iphone-18-pro",
            "IPH18P",
            {"256GB": 1199, "512GB": 1399, "1TB": 1799, "2TB": 2399},
        ),
    ),
    Product(
        id="iphone-18-pro-max",
        name="iPhone 18 Pro Max",
        category="iPhone",
        description="A 6.9-inch display and the longest battery life in an iPhone.",
        product_url="https://www.apple.com/iphone-18-pro/",
        variants=iphone_variants(
            "iphone-18-pro-max",
            "IPH18PM",
            {"256GB": 1299, "512GB": 1499, "1TB": 1899, "2TB": 2499},
        ),
    ),
]


def search_catalog(query: str) -> list[Product]:
    needle = query.casefold().strip()
    if not needle or needle in {"iphone", "iphones", "all iphone", "all iphones"}:
        return CATALOG
    return [
        product
        for product in CATALOG
        if needle in product.name.casefold() or needle in product.category.casefold()
    ]


def find_variant(product_or_variant_id: str) -> ProductVariant | None:
    for product in CATALOG:
        for item in product.variants:
            if item.id == product_or_variant_id:
                return item
        if product.id == product_or_variant_id:
            return product.variants[0] if product.variants else None
    return None
