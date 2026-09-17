from fastapi import FastAPI,BackgroundTasks
import time

app=FastAPI()


def sleep():
    time.sleep(3)
@app.get('/jst')
def test(bg: BackgroundTasks):
    bg.add_task(sleep)
    return {"okey:" "True"}

