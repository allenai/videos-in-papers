import os
import csv
import json
from xml.etree import ElementTree
from html import unescape
from pytube import YouTube
import time
import math
from video_handler import get_captions

url = "https://www.youtube.com/watch?v=7ZJZpIW9FHc"
yt = YouTube(url)
get_captions(yt, "test", "test")

