from pydantic import BaseModel


class UserSchema(BaseModel):
    username:str
    password:str

class HabitSchema(BaseModel):
    name:str
    description:str
    category: str
    icon:str
    created_at:str


