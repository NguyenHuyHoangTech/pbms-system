import os, re, json

directory = 'd:/0_Semester_5/pbms-system/pbms-be/src/main/java/com/pbms'
results = {}

for root, _, files in os.walk(directory):
    for f in files:
        if f.endswith('.java'):
            path = os.path.join(root, f)
            with open(path, 'r', encoding='utf-8', errors='ignore') as file:
                lines = file.readlines()
                for i, line in enumerate(lines):
                    # Find all string literals
                    strings = re.findall(r'\"(.*?)\"', line)
                    for s in strings:
                        # Check if it contains non-ascii characters
                        if not all(ord(c) < 128 for c in s):
                            if path not in results:
                                results[path] = []
                            results[path].append({'line': i+1, 'string': s, 'original_line': line.strip()})

with open('non_ascii_strings.json', 'w', encoding='utf-8') as out:
    json.dump(results, out, indent=2, ensure_ascii=False)
