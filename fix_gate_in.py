import sys

file_path = 'pbms-fe/src/features/staff/GateInConsoleScreen.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update imports
content = content.replace(
    "import { Stage, Layer, Rect, Group, Text as KonvaText, Line } from 'react-konva';",
    "import { Stage, Layer, Rect, Group, Text as KonvaText, Line, Label, Tag } from 'react-konva';"
)

# 2. Extract the Zone Rendering block and modify it
old_zone = """
                            <KonvaText
                              x={5}
                              y={5}
                              text={`${zone.name || zone.zoneName} ${zone.activeReservationsCount ? `(Res: ${zone.activeReservationsCount})` : ''}`}
                              fontSize={14}
                              fontFamily="sans-serif"
                              fill="#334155"
                              fontStyle="bold"
                            />
"""

if old_zone in content:
    content = content.replace(old_zone, "")
else:
    print("Old zone text not found!")

# 3. Add the Label at the end of the Group
old_end_group = """                                  </Group>
                                );
                              })}
                            </Group>"""

new_end_group = """                                  </Group>
                                );
                              })}
                              {/* Zone Name Top-Left (Inside) */}
                              <Label x={5} y={5} listening={false}>
                                <Tag fill="rgba(255, 255, 255, 0.85)" cornerRadius={4} />
                                <KonvaText
                                  text={`${zone.name || zone.zoneName} ${zone.activeReservationsCount ? `(Res: ${zone.activeReservationsCount})` : ''}`}
                                  fontSize={14}
                                  fontFamily="sans-serif"
                                  fill="#334155"
                                  fontStyle="bold"
                                  padding={4}
                                />
                              </Label>
                            </Group>"""

content = content.replace(old_end_group, new_end_group)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Done!")
