"""
Cognito JWT verification.

Flow:
  1. Fetch Cognito JWKS (public keys) — cached after first call.
  2. Decode the Authorization: Bearer <token> header.
  3. Verify signature, expiry, issuer, and audience.
  4. Return the token claims as a dict.

FastAPI dependency `get_current_user` builds or fetches the User row
from the DB on every request, creating it on first login (upsert by cognito_sub).
"""

import httpx
from jose import JWTError, jwk, jwt
from jose.utils import base64url_decode
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import get_db
from app.models.user import User

_bearer = HTTPBearer()

# JWKS cache — populated once at first request
_jwks_cache: dict | None = None


def _get_jwks() -> dict:
    global _jwks_cache
    if _jwks_cache is None:
        url = (
            f"https://cognito-idp.{settings.AWS_REGION}.amazonaws.com"
            f"/{settings.COGNITO_USER_POOL_ID}/.well-known/jwks.json"
        )
        response = httpx.get(url, timeout=5)
        response.raise_for_status()
        _jwks_cache = response.json()
    return _jwks_cache


def _verify_token(token: str) -> dict:
    """Verify a Cognito JWT and return its claims."""
    try:
        # Get the key id from the token header
        headers = jwt.get_unverified_headers(token)
        kid = headers["kid"]

        # Find the matching public key in JWKS
        jwks = _get_jwks()
        key_data = next((k for k in jwks["keys"] if k["kid"] == kid), None)
        if key_data is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Public key not found.")

        # Construct public key and verify
        public_key = jwk.construct(key_data)
        message, encoded_signature = token.rsplit(".", 1)
        decoded_signature = base64url_decode(encoded_signature.encode("utf-8"))

        if not public_key.verify(message.encode("utf-8"), decoded_signature):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Signature verification failed.")

        # Decode and validate claims
        claims = jwt.decode(
            token,
            key_data,
            algorithms=["RS256"],
            audience=settings.COGNITO_CLIENT_ID,
            issuer=(
                f"https://cognito-idp.{settings.AWS_REGION}.amazonaws.com"
                f"/{settings.COGNITO_USER_POOL_ID}"
            ),
        )
        return claims

    except JWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {exc}",
        )


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer),
    db: Session = Depends(get_db),
) -> User:
    """
    FastAPI dependency — returns the User ORM row for the caller.
    Creates the row on first login (upsert by cognito_sub).
    """
    claims = _verify_token(credentials.credentials)

    cognito_sub: str = claims["sub"]
    username: str = claims.get("cognito:username", cognito_sub)
    email: str = claims.get("email", "")

    user = db.query(User).filter(User.cognito_sub == cognito_sub).first()

    if user is None:
        # First time this user hits the API — create their row
        user = User(
            cognito_sub=cognito_sub,
            username=username,
            email=email,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    return user
