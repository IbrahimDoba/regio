import random
import string

def generate_user_code() -> str:
    """
    Generates a random 5-character code (1 letter + 4 digits).
    Example: K4921
    """
    letter = random.choice(string.ascii_uppercase)
    digits = "".join(random.choices(string.digits, k=4))
    return f"{letter}{digits}"
