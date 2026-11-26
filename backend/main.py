import os
from decimal import Decimal
import boto3
from botocore.exceptions import ClientError
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional

app = FastAPI(title="Synergy Cloud AI Solutions API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:3000",
        "https://d2gea04v7cw14f.cloudfront.net",
        "https://d2qqwbvm0bydyb.cloudfront.net",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def add_private_network_header(request: Request, call_next):
    response = await call_next(request)
    if request.headers.get("access-control-request-private-network") == "true":
        response.headers["Access-Control-Allow-Private-Network"] = "true"
    return response

# ── Static data ──────────────────────────────────────────────────────────────

BFSI_DATA = [
    {"c": "Banking",         "i": "🏦", "t": "Loan Origination AI",    "d": "Automates document intake, KYC checks and credit pre-scoring."},
    {"c": "Banking",         "i": "💳", "t": "Fraud Detection",         "d": "Real-time anomaly detection on card and UPI transactions."},
    {"c": "Insurance",       "i": "📄", "t": "Claims Automation",       "d": "Extracts, validates and routes claims with human-in-the-loop review."},
    {"c": "Insurance",       "i": "📈", "t": "Underwriting Assistant",  "d": "Risk summaries from policy documents using RAG."},
    {"c": "Capital Markets", "i": "📊", "t": "Portfolio Insights",      "d": "Explainable analytics dashboards for advisors."},
    {"c": "Compliance",      "i": "🛡️", "t": "Regulatory Monitor",      "d": "Tracks circulars and maps them to internal controls."},
]

# ── DynamoDB configuration ───────────────────────────────────────────────────

AWS_PROFILE = os.getenv("AWS_PROFILE", "synergies-portal")
AWS_REGION = os.getenv("AWS_DEFAULT_REGION", "ap-south-2")

def get_dynamodb_resource():
    try:
        session = boto3.Session(profile_name=AWS_PROFILE, region_name=AWS_REGION)
        return session.resource("dynamodb")
    except Exception:
        try:
            session = boto3.Session(profile_name="automated-mail-draft", region_name=AWS_REGION)
            return session.resource("dynamodb")
        except Exception:
            return boto3.resource("dynamodb", region_name=AWS_REGION)

dynamodb = get_dynamodb_resource()
intern_table = dynamodb.Table("INTERN_LIST")

def serialize_item(item):
    if isinstance(item, list):
        return [serialize_item(i) for i in item]
    elif isinstance(item, dict):
        return {k: serialize_item(v) for k, v in item.items()}
    elif isinstance(item, Decimal):
        return int(item) if item % 1 == 0 else float(item)
    return item

FAQ = {
    "what internships are open":      "Browse open roles in the Internship Portal, fetched live from our DynamoDB database.",
    "what bfsi solutions do you offer": "Loan origination AI, fraud detection, claims automation, underwriting assistant, portfolio insights and a regulatory monitor.",
    "which tech stack do you use":    "React frontend, Python FastAPI backend, and AWS cloud. Database layer is configured per deployment.",
    "how do i apply":                 "Pick a role in the Internship Portal and press Apply. All applications are free.",
}

# ── Models ───────────────────────────────────────────────────────────────────

class ChatMessage(BaseModel):
    message: str

class ApplicationPayload(BaseModel):
    role: str
    name: str
    email: str
    note: Optional[str] = ""

class InternPostRequest(BaseModel):
    intern_id: str = Field(min_length=1, max_length=50)
    title: str = Field(min_length=1, max_length=120)
    location: str = Field(min_length=1, max_length=60)
    experience_level: str = Field(min_length=1, max_length=60)
    employment_type: str = Field(min_length=1, max_length=60)
    image: Optional[str] = ""

# ── Routes ───────────────────────────────────────────────────────────────────

@app.get("/")
def root():
    return {"status": "ok", "service": "Synergy Cloud AI Solutions API"}

@app.get("/api/bfsi")
def get_bfsi():
    """Return all BFSI solution cards."""
    return BFSI_DATA

@app.get("/api/jobs")
def get_jobs(domain: Optional[str] = None, mode: Optional[str] = None, q: Optional[str] = None):
    """Return internship postings from DynamoDB table INTERN_LIST."""
    try:
        response = intern_table.scan()
        raw_items = response.get("Items", [])
        while "LastEvaluatedKey" in response:
            response = intern_table.scan(ExclusiveStartKey=response["LastEvaluatedKey"])
            raw_items.extend(response.get("Items", []))
    except Exception as e:
        print(f"[ERROR] Fetching from DynamoDB INTERN_LIST: {e}")
        return []

    results = [serialize_item(item) for item in raw_items]

    if domain and domain != "All":
        dl = domain.lower()
        results = [
            j for j in results
            if dl in str(j.get("domain", j.get("d", ""))).lower()
        ]
    if mode and mode != "All":
        ml = mode.lower()
        results = [
            j for j in results
            if ml in str(j.get("location", j.get("mode", j.get("m", "")))).lower()
        ]
    if q:
        ql = q.lower()
        results = [
            j for j in results
            if ql in str(j.get("title", j.get("t", ""))).lower()
            or ql in str(j.get("intern_id", "")).lower()
            or ql in str(j.get("employment_type", "")).lower()
            or ql in str(j.get("experience_level", "")).lower()
            or ql in str(j.get("location", "")).lower()
            or (isinstance(j.get("skills"), list) and any(ql in str(s).lower() for s in j["skills"]))
            or (isinstance(j.get("s"), list) and any(ql in str(s).lower() for s in j["s"]))
        ]
    return results

@app.post("/api/jobs", status_code=201)
def create_job(payload: InternPostRequest):
    """Create a new internship item in DynamoDB table INTERN_LIST."""
    item = {
        "intern_id": payload.intern_id.strip(),
        "title": payload.title.strip(),
        "location": payload.location.strip(),
        "experience_level": payload.experience_level.strip(),
        "employment_type": payload.employment_type.strip(),
        "image": (payload.image or "").strip(),
    }
    try:
        intern_table.put_item(
            Item=item,
            ConditionExpression="attribute_not_exists(intern_id)",
        )
    except ClientError as exc:
        error_code = exc.response.get("Error", {}).get("Code", "")
        if error_code == "ConditionalCheckFailedException":
            raise HTTPException(
                status_code=409,
                detail=f"An internship with intern_id '{item['intern_id']}' already exists in INTERN_LIST.",
            ) from exc
        raise HTTPException(
            status_code=503,
            detail="Unable to post internship to DynamoDB right now.",
        ) from exc

    return {
        "message": "Internship posted successfully",
        "intern": item,
    }

@app.post("/api/chat")
def chat(payload: ChatMessage):
    """Simple FAQ chatbot endpoint."""
    msg_lower = payload.message.lower().strip()
    for key, reply in FAQ.items():
        if any(word in msg_lower for word in key.split()):
            return {"reply": reply}
    return {"reply": "Thanks for your message! A Synergy team member will follow up shortly. (Demo mode)"}

@app.post("/api/apply")
def apply(payload: ApplicationPayload):
    """Accept internship application (demo — logs to console)."""
    print(f"[APPLICATION] Role: {payload.role} | Name: {payload.name} | Email: {payload.email}")
    return {"status": "received", "message": f"Application for '{payload.role}' received. We'll be in touch, {payload.name}!"}

@app.get("/api/stats")
def get_stats():
    """Return platform statistics."""
    return {
        "workflows_automated": 120,
        "internship_seats": 45,
        "uptime_target": 98,
        "bfsi_clients": 12,
    }

# ── Entry point ───────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
