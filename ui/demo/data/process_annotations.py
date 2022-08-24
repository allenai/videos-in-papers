import os
import json

annotations_dir = './annotations'
for filename in os.listdir(annotations_dir):
    file_path = os.path.join(annotations_dir, filename)
    processed = []
    with open(file_path, 'r') as f:
        annotations = json.load(f)
        for an in annotations:
            type = "text"
            print(an)
            if "image" in an["content"].keys():
                type = "image"
            rects = []
            for rect in an["position"]["rects"]:
                rects.append({
                    "page": rect['pageNumber'] - 1,
                    "top": rect['y1'] / rect['height'],
                    "left": rect['x1'] / rect['width'],
                    "height": (rect['y2'] - rect['y1']) / rect['height'],
                    "width": (rect['x2'] - rect['x1']) / rect['width']
                })
            info = map(lambda s: s.strip(), an["comment"]['text'].split("-"))
            id = info[2]
            start = info[0].split(":")
            end = info[1].split(":")
            timestamp = {
                "start": int(start[0]) * 60 + int(start[1]),
                "end": int(end[0]) * 60 + int(end[1])
            }
            processed.append({
                "id": id,
                "type": type,
                "rects": rects,
                "timestamp": timestamp
            })
        with open(file_path, 'w') as f:
            json.dump(processed, f)