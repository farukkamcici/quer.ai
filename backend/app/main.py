from fastapi import FastAPI
from app.api import query_router

app = FastAPI(
    title="Querai API",
    description="Doğal dil tabanlı veri analitiği sistemi.",
    version="0.1.0"
)
app.include_router(query_router.router, prefix="/api")

@app.get("/")
def read_root():
    return {"status": "Querai API is running."}