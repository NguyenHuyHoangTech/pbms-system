import sys

file_path = 'pbms-fe/src/features/staff/GateInConsoleScreen.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update imports
content = content.replace(
    "import { Stage, Layer, Rect, Group, Text as KonvaText, Line, Label, Tag } from 'react-konva';",
    "import { Stage, Layer, Rect, Group, Text as KonvaText, Line, Label, Tag as KonvaTag } from 'react-konva';"
)

content = content.replace(
    "import { Stage, Layer, Rect, Group, Text as KonvaText, Line } from 'react-konva';",
    "import { Stage, Layer, Rect, Group, Text as KonvaText, Line, Label, Tag as KonvaTag } from 'react-konva';"
)

# 3. Replace <Tag with <KonvaTag
content = content.replace("<Tag fill=\"rgba", "<KonvaTag fill=\"rgba")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Done!")
