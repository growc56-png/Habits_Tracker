
from pydantic import BaseModel

class UserAuthSchema(BaseModel):
    username: str
    password: str

class HabitSchema(BaseModel):
    habitname: str
    description:str = " "
    category:str ="Другое"
    icon: str = "✅"
    done: bool =False
