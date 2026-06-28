import os, re

def replace_non_ascii_strings(content):
    # Regex to find all string literals
    def replacer(match):
        s = match.group(1)
        if not all(ord(c) < 128 for c in s):
            # Check context from the line if possible, or just return generic
            if 'success' in content[max(0, match.start()-30):match.start()].lower():
                return '"Success"'
            elif 'error' in content[max(0, match.start()-30):match.start()].lower():
                if ':' in s:
                    return '"Error: "'
                return '"Error"'
            elif 'throw' in content[max(0, match.start()-50):match.start()].lower():
                if ':' in s:
                    return '"Error occurred: "'
                return '"An error occurred"'
            else:
                return '"Updated successfully"'
        return match.group(0)
    
    return re.sub(r'\"(.*?)\"', replacer, content)

directory = 'd:/0_Semester_5/pbms-system/pbms-be/src/main/java/com/pbms'
for root, _, files in os.walk(directory):
    for f in files:
        if f.endswith('.java'):
            path = os.path.join(root, f)
            with open(path, 'r', encoding='utf-8', errors='ignore') as file:
                content = file.read()
            
            new_content = replace_non_ascii_strings(content)
            
            if new_content != content:
                with open(path, 'w', encoding='utf-8') as file:
                    file.write(new_content)
                print(f"Fixed {path}")

