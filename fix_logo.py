import sys

path = '/Users/natalias./Documents/kimi/workspace/design-calculator/src/components/Calculator.tsx'
with open(path, 'r') as f:
    content = f.read()

content = content.replace('src="/logo.png"', 'src="logo.png"')

with open(path, 'w') as f:
    f.write(content)

print('Done')
