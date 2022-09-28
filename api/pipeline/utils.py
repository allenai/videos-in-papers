import json

def read_captions(file_path):
    """
    Read the captions from the input path
    """
    with open(file_path, 'r') as f:
        captions = json.load(f)
    
    prev_text = ""
    sentences = []
    sentence_keys = []
    for i, caption in enumerate(captions):
        text = caption['caption'].replace('\n', ' ').strip()
        for punc in ['.', '?', '!']:
            if punc in text:
                punc_idx = text.index(punc)
                if punc_idx < len(text) - 1 and text[punc_idx+1] != ' ':
                    punc_idx += 1

                sentences.append((prev_text+" "+text[:punc_idx + 1]).strip())
                sentence_keys.append(i)
                text = text[punc_idx + 1:]
                prev_text = ""
            else:
                prev_text = (prev_text + " " + text).strip()
                break

    return sentences, sentence_keys, captions

def read_annotated_clips(file_path):
    """
    Read the annotations from the input path
    """
    with open(file_path, 'r') as f:
        annotations = json.load(f)

    clips = annotations['clips']
    segments = []
    mappings = []
    for clipId in clips:
        clip = clips[clipId]
        segments.append((clip['start']/1000, clip['end']/1000))
        highlightIds = clip['highlights']
        blocks = []
        for hId in highlightIds:
            blocks += annotations['highlights'][str(hId)]['blocks']
        mappings.append(blocks)


    return segments, mappings