import os
import json

annotations_dir = './highlights'
for filename in os.listdir(annotations_dir):
    if '.tsx' in filename or filename == 'highlights.ts': continue
    file_path = os.path.join(annotations_dir, filename)
    with open(file_path, 'r') as f:
        lines = f.readlines()
        lines[0] = lines[0].replace("export const testHighlights = ", "")
        lines[-1] = lines[-1].replace(";", "")
        with open('./annotations/' + filename.replace(".ts", ".json"), 'w') as f:
            f.writelines(lines)

annotations_dir = './annotations'
for filename in os.listdir(annotations_dir):
    file_path = os.path.join(annotations_dir, filename)
    processed = {"highlights": {}, "clips": {}}
    found_clips = []
    with open(file_path, 'r') as f:
        annotations = json.load(f)
        for i, an in enumerate(annotations):
            if "image" in an["content"].keys():
                type = "image"
                rects = []
                rect = an['position']['boundingRect']
                rects.append({
                    "page": rect['pageNumber'] - 1,
                    "top": rect['y1'] / rect['height'],
                    "left": rect['x1'] / rect['width'],
                    "height": (rect['y2'] - rect['y1']) / rect['height'],
                    "width": (rect['x2'] - rect['x1']) / rect['width']
                })
            else:
                type = "text"
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

            if id in found_clips:
                processed['clips'][id]['highlights'].append(i)
            else:
                processed['clips'][id] = {
                    "id": id,
                    "start": int(start[0]) * 60 + int(start[1]),
                    "end": int(end[0]) * 60 + int(end[1]),
                    "highlights": [i]
                }
                found_clips.append(id)
                

            
            processed['highlights'][i] = {
                "id": i,
                "type": type,
                "rects": rects,
                "clip": id
            }
        with open(file_path, 'w') as f:
            json.dump(processed, f)