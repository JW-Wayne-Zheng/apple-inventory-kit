from app.api.routes.availability import _event


def test_event_formats_named_server_sent_event() -> None:
    assert _event("availability", '{"provider":"mock"}') == (
        'event: availability\ndata: {"provider":"mock"}\n\n'
    )
