
from pydantic import BaseModel

class UserAuthSchema(BaseModel):
    username: str
    password: str

class HabitSchema(BaseModel):
    habit: str
    done: bool

