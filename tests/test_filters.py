def test_category_filter(
    client
):

    response = client.get(
        "/products?category=Books"
    )

    assert response.status_code == 200