import csv, json
from collections import Counter

buildings = []
with open('../dataset/------.csv') as f:
    reader = csv.DictReader(f)
    for row in reader:
        lat = row.get('latitude', '')
        lng = row.get('longitude', '')
        if lat and lng:
            try:
                buildings.append({
                    ------
                })
            except (ValueError, TypeError):
                pass

print(f'Total buildings with coords: {len(buildings)}')
lats = [b['lat'] for b in buildings]
lngs = [b['lng'] for b in buildings]
print(f'Lat range: {min(lats):.4f} to {max(lats):.4f}')
print(f'Lng range: {min(lngs):.4f} to {max(lngs):.4f}')

with open('public/data/buildings_geo.json', 'w') as f:
    json.dump(buildings, f)
print(f'Saved {len(buildings)} buildings to buildings_geo.json')

campus_counts = Counter(b['campus'] for b in buildings)
for c, n in campus_counts.most_common():
    print(f'  {c}: {n} buildings')
