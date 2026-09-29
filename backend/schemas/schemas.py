
from pydantic import BaseModel

class UserAuthSchema(BaseModel):
    username: str
    password: str

class HabitSchema(BaseModel):
    name: str
    description:str  | None=None
    category:str ="Другое"
    icon: str = "✅"
    done: bool

