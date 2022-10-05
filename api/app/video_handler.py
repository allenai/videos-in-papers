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


def get_captions(yt, doi, output_path):
    captions = yt.captions
    xml = None
    auto_captions = ""
    for caption in captions:
        code = caption.code
        lang = code.split(".")[0]
        if code == 'a.en':
            xml = caption.xml_captions
        if lang == 'en':
            break
    
    # if xml is None:
    #     xml = auto_captions

    processed = parse_xml(caption.xml_captions)

    json_obj = []
    for caption in processed:
        json_obj.append({"caption": caption[0], "start": caption[1], "end": caption[1]+caption[2]})
    with open(f"{output_path}/{doi}.json", "w") as f:
        json.dump(json_obj, f)

def download_video(url, doi, video_path, caption_path=None):
    yt = YouTube(url)
    mp4_files = yt.streams.filter(file_extension="mp4")
    mp4_480p_files = mp4_files.get_by_resolution("720p")
    mp4_480p_files.download(f"{video_path}/{doi}", filename=f"full.mp4")
    if not caption_path is None:
        get_captions(yt, doi, caption_path)


def split_video(doi, video_path, clips):
    video_dir = f"{video_path}/{doi}"
    video = VideoFileClip(f"{video_dir}/full.mp4")
    video.audio = AudioFileClip(f"{video_dir}/full.mp4")
    for clip_id in clips:
        clip = clips[clip_id]
        clip = video.subclip(clip['start']/1000, clip['end']/1000)
        clip.write_videofile(f"{video_dir}/{clip_id}.mp4", temp_audiofile='./temp-audio.m4a', fps=25, audio_codec="aac")
