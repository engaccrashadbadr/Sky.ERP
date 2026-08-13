from pathlib import Path
line = Path('client/src/pages/Home.tsx').read_text().splitlines()[180]
for start in range(0, len(line), 400):
    end = min(start + 400, len(line))
    print(f'[{start}:{end}] {line[start:end]}')
    if start <= 483 < end:
        print(' ' * (len(f'[{start}:{end}] ') + 483 - start) + '^')
print('around=', repr(line[450:530]))
print('length=', len(line))
