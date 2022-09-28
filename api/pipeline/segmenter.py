import os
import json
import openai
from scenedetect import ContentDetector, AdaptiveDetector, SceneManager, StatsManager, open_video
from utils import *

class Segmenter():
    def __init__(self, api_key=None, video_dir=None, caption_dir=None, annotation_dir=None):
        self.api_key = api_key
        self.video_dir = video_dir
        self.caption_dir = caption_dir
        self.annotation_dir = annotation_dir

        with open('./prompts.json', 'r') as f:
            self.prompts = json.load(f)

    def segment_gpt3(self, id):
        """
        Segment the captions using GPT-3
        """
        # Read the captions
        sentences, sentence_keys, captions = read_captions(f"{self.caption_dir}/{id}.json")

        segment_classes = []
        for i in range(1, len(sentences) - 1):
            prompt = self.prompts['segment']

            prefix = ""
            suffix = ""
            completed_len = len(segment_classes)
            window_size = 4
            prefix_len = window_size // 2
            if completed_len < prefix_len:
                prefix_len = completed_len
            elif i + window_size - prefix_len - 1 >= len(sentences):
                prefix_len = window_size - (len(sentences) - i)

            for j in range(completed_len - prefix_len, completed_len):
                prefix = prefix + " " + sentences[j] + " " + segment_classes[j]
            prefix += " " + sentences[i]
            prefix = prefix.strip()
            for j in range(i, i + window_size - prefix_len - 1):
                suffix += sentences[j+1]

            prompt = prompt.replace('[PREFIX]', prefix + ' ')

            openai.api_key = self.api_key
            while True:
                response = openai.Completion.create(
                    model="text-davinci-002",
                    prompt=prompt,
                    temperature=0.1,
                    max_tokens=5,
                    top_p=1,
                    suffix=" " + suffix.strip()
                )
                generation = response['choices'][0]['text'].strip()
                if '[Transition]' not in generation and '[Continuation]' not in generation:
                    continue
                print(generation)
                generation = generation[generation.index('['):]
                generation = generation[:generation.index(']')+1]
                break
            segment_classes.append(generation)

        last_caption_idx = 0
        segments = []
        for i, segment_class in enumerate(segment_classes):
            if segment_class == "[Transition]":
                segments.append((captions[last_caption_idx]['start'], captions[sentence_keys[i]]['end']))
                last_caption_idx = sentence_keys[i] + 1
        
        print(segments)
            
        return segments#, sentences, segment_classes

    def segment_scene(self, id, min_scene_len=180, threshold=7, is_content=True):
        video = open_video(f"{self.video_dir}/{id}/full.mp4")
        scene_manager = SceneManager(StatsManager())
        if is_content:
            scene_manager.add_detector(ContentDetector(threshold=threshold, min_scene_len=min_scene_len))
        else:
            scene_manager.add_detector(AdaptiveDetector(min_scene_len=min_scene_len))
        scene_manager.detect_scenes(video, show_progress=False)
        scene_list = scene_manager.get_scene_list()
        segments = []
        for scene in scene_list:
            segments.append((scene[0].get_seconds(), scene[1].get_seconds()))
        return segments

    def evaluate(self, predicted, actual):
        """
        Evaluate the predicted segments against the actual segments
        """
        total_pred = len(predicted)
        total_actual = len(actual)
        correct = 0
        for pred in predicted:
            for act in actual:
                if pred[1] - 2 <= act[1] and act[1] <= pred[1] + 2:
                    correct += 1
                    break
        
        precision = correct / total_pred
        recall = correct / total_actual
        f1 = 2 * precision * recall / (precision + recall)

        return precision, recall, f1


if __name__ == "__main__":
    segmenter = Segmenter(
        video_dir='../app/data/clips', 
        caption_dir='../app/data/captions',
        annotation_dir='../app/data/annotation',
        api_key=os.environ['OPENAI_API_KEY']
    )

    annotation_dir = "../app/data/annotation"

    not_include = ["3491102.3501873", "3491102.3501967", "3462204.3481761"]
    ids = [
        "10.1145.3449140", "3411764.3445776", "3462204.3481761", "3472749.3474777", "3491102.3501873", 
        "3491102.3501931", "3491102.3501967", "3491102.3502081", "3491102.3502087", "3491102.3517505",
        "3491102.3517729"
    ]

    total_precision = 0
    total_recall = 0
    total_f1 = 0
    for id in ids:
        if id in not_include: continue
        segments = [(3000, 18400), (18400, 40880), (40880, 56360), (56360, 75160), (75160, 126080), (126080, 138840), (138840, 157560), (157560, 183720), (183720, 195360), (195360, 219240), (219240, 239000), (239000, 253440), (253440, 280800), (280800, 308680), (308680, 322080), (322080, 342880), (342880, 360320), (360320, 373880), (373880, 397000), (397000, 433800), (433800, 450120), (450120, 467120), (467120, 480840), (480840, 508400), (508400, 514440), (514440, 527040)]
        for i in range(len(segments)):
            segments[i] = (segments[i][0]/1000, segments[i][1]/1000)

        annotated_segments, _ = read_annotated_clips(f"{annotation_dir}/{id}.json")

        precision, recall, f1 = segmenter.evaluate(segments, annotated_segments)
        total_precision += precision
        total_recall += recall
        total_f1 += f1
        break
    
    count = len(ids) - len(not_include)
    print(f"Average Precision: {total_precision / count}, Average Recall: {total_recall / count}, Average F1: {total_f1 / count}")
    
