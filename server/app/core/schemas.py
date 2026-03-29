from sqlmodel import SQLModel


# Generic message
class Message(SQLModel):
    message: str


class TranslateOutput(SQLModel):
    result_en: str
    result_de: str
    result_hu: str
