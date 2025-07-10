import requests
from backend import get_how_we_got_here_markdown, gemini_response

# response = requests.get(
#     "http://localhost:8000/api/branches",
#     params={"repo_url": "https://github.com/beng2004/PersonalWebsite"}
# )
# print(response.json())

# # response = requests.get(
# #     "http://localhost:8000/api/evolution-summary",
# #     params={
# #         "repo_url": "https://github.com/beng2004/PersonalWebsite",
# #         "branch": "main"
# #     }
# # )
# # print(response.json())

# markdown = get_how_we_got_here_markdown(
#     repo_url="https://github.com/beng2004/PersonalWebsite",
#     branch="main",
#     gemini_response=gemini_response
# )

# print(markdown)

test_markdown = """# Test Documentation Page

## Overview
This is a test page created via API to verify our Confluence integration.

## Features
- **Bold text** formatting
- *Italic text* formatting
- `Inline code` formatting

## Code Example
```python
def hello_world():
    print("Hello from Confluence API!")
    return "Success"
```

## List Items
- First item
- Second item
- Third item

## Numbered List
1. Step one
2. Step two
3. Step three

## Conclusion
If you can see this page in Confluence, the API integration is working correctly!
"""

response = requests.post(
    "http://localhost:8000/api/save-markdown-to-confluence",
    json={
        "title": "API Test Page",
        "markdown_content": test_markdown
    }
)
print("Save Markdown Response:", response.json())