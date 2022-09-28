import os
from sentence_transformers import SentenceTransformer

from segmenter import Segmenter
from comparer import Comparer
from utils import *

class Mapper():
    def __init__(self, transitive_prob=0.9):
        self.transitive_prob = transitive_prob
        self.comparer = Comparer(
            blocks_dir="../app/data/blocks",
            captions_dir="../app/data/captions",
            model=SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2') #allenai-specter
        )
        self.segmenter = Segmenter(
            video_dir='../app/data/clips', 
            caption_dir='../app/data/captions',
            annotation_dir='../app/data/annotation',
            api_key=os.environ['OPENAI_API_KEY']
        )

    def initialize_data(self, id, annotation_dir, use_true_segments=True):
        if use_true_segments:
            segments, _ = read_annotated_clips(f"{annotation_dir}/{id}.json")
        else:
            segments = self.segmenter.segment_scene(id)

        comparison_matrix, block_ids = self.comparer.compare(id, segments, method='joint', ratio=0.5)


    def map(self):
        raise NotImplementedError


if __name__ == "__main__":
    annotation_dir = "../app/data/annotation"
    mapper = Mapper()
    mapper.map()