from dotenv import load_dotenv
from fastapi import FastAPI , HTTPException , Request , Response , status, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime, timezone
from uuid import uuid4
from botocore.exceptions import ClientError
import os
import io
import boto3
import pandas as pd
from decimal import Decimal

# --------------------------
# loading dotenv variables 
load_dotenv()
# ----------------------------


# --------------------------
# app 
app = FastAPI(title="Certificate Automation API")
# -----------------------------------------------



# --------------------------
# cors 
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5174",
        "http://localhost:5173",
        "https://d2gea04v7cw14f.cloudfront.net",
        "https://d2qqwbvm0bydyb.cloudfront.net",
        "https://chatgpt.com",
        "synergycloudai.com",
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

# --------------------------


# defining the table:

aws_profile = os.getenv("AWS_PROFILE", "automated-mail-draft")
aws_region = os.getenv("AWS_DEFAULT_REGION", "ap-south-2")

try:
    session = boto3.Session(profile_name=aws_profile, region_name=aws_region)
    dynamodb = session.resource("dynamodb")
except Exception:
    dynamodb = boto3.resource("dynamodb", region_name=aws_region)

table_name = os.getenv("CERTIFICATE_TABLE", "certificate-jobs-dev")
certificate_table = dynamodb.Table(table_name)

intern_table_name = os.getenv("INTERN_TABLE", "INTERN_LIST")
intern_table = dynamodb.Table(intern_table_name)

def serialize_item(item):
    if isinstance(item, list):
        return [serialize_item(i) for i in item]
    elif isinstance(item, dict):
        return {k: serialize_item(v) for k, v in item.items()}
    elif isinstance(item, Decimal):
        return int(item) if item % 1 == 0 else float(item)
    return item

# -------------------------------------------
# schema  defination for certificate-request =>

class CertificateRequest(BaseModel):
    student_id: str = Field(min_length=1, max_length=50)
    student_name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    internship_role: str = Field(min_length=2, max_length=100)

class CertificateValidationRequest(BaseModel):
    student_id: str = Field(min_length=1, max_length=50)
    name: str = Field(min_length=1, max_length=100)

class InternPostRequest(BaseModel):
    intern_id: str = Field(min_length=1, max_length=50)
    title: str = Field(min_length=1, max_length=120)
    location: str = Field(min_length=1, max_length=60)
    experience_level: str = Field(min_length=1, max_length=60)
    employment_type: str = Field(min_length=1, max_length=60)
    image: Optional[str] = ""

# ---------------------------------------------
# Required Intern Parameters & Validation
# ---------------------------------------------
REQUIRED_INTERN_PARAMETERS = {
    "student_id": ["student_id", "studentid", "id"],
    "student_name": ["student_name", "studentname", "name", "full_name"],
    "email": ["email", "email_id", "email_address"],
    "internship_role": ["internship_role", "intern_role", "role", "course", "course_name"],
}

def validate_excel_parameters(df: pd.DataFrame):
    """
    Validates whether the DataFrame contains the required intern parameters:
    student_id, student_name, email, internship_role.
    Returns (is_valid: bool, missing_parameters: list, matched_parameters: dict).
    """
    normalized_cols = {
        str(col).strip().lower().replace(" ", "_").replace("-", "_"): str(col)
        for col in df.columns
    }

    matched_parameters = {}
    missing_parameters = []

    for param, aliases in REQUIRED_INTERN_PARAMETERS.items():
        matched_col = next((normalized_cols[alias] for alias in aliases if alias in normalized_cols), None)
        if matched_col:
            matched_parameters[param] = matched_col
        else:
            missing_parameters.append(param)

    is_valid = len(missing_parameters) == 0
    return is_valid, missing_parameters, matched_parameters

# ---------------------------------------------
# Console Logger Helper (12-hour format)
# ---------------------------------------------
def log_task(endpoint: str, work_done: str):
    timestamp = datetime.now().strftime("%I:%M:%S %p")
    print(f"[{timestamp}] [{endpoint}] Work Done: {work_done}", flush=True)

#----------------------------------------------------------------- 
# Backend port assignment
BACKEND_PORT = int(os.getenv("BACKEND_PORT", 8000))
B_port=BACKEND_PORT
# -----------------------------------------------------------------
@app.get("/favicon.ico", include_in_schema=False)
async def favicon():
    log_task("GET /favicon.ico", "Served browser favicon request (204 No Content)")
    return Response(status_code=status.HTTP_204_NO_CONTENT)

@app.get("/")
def root():
    is_valid_port = isinstance(B_port, int) and 1 <= B_port <= 65535

    if is_valid_port:
        log_task("GET /", f"Checked system status on port {B_port} - Backend is operational")
        return {
            "status": "running",
            "message": f"synergies Backend is working perfectly and running on {B_port}"
        }
    else:
        log_task("GET /", f"Port validation error - Invalid backend port: {B_port}")
        return {
            "status": "error",
            "message": f"Invalid backend port: {B_port}. Check your .env configuration."
        }

@app.get("/health")
def health_check():
    log_task("GET /health", "Verified API health status - Synergy API is healthy")
    return {"status": "The synergies api is healthy"}


@app.post("/certificates/validate")
def validate_certificate(request: CertificateValidationRequest):
    student_id = request.student_id.strip()
    user_name = request.name.strip()

    try:
        response = certificate_table.scan()
        items = response.get("Items", [])
        while "LastEvaluatedKey" in response:
            response = certificate_table.scan(ExclusiveStartKey=response["LastEvaluatedKey"])
            items.extend(response.get("Items", []))
    except ClientError as exc:
        log_task("POST /certificates/validate", f"DynamoDB ClientError encountered: {exc.response['Error']['Code']}")
        raise HTTPException(
            status_code=503,
            detail="Certificate validation is temporarily unavailable.",
        ) from exc

    # Search with student_id and name
    matched_item = next(
        (
            item for item in items
            if str(item.get("student_id", "")).strip().lower() == student_id.lower()
            and str(item.get("student_name", item.get("name", ""))).strip().lower() == user_name.lower()
        ),
        None,
    )

    if not matched_item:
        log_task("POST /certificates/validate", f"Validation Failed: Student '{user_name}' (ID: '{student_id}') not found in database records")
        raise HTTPException(
            status_code=404,
            detail="User with the provided student ID and name is not present in our portal",
        )

    res_name = matched_item.get("student_name") or matched_item.get("name") or user_name
    res_course = matched_item.get("internship_role") or matched_item.get("course_name") or matched_item.get("course") or "N/A"
    res_status = matched_item.get("status", "VALID")
    res_cert_id = matched_item.get("certificate_id")

    log_task("POST /certificates/validate", f"Validation Successful: Verified student '{res_name}' (ID: '{matched_item.get('student_id', student_id)}', Course: '{res_course}', Certificate ID: '{res_cert_id}')")

    return {
        "message": "THE USER IS PRESENT IN OUR PORTAL AND A VALID USER",
        "student_id": matched_item.get("student_id", student_id),
        "name": res_name,
        "course_name": res_course,
        "status": res_status,
        "certificate_id": res_cert_id,
    }

@app.post("/certificates", status_code=201)
def register_certificate(request: CertificateRequest):
    certificate_id = str(uuid4())
    created_at = datetime.now(timezone.utc).isoformat()

    item = {
        "certificate_id": certificate_id,
        "student_id": request.student_id,
        "student_name": request.student_name,
        "email": str(request.email),
        "internship_role": request.internship_role,
        "status": "PENDING",
        "created_at": created_at,
    }

    try:
        certificate_table.put_item(
            Item=item,
            ConditionExpression="attribute_not_exists(certificate_id)",
        )
    except ClientError as exc:
        log_task("POST /certificates", f"DynamoDB ClientError: Failed to register certificate for student '{request.student_name}'")
        raise HTTPException(
            status_code=503,
            detail="Certificate registration is temporarily unavailable.",
        ) from exc

    log_task("POST /certificates", f"Registered new certificate job for student '{request.student_name}' (ID: '{request.student_id}', Role: '{request.internship_role}', Certificate ID: '{certificate_id}') - Saved to DynamoDB table '{table_name}'")

    return {
        "message": "Certificate job registered successfully",
        "certificate": item,
    }

@app.post("/certificates/upload")
@app.post("/upload-excel")
async def upload_excel_sheet(file: UploadFile = File(...)):
    filename = file.filename or "unknown"
    lower_name = filename.lower()

    if not lower_name.endswith((".xlsx", ".xls", ".csv")):
        log_task("POST /certificates/upload", f"Upload Rejected: File '{filename}' has invalid extension. Only .xlsx, .xls, and .csv are supported. Please enter a valid excel sheet.")
        raise HTTPException(
            status_code=400,
            detail="Invalid file format. Please upload a valid Excel sheet (.xlsx, .xls) or CSV file.",
        )

    contents = await file.read()
    size_bytes = len(contents)

    if size_bytes == 0:
        log_task("POST /certificates/upload", f"Upload Rejected: File '{filename}' is empty. Please enter a valid excel sheet.")
        raise HTTPException(
            status_code=400,
            detail="Uploaded file is empty. Please enter a valid excel sheet with intern data.",
        )

    # Read sheet into pandas DataFrame
    try:
        if lower_name.endswith(".csv"):
            df = pd.read_csv(io.BytesIO(contents))
        else:
            df = pd.read_excel(io.BytesIO(contents))
    except Exception as exc:
        log_task("POST /certificates/upload", f"Parsing Error: Could not read sheet '{filename}'. Error: {str(exc)}. Please enter a valid excel sheet.")
        raise HTTPException(
            status_code=400,
            detail=f"Unable to read the uploaded sheet. Please enter a valid excel sheet. (Error: {str(exc)})",
        ) from exc

    # Validate required intern parameters
    is_valid, missing_parameters, matched_parameters = validate_excel_parameters(df)

    if not is_valid:
        detected_columns = [str(c) for c in df.columns]
        missing_str = ", ".join(missing_parameters)
        log_task(
            "POST /certificates/upload",
            f"Validation FAILED: Sheet '{filename}' is missing required intern parameters: [{missing_str}]. Detected columns: {detected_columns}. Please enter a valid excel sheet."
        )
        raise HTTPException(
            status_code=400,
            detail=(
                f"Validation Failed: Uploaded sheet is missing required intern parameter(s): [{missing_str}]. "
                f"Detected columns: {detected_columns}. "
                f"Please enter a valid excel sheet containing: student_id, student_name, email, and internship_role."
            ),
        )

    row_count = len(df)
    log_task(
        "POST /certificates/upload",
        f"Validation PASSED: Excel sheet '{filename}' contains all required intern parameters {list(REQUIRED_INTERN_PARAMETERS.keys())}. "
        f"Processed {row_count} student record(s). Upload accepted."
    )

    return {
        "status": "success",
        "message": f"Backend received the excel sheet successfully after uploading: {filename}",
        "filename": filename,
        "size_bytes": size_bytes,
        "row_count": row_count,
        "required_parameters_matched": matched_parameters,
        "detected_columns": [str(c) for c in df.columns],
    }

# -------------------------------------------------------------
# Main Portal Shared Endpoints (BFSI, Jobs, Chatbot)
# -------------------------------------------------------------
BFSI_DATA = [
    {"c": "Banking",         "i": "🏦", "t": "Loan Origination AI",    "d": "Automates document intake, KYC checks and credit pre-scoring."},
    {"c": "Banking",         "i": "💳", "t": "Fraud Detection",         "d": "Real-time anomaly detection on card and UPI transactions."},
    {"c": "Insurance",       "i": "📄", "t": "Claims Automation",       "d": "Extracts, validates and routes claims with human-in-the-loop review."},
    {"c": "Insurance",       "i": "📈", "t": "Underwriting Assistant",  "d": "Risk summaries from policy documents using RAG."},
    {"c": "Capital Markets", "i": "📊", "t": "Portfolio Insights",      "d": "Explainable analytics dashboards for advisors."},
    {"c": "Compliance",      "i": "🛡️", "t": "Regulatory Monitor",      "d": "Tracks circulars and maps them to internal controls."},
]

class ChatPayload(BaseModel):
    message: str

FAQ = {
    "what internships are open": "We have 8 roles open across AI, Backend, Frontend, Cloud, Analytics and Quality. Use the filters in the Internship Portal.",
    "what bfsi solutions do you offer": "Loan origination AI, fraud detection, claims automation, underwriting assistant, portfolio insights and a regulatory monitor.",
    "which tech stack do you use": "React frontend, Python FastAPI backend, and AWS cloud. Database layer is configured per deployment.",
    "how do i apply": "Pick a role in the Internship Portal and press Apply. All applications are free.",
}

@app.get("/api/bfsi")
def get_bfsi():
    log_task("GET /api/bfsi", f"Returned {len(BFSI_DATA)} BFSI solution cards to client")
    return BFSI_DATA

@app.get("/api/jobs")
def get_jobs(domain: Optional[str] = None, mode: Optional[str] = None, q: Optional[str] = None):
    try:
        response = intern_table.scan()
        raw_items = response.get("Items", [])
        while "LastEvaluatedKey" in response:
            response = intern_table.scan(ExclusiveStartKey=response["LastEvaluatedKey"])
            raw_items.extend(response.get("Items", []))
    except Exception as exc:
        log_task("GET /api/jobs", f"Error scanning DynamoDB table '{intern_table_name}': {str(exc)}")
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
    log_task("GET /api/jobs", f"Returned {len(results)} intern items from DynamoDB '{intern_table_name}'")
    return results

@app.post("/api/jobs", status_code=201)
def create_job(payload: InternPostRequest):
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
            log_task("POST /api/jobs", f"Duplicate intern_id '{item['intern_id']}' rejected")
            raise HTTPException(
                status_code=409,
                detail=f"An internship with intern_id '{item['intern_id']}' already exists in INTERN_LIST.",
            ) from exc
        log_task("POST /api/jobs", f"DynamoDB ClientError while posting internship: {error_code}")
        raise HTTPException(
            status_code=503,
            detail="Unable to post internship to DynamoDB right now.",
        ) from exc

    log_task("POST /api/jobs", f"Posted internship '{item['title']}' (ID: '{item['intern_id']}') to DynamoDB '{intern_table_name}'")
    return {
        "message": "Internship posted successfully",
        "intern": item,
    }

@app.post("/api/chat")
def chat_endpoint(payload: ChatPayload):
    msg_lower = payload.message.lower().strip()
    for key, reply in FAQ.items():
        if any(word in msg_lower for word in key.split()):
            log_task("POST /api/chat", f"Matched FAQ key '{key}'")
            return {"reply": reply}
    log_task("POST /api/chat", f"Processed message: '{payload.message[:30]}...' (Default reply)")
    return {"reply": "Thanks for your message! A Synergy team member will follow up shortly."}