from fastapi import HTTPException, status

class LumiException(HTTPException):
    def __init__(self, status_code: int, detail: str):
        super().__init__(status_code=status_code, detail=detail)

class ResourceNotFoundException(LumiException):
    def __init__(self, resource: str, identifier: str = ""):
        detail = f"{resource} not found"
        if identifier:
            detail += f" with id '{identifier}'"
        super().__init__(status_code=status.HTTP_404_NOT_FOUND, detail=detail)

class ProviderConfigurationException(LumiException):
    def __init__(self, detail: str = "AI Provider is not configured properly."):
        super().__init__(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=detail)

class UnauthorizedException(LumiException):
    def __init__(self, detail: str = "Invalid credentials or session expired."):
        super().__init__(status_code=status.HTTP_401_UNAUTHORIZED, detail=detail)

class ForbiddenException(LumiException):
    def __init__(self, detail: str = "You do not have permission to access this resource."):
        super().__init__(status_code=status.HTTP_403_FORBIDDEN, detail=detail)
