import os
import json
import time
import cv2 as cv
import numpy as np
from scenedetect import ContentDetector, AdaptiveDetector, SceneManager, StatsManager, open_video

from utils import *

class Segmenter():
    def __init__(self, model=None, video_dir=None, caption_dir=None, annotation_dir=None):
        self.video_dir = video_dir
        self.caption_dir = caption_dir
        self.annotation_dir = annotation_dir

        self.window = 3

        with open('./prompts.json', 'r') as f:
            self.prompts = json.load(f)

    def segment_scene(self, id, min_scene_len=180, threshold=0.75, is_content=True):
        """
        Segment the video using scene detection
        """
        # video = open_video(f"{self.video_dir}/{id}/full.mp4")

        cap = cv.VideoCapture(f"{self.video_dir}/{id}/full.mp4")
        fps = round(cap.get(cv.CAP_PROP_FPS))
        curr_frame_idx = -1
        prev_frame_idx = 0
        prev_frame = None

        segments = []

        while cap.isOpened():
            curr_frame_idx += 1
            ret, frame = cap.read()
            # if frame is read correctly ret is True
            if not ret:
                break

            if curr_frame_idx % 6 != 5: 
                continue

            frame = cv.resize(frame, (320, 180))
            
            if not prev_frame is None:
                res = cv.matchTemplate(frame, prev_frame, cv.TM_CCOEFF_NORMED)
                min_val, max_val, min_loc, max_loc = cv.minMaxLoc(res)
                if max_val < threshold and curr_frame_idx - prev_frame_idx > min_scene_len:
                    segments.append((prev_frame_idx/fps, curr_frame_idx/fps))
                    prev_frame_idx = curr_frame_idx
            prev_frame = frame

        cap.release()

        # scene_manager = SceneManager(StatsManager())
        # if is_content:
        #     scene_manager.add_detector(ContentDetector(threshold=threshold, min_scene_len=min_scene_len))
        # else:
        #     scene_manager.add_detector(AdaptiveDetector(min_scene_len=min_scene_len))
        # scene_manager.detect_scenes(video, show_progress=False)
        # scene_list = scene_manager.get_scene_list()
        # segments = []
        # for scene in scene_list:
        #     segments.append((scene[0].get_seconds(), scene[1].get_seconds()))
        return segments

    def segment_caption_align(self, id, segments):
        """
        Align the predicted segments to aling with punctuations in the captions
        """
        _, _, captions = read_captions(f"{self.caption_dir}/{id}.json")

        # Align the segments with the captions
        caption_segments = []
        last_caption_idx = 0
        for i, segment in enumerate(segments):
            caption_idx = last_caption_idx
            min_dist = 100000000
            for j in range(caption_idx, len(captions)):
                dist = abs(captions[j]['end'] - segment[1])
                if dist < min_dist:
                    min_dist = dist
                    caption_idx = j
            
            is_punc = False
            for punc in ['.', '!', '?']:
                if punc in captions[caption_idx]['caption']:
                    is_punc = True
                    break
            
            if is_punc:
                text = ""
                for j in range(last_caption_idx, caption_idx + 1):
                    text += captions[j]['caption'] + " "
                caption_segments.append((captions[last_caption_idx]['start'], captions[caption_idx]['end']))
                last_caption_idx = caption_idx + 1
            
            if last_caption_idx == len(captions):
                break

        return caption_segments

    def caption_split_segment(self, id, segments):
        _, _, captions = read_captions(f"{self.caption_dir}/{id}.json")

        # Align the segments with the captions
        caption_segments = []
        last_caption_idx = 0
        for i in range(len(captions)):
            is_punc = False
            for punc in ['.', '!', '?']:
                if punc in captions[i]['caption']:
                    is_punc = True
                    break
                
            if not is_punc: continue

            threshold = 5

            is_segment = False
            for j in range(len(segments)):
                if segments[j][1] - threshold <= captions[i]['end'] and captions[i]['end'] <= segments[j][1] + threshold:
                    is_segment = True
                    break

            if is_segment:
                caption_segments.append((captions[last_caption_idx]['start'], captions[i]['end']))
                last_caption_idx = i + 1

        if last_caption_idx != len(captions):
            caption_segments.append((captions[last_caption_idx]['start'], captions[-1]['end']))

        return caption_segments

    def punc_baseline(self, id):
        """
        Baseline: segment based on punctuation
        """
        _, _, captions = read_captions(f"{self.caption_dir}/{id}.json")

        caption_segments = []
        last_caption_idx = 0
        for j in enumerate(len(captions)):
            is_punc = False
            for punc in ['.', '!', '?']:
                if punc in captions[j]['caption']:
                    is_punc = True
                    break
            
            if is_punc:
                caption_segments.append((captions[last_caption_idx]['start'], captions[j]['end']))
                last_caption_idx = j + 1
            
            if last_caption_idx == len(captions):
                break

        return caption_segments

    def evaluate(self, predicted, actual):
        """
        Evaluate the predicted segments against the actual segments
        """
        total_pred = len(predicted)
        total_actual = len(actual)
        correct = 0
        for pred in predicted:
            for act in actual:
                if pred[1] - self.window <= act[1] and act[1] <= pred[1] + self.window:
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
    )

    annotation_dir = "../app/data/annotation"

    not_include = ["3491102.3501873", "3491102.3501967", "3462204.3481761"]
    ids = [
        "3491102.3501931", "3411764.3445776", "10.1145.3449140", "3462204.3481761", "3472749.3474777", 
        "3491102.3501873", "3491102.3501967", "3491102.3502081", "3491102.3502087", "3491102.3517505", 
        "3491102.3517729"
    ]

    total_precision = 0
    total_recall = 0
    total_f1 = 0

    for id in ids:
        if id in not_include: continue

        start_time = time.time()
        segments = segmenter.segment_scene(id)
        print(f"Time: {time.time() - start_time}")

        segments = segmenter.caption_split_segment(id, segments)
        print(segments)

        print(id)

        annotated_segments, _ = read_annotated_clips(f"{annotation_dir}/{id}.json")

        precision, recall, f1 = segmenter.evaluate(segments, annotated_segments)
        total_precision += precision
        total_recall += recall
        total_f1 += f1
    
    count = len(ids) - len(not_include)
    print(f"Average Precision: {total_precision / count}, Average Recall: {total_recall / count}, Average F1: {total_f1 / count}")