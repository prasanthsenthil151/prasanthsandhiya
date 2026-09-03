import re
import os

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace PIN logic
new_logic = """if (currentPin.length === 4) {
          fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pin: currentPin })
          })
          .then(res => res.json())
          .then(data => {
            if (data.success) {
              setTimeout(() => {
                window.location.href = '/sandhiya';
              }, 250);
            } else {
              pinDots.forEach(dot => dot.classList.add('error'));
              if (secretLockerCard) secretLockerCard.classList.add('shake');
              setTimeout(() => {
                if (secretLockerCard) secretLockerCard.classList.remove('shake');
                currentPin = "";
                updatePinDots();
              }, 500);
            }
          })
          .catch(err => {
              currentPin = "";
              updatePinDots();
          });
        }"""

content = re.sub(r'if \(currentPin\.length === 4\) \{.*?\n\s{8}\}', new_logic, content, flags=re.DOTALL)

# Remove LOCKER_CODE definition
content = re.sub(r'const LOCKER_CODE = "1619";\n?', '', content)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

# Process sandhiya/index.html
with open('sandhiya/index.html', 'r', encoding='utf-8') as f:
    s_content = f.read()

s_content = re.sub(r'\n<script>\s*if \(sessionStorage\.getItem\(\'sandhiya_unlocked\'\) !== \'true\'\) \{\s*window\.location\.href = \'/\';\s*\}\s*</script>\n', '\n', s_content)

# While here, let's add a logout mechanism to sandhiya/index.html
logout_button = """
<button onclick="logout()" style="position:fixed; top:20px; right:20px; z-index:9999; padding:8px 12px; background:rgba(255,255,255,0.8); border:none; border-radius:8px; cursor:pointer; font-weight:bold; box-shadow:0 2px 10px rgba(0,0,0,0.1);">Lock 🔒</button>
<script>
function logout() {
  fetch('/api/logout', { method: 'POST' }).then(() => window.location.href = '/');
}
</script>
"""

# add it after <body>
if '<body' in s_content:
    s_content = re.sub(r'(<body[^>]*>)', r'\1' + logout_button, s_content, 1)

with open('sandhiya/index.html', 'w', encoding='utf-8') as f:
    f.write(s_content)

print("Updated HTML files.")
