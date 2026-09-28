import asyncio
import time

async def okak(seconds: int):
    print(f"Начинаю спать на {seconds} ")
    await asyncio.sleep(seconds)
    print(f"Завершил спать на {seconds}")


async def main():
    task1=asyncio.create_task(okak(2))
    task2=asyncio.create_task(okak(5))

    await asyncio.gather(task1,task2)


asyncio.run(main())