from app.providers.mock.catalog import CATALOG, search_catalog


def test_catalog_is_scoped_to_current_pro_iphones() -> None:
    assert [product.name for product in CATALOG] == [
        "iPhone 18 Pro",
        "iPhone 18 Pro Max",
    ]
    assert all(len(product.variants) == 16 for product in CATALOG)
    assert {
        variant.attributes["Color"]
        for product in CATALOG
        for variant in product.variants
    } == {"Black", "Silver", "Glacier", "Burgundy"}
    assert {
        variant.attributes["Storage"]
        for product in CATALOG
        for variant in product.variants
    } == {"256GB", "512GB", "1TB", "2TB"}


def test_broad_and_model_specific_iphone_searches() -> None:
    assert len(search_catalog("iPhone")) == 2
    assert len(search_catalog("all iphones")) == 2
    assert [product.name for product in search_catalog("max")] == [
        "iPhone 18 Pro Max"
    ]
