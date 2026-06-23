import os
import re

root_dir = r"d:\0_Semester_5\pbms-system\pbms-be\src\main\java\com\pbms"

for dirpath, dirnames, filenames in os.walk(root_dir):
    for filename in filenames:
        if filename.endswith(".java") and filename != "TimeProvider.java":
            filepath = os.path.join(dirpath, filename)
            with open(filepath, "r", encoding="utf-8") as f:
                content = f.read()
            
            if "LocalDateTime.now()" in content:
                # Replace LocalDateTime.now()
                new_content = content.replace("LocalDateTime.now()", "com.pbms.common.utils.TimeProvider.now()")
                
                with open(filepath, "w", encoding="utf-8") as f:
                    f.write(new_content)
                print(f"Updated {filepath}")
