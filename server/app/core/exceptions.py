class FileUploadError(Exception):
    """Raised when a file upload to object storage fails."""

    def __init__(self, detail: str = "File upload failed."):
        self.detail = detail
        super().__init__(self.detail)
