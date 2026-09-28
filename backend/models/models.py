    
from sqlalchemy.orm import DeclarativeBase,Mapped, mapped_column
from backend.core.database import Base









class UserSchema(Base):
    __tablename__="users"
    id:Mapped[int]=mapped_column(primary_key=True, autoincrement=True)

    username: Mapped[str] = mapped_column()
    password: Mapped[str] = mapped_column()

class HabitSchema(Base):
    __tablename__="habits"
    id:Mapped[int]=mapped_column(primary_key=True, autoincrement=True)

    habit: Mapped[str]= mapped_column()
    done: Mapped[bool] = mapped_column()
   
