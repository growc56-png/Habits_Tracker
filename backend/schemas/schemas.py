
from pydantic import BaseModel

class UsersSchema(BaseModel):
    username: str
    password: str

class HabitSchema(BaseModel):
    habit: str
    done: bool

    