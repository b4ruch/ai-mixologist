import json

text = '{ "title": "a", "recipe": "foo\nbar" }'

try:
    data = json.loads(text, strict=False)
    print("SUCCESS strict=False:", data)
except Exception as e:
    print("FAILED strict=False:", e)

