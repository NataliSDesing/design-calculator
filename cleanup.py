path = '/Users/natalias./Documents/kimi/workspace/design-calculator/src/components/Calculator.tsx'
with open(path, 'r') as f:
    lines = f.readlines()

# Remove duplicate imports (lines 17-45 are duplicates, 0-indexed: 16-44)
# Keep lines 0-15 (first 16 lines: react import, lucide import, exportDOCX, readStateFromUrl, ShareModal, data/pricing)
# Wait, let me check the exact structure:
# Lines 1-16 (0-indexed 0-15): good imports
# Lines 17-45 (0-indexed 16-44): duplicate imports
# Line 46 (0-indexed 45): empty line before serviceIcons

clean_lines = lines[:16]  # Keep first 16 lines (0-15)
# Skip duplicate lines 17-45, add from line 46 onwards
clean_lines.extend(lines[45:])  # From line 46 (empty line) to end

# Now fix servicesByCategory to include 'micro'
content = ''.join(clean_lines)
content = content.replace(
    "const grouped: Record<Category, Service[]> = { design: [], marketing: [], advertising: [], presentation: [] };",
    "const grouped: Record<Category, Service[]> = { design: [], marketing: [], advertising: [], presentation: [], micro: [] };"
)

with open(path, 'w') as f:
    f.write(content)

print('Done')
