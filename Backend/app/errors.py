"""Consistent error envelope `{ "error": { "code", "message" } }` (MASTER §3.1)."""
from __future__ import annotations

from fastapi import HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse


class ApiError(HTTPException):
    """HTTPException carrying a machine-readable code."""

    def __init__(self, status_code: int, code: str, message: str):
        super().__init__(status_code=status_code, detail=message)
        self.code = code


def _envelope(code: str, message: str) -> dict:
    return {"error": {"code": code, "message": message}}


async def api_error_handler(_: Request, exc: ApiError) -> JSONResponse:
    return JSONResponse(status_code=exc.status_code, content=_envelope(exc.code, exc.detail))


async def http_exception_handler(_: Request, exc: HTTPException) -> JSONResponse:
    code = {
        400: "bad_request",
        401: "unauthorized",
        403: "forbidden",
        404: "not_found",
        409: "conflict",
        422: "unprocessable",
    }.get(exc.status_code, "error")
    message = exc.detail if isinstance(exc.detail, str) else "Request failed."
    return JSONResponse(status_code=exc.status_code, content=_envelope(code, message))


async def validation_exception_handler(_: Request, exc: RequestValidationError) -> JSONResponse:
    return JSONResponse(
        status_code=422,
        content=_envelope("validation_error", "; ".join(e["msg"] for e in exc.errors()[:3])),
    )


# Convenience raisers
def not_found(message: str = "Not found.") -> ApiError:
    return ApiError(404, "not_found", message)


def forbidden(message: str = "Forbidden.") -> ApiError:
    return ApiError(403, "forbidden", message)


def unauthorized(message: str = "Unauthorized.") -> ApiError:
    return ApiError(401, "unauthorized", message)


def bad_request(message: str = "Bad request.") -> ApiError:
    return ApiError(400, "bad_request", message)


def unprocessable(message: str = "Unprocessable entity.") -> ApiError:
    return ApiError(422, "unprocessable", message)


def conflict(message: str = "Conflict.") -> ApiError:
    return ApiError(409, "conflict", message)
