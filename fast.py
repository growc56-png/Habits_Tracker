from fastapi import FastAPI,BackgroundTasks
import time

app=FastAPI()


def sleep():
    time.sleep(3)
    print("отправлен")



@app.post('/jst')
async def test(bg: BackgroundTasks):
    bg.add_task(sleep)
    return {"okey:" "True"}

