from datetime import date


def _payload(item_type, name, description):
    return {
        "item_type": item_type,
        "name": name,
        "category": "Other",
        "description": description,
        "item_date": date.today().isoformat(),
        "location": "Lecture Hall A",
        "contact_name": "tscheck",
        "contact_email": "",
        "student_id": "",
        "storage_location": "tscheck desk" if item_type == "found" else "",
    }


def test_created_pair_is_scored_and_can_be_returned(client):
    lost = client.post("/items/", json=_payload("lost", "tscheck-matcher-item", "silver sticker marker"))
    found = client.post("/items/", json=_payload("found", "tscheck-matcher-item", "silver sticker marker"))
    assert lost.status_code == 201, lost.text
    assert found.status_code == 201, found.text
    lost_id, found_id = lost.json()["id"], found.json()["id"]
    matches = client.get("/items/matches")
    assert matches.status_code == 200
    pair = next((m for m in matches.json()["matches"] if {m["lost_item"]["id"], m["found_item"]["id"]} == {lost_id, found_id}), None)
    assert pair is not None
    assert pair["confidence"] >= 35
    returned = client.patch(f"/items/{found_id}/status", json={"status": "returned"})
    assert returned.status_code == 200, returned.text
    assert returned.json()["status"] == "returned"
