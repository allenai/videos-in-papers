import os
import csv
import json
from pytube import YouTube
from html.parser import HTMLParser
from moviepy.editor import *

class Parser(HTMLParser):
    attributes = []
    data = []

    def handle_starttag(self, tag, attrs):
        if tag == "p":
            self.attributes.append(attrs)
    
    def handle_data(self, data):
        if data == "\n":
            return
        self.data.append(data)

parser = Parser()

def parse_xml(xml):
    parser.feed(xml)
    results = []
    for i in range(len(parser.data)):
        results.append([
            parser.data[i],
            int(parser.attributes[i][0][1]),
            int(parser.attributes[i][1][1])
        ])
    parser.data = []
    parser.attributes = []
    return results


def get_captions(url, output_path):
    yt = YouTube(url)
    captions = yt.captions
    xml = None
    for caption in captions:
        code = caption.code
        lang = code.split(".")[0]
        if lang == 'en':
            xml = caption.xml_captions.split("\n")[2:-3]
            break
    
    if xml is None:
        return None
    
    processed = parse_xml(caption.xml_captions)
    with open(output_path+".csv", "w") as f:
        writer = csv.writer(f)
        writer.writerow(["text", "start_time", "duration"])
        writer.writerows(processed)

    json_obj = []
    for caption in processed:
        json_obj.append({"caption": caption[0], "start": caption[1], "end": caption[1]+caption[2]})
    with open(output_path+".json", "w") as f:
        json.dump(json_obj, f)

def download_video(url, doi, output_path):
    yt = YouTube(url)
    mp4_files = yt.streams.filter(file_extension="mp4")
    mp4_369p_files = mp4_files.get_by_resolution("360p")
    mp4_369p_files.download(f"{output_path}/{doi}/video", filename=f"full.mp4")


def split_video(doi):
    with open(f'./data/annotation/{doi}.json', 'r') as f:
        annotations = json.load(f)
    
    video_dir = f"./data/clips/{doi}"
    for clip_id in annotations['clips']:
        clip = annotations['clips'][clip_id]
        video = VideoFileClip(f"{video_dir}/full.mp4").subclip(clip['start'], clip['end'])
        video.audio = AudioFileClip(f"{video_dir}/full.mp4").subclip(clip['start'], clip['end'])
        video.write_videofile(f"{video_dir}/{clip_id}.mp4", temp_audiofile='./temp-audio.m4a', fps=25, audio_codec="aac")