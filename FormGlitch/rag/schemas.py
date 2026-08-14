from pydantic import BaseModel
from typing import List, Optional

class IngestReq(BaseModel):
    resumeBase64: str
    presetInfo: Optional[str] = ""
    resumeLink: Optional[str] = ""
    model: Optional[str] = "qwen2.5:7b-instruct"

class FieldReq(BaseModel):
    fieldId: str
    fieldLabel: str
    fieldType: str
    options: Optional[List[str]] = []

class AutofillReq(BaseModel):
    formFields: List[FieldReq]
    model: Optional[str] = "qwen2.5:7b-instruct"
