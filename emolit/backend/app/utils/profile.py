def is_profile_complete(profile: dict) -> bool:
    if not profile:
        return False

    required_fields = [
        "age",
        "gender",
        "usage_goal",
        "experience_level"
    ]

    return all(profile.get(field) for field in required_fields)
