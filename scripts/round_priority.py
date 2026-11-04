"""Deterministic seat ordering for the prototype's round settlement."""

SEATS = ("A", "B", "NPC")


def priority_order(round_id: int) -> tuple[str, ...]:
    if round_id < 1:
        raise ValueError("round_id starts at 1")
    i = (((round_id - 1) // 3) + ((round_id - 1) % 3)) % len(SEATS)
    return SEATS[i:] + SEATS[:i]
