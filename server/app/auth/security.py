from pwdlib import PasswordHash


PASSWORD_HASH = PasswordHash.recommended()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return PASSWORD_HASH.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return PASSWORD_HASH.hash(password)
