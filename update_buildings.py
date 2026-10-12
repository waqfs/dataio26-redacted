import csv, json

# Read building metadata
with open('dataset/-----.csv') as f:
    reader = csv.DictReader(f)
    metadata = {r['-----']: r for r in reader}

# Read existing buildings_geo.json
with open('3d/public/data/buildings_geo.json') as f:
    buildings = json.load(f)

# Add floor data
for b in buildings:
    meta = metadata.get(b['number'], {})
    above = meta.get('floorsaboveground', '')
    below = meta.get('floorsbelowground', '')
    b['floorsAbove'] = int(float(above)) if above and above.strip() else 1
    b['floorsBelow'] = int(float(below)) if below and below.strip() else 0

# Write updated
with open('3d/public/data/buildings_geo.json', 'w') as f:
    json.dump(buildings, f)

# Verify key buildings
for b in buildings:
    if b['number'] in ['272', '082', '870']:
        print(f"{b['number']}: {b['name']} area={b['area']} floors={b['floorsAbove']}+{b['floorsBelow']}")

print(f'Total buildings: {len(buildings)}')
