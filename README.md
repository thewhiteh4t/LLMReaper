# LLMReaper

<p align="center">
  <img src="https://res.cloudinary.com/dg5ijxsap/image/upload/v1779852463/llmreaper_banner_new_neahso.jpg" alt="LLMReaper created by Lohitya Pushkar (thewhiteh4t)" width="100%">
</p>

<p align="center">
  <strong>Passive Conversation Exfiltration Research for Modern LLM Platforms</strong>
</p>

<p align="center">
  Chromium MV3 Extension • Real-Time DOM Capture • Secret Detection • FastAPI Backend
</p>

---

> [!WARNING]
> This project is provided strictly for security research, educational use, and defensive awareness purposes.
> Unauthorized deployment against systems, users, or environments without explicit permission may violate local laws, regulations, organizational policies, or terms of service.

## Overview

LLMReaper is a **proof-of-concept** security research demonstrating how browser extensions with standard DOM access can silently observe, capture, and scan AI platform conversations for accidentally exposed sensitive data without any special permissions, network interception, or privilege escalation.

Threat actors constantly upload malicious browser extensions mimicking the real thing and social engineer users on a large scale.

## How it works

> [!INFORMATION]
> Detailed blogpost : https://thewhiteh4t.github.io/blog/ai-chat-llmreaper/

- An unpacked chrome extension is provided which shows the **social engineering** aspect as well as the conversation capture.
- In chrome we can enable dev mode and load unpacked extensions.
- After loading the extension we can simply switch to any of the supported platforms and begin _talking_
- The extension will capture the chat in real time and will send it the backend
- A set of regex matches are used to find secrets from the conversation

## Supported Platforms

| Platform | Status       |
| -------- | ------------ |
| ChatGPT  | ✅ Supported |
| Claude   | ✅ Supported |
| Gemini   | ✅ Supported |

## Detection Coverage

The backend detection engine scans for:

- **API Keys** — OpenAI, Anthropic, AWS, GCP, Azure, GitHub, Stripe, Twilio, and more
- **Authentication Tokens** — JWTs, Bearer tokens, OAuth tokens, session cookies
- **Cloud Credentials** — AWS access key IDs, secret keys, GCP service account keys
- **Secrets and Passwords** — Common patterns in environment variables and config files
- **PII** — Email addresses, phone numbers, SSNs, credit card patterns
- **Connection Strings** — Database URIs, JDBC strings, Redis/MongoDB connection strings

## Installation

### Arch Linux

```bash
sudo pacman -S python-fastapi python-uvicorn
```

### Debian / Ubuntu

```bash
sudo apt install python3-fastapi python3-uvicorn
```

### Using pip

```bash
pip install fastapi uvicorn
```

## Usage

### Browser

- Chrome -> Three dot menu -> Extensions -> Manage extensions
- Turn on developer mode
- Load unpacked extension -> Select LLMReaper/chrome_ext directory

### Terminal

```
cd LLMReaper

python3 LLMReaper.py
```

### Demo

coming soon...

---

<p align="center">Created by <a href="https://thewhiteh4t.github.io">Lohitya Pushkar</a> (thewhiteh4t)</p>
