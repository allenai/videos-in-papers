import os
import numpy as np
import random
from sentence_transformers import SentenceTransformer

from segmenter import Segmenter
from comparer import Comparer
from utils import *

class Mapper():
    def __init__(self):
        self.segments = None
        self.compare_matrix = None
        self.block_ids = None

        self.comparer = Comparer(
            blocks_dir="../data/blocks",
            captions_dir="../data/captions",
            model_name='sentence-transformers/all-MiniLM-L6-v2' #allenai-specter
        )
        self.segmenter = Segmenter(
            video_dir='../data/clips', 
            caption_dir='../data/captions',
            annotation_dir='../data/annotation'
        )

        self.paper_blocks = None
        self.paper_block_ids = None

    def initialize_data(self, id, annotation_dir=None):
        """
        Initialize data for a given paper
        """
        if annotation_dir is not None:
            segments, _ = read_annotated_clips(f"{annotation_dir}/{id}.json")
        else:
            segments = self.segmenter.segment_scene(id)
        self.segments = segments

        self.paper_blocks = self.comparer._read_paper_blocks(id)
        self.paper_block_ids = list(map(lambda x: x['id'], self.paper_blocks))

        comparison_matrix, block_ids = self.comparer.compare(id, segments, method='joint')
        self.block_ids = block_ids

        self.emission_matrix = comparison_matrix
        self.state_matrix = np.zeros(comparison_matrix.shape)
        self.pointer_matrix = [[] for i in range(comparison_matrix.shape[0])]
        for i in range(comparison_matrix.shape[0]):
            self.pointer_matrix[i] = [[] for j in range(comparison_matrix.shape[1])]
        self.transition_matrix = np.zeros((comparison_matrix.shape[1], comparison_matrix.shape[1]))
        for i in range(comparison_matrix.shape[1]):
            for j in range(comparison_matrix.shape[1]):
                if i == 0:
                    self.transition_matrix[i][j] = 1
                elif i == j:
                    self.transition_matrix[i][j] = 0
                elif j > i and self.paper_blocks[i]['section'] != self.paper_blocks[j]['section']:
                    self.transition_matrix[i][j] = 0.4 #* (1 - (abs(i - j) - 1) / (comparison_matrix.shape[1] - j))
                else:
                    self.transition_matrix[i][j] = 0.6

    def viterbi(self, top_k=5):
        """
        Viterbi algorithm for finding the most likely state path
        """
        self.state_matrix[0] = self.emission_matrix[0]
        for c in range(1, self.state_matrix.shape[0]):
            for p in range(self.state_matrix.shape[1]):
                sorted_paper_idx = np.argsort(self.state_matrix[c-1] * self.transition_matrix[p])[::-1]
                for paper_idx in sorted_paper_idx:
                    used_papers = self.pointer_matrix[c-1][paper_idx]
                    if p in used_papers: continue
                    self.state_matrix[c][p] = self.emission_matrix[c][p] * self.state_matrix[c-1][paper_idx] * self.transition_matrix[p][paper_idx]
                    self.pointer_matrix[c][p] = used_papers + [paper_idx]
                    break

        state_path = self.pointer_matrix[-1][np.argmax(self.state_matrix[-1])] + [np.argmax(self.state_matrix[-1])]

        top_k_method = "post_given"
        top_k_paths = []
        if top_k_method == "final_only":
            top_final_idx = np.argsort(self.state_matrix[-1])[::-1][:top_k]
            for final_idx in top_final_idx:
                path = self.pointer_matrix[-1][final_idx] + [final_idx]
                if len(top_k_paths) == 0:
                    for i in range(len(path)):
                        top_k_paths.append([path[i]])
                else:
                    for i in range(len(path)):
                        top_k_paths[i].append(path[i])
        elif top_k_method == "prev_given":
            for c in range(len(state_path)):
                if c == 0:
                    sorted_paper_idx = np.argsort(self.emission_matrix[c])[::-1]
                    top_k_idx = []
                    for paper_idx in sorted_paper_idx:
                        top_k_idx.append(paper_idx)
                        if len(top_k_idx) == top_k: break
                    top_k_paths.append(top_k_idx)
                else:
                    sorted_paper_idx = np.argsort(self.emission_matrix[c] * self.transition_matrix[:, state_path[c - 1]])[::-1]
                    top_k_idx = []
                    for paper_idx in sorted_paper_idx:
                        top_k_idx.append(paper_idx)
                        if len(top_k_idx) == top_k: break
                    top_k_paths.append(top_k_idx)
        elif top_k_method == "post_given":
            for c in reversed(range(len(state_path))):
                if c == len(state_path) - 1:
                    sorted_paper_idx = np.argsort(self.state_matrix[c])[::-1]
                    top_k_idx = []
                    for paper_idx in sorted_paper_idx:
                        top_k_idx.append(paper_idx)
                        if len(top_k_idx) == top_k: break
                    top_k_paths.insert(0, top_k_idx)
                else:
                    sorted_paper_idx = np.argsort(self.state_matrix[c] * self.transition_matrix[state_path[c + 1]])[::-1]
                    top_k_idx = []
                    for paper_idx in sorted_paper_idx:
                        top_k_idx.append(paper_idx)
                        if len(top_k_idx) == top_k: break
                    top_k_paths.insert(0, top_k_idx)
        
        return top_k_paths

    def evaluate(self, predicted_state_path, id, annotation_dir):
        predicted_mappings= []
        for options in predicted_state_path:
            predicted_mappings.append(list(map(lambda x: self.paper_block_ids[int(x)], options)))
        _, actual_mappings = read_annotated_clips(f"{annotation_dir}/{id}.json")
        
        correct = 0
        total = 0
        total_correct_blocks = 0
        for i in range(len(predicted_mappings)):
            is_text = False
            
            predicted_blocks = predicted_mappings[i]

            for block_id in actual_mappings[i]:
                if block_id not in self.paper_block_ids: continue
                total_correct_blocks += 1
                is_text = True
                if block_id in predicted_blocks:
                    correct += 1
                    break
            
            if is_text: 
                total += 1

        return correct, total

    def evaluate_random(self, id, annotation_dir, top_k=5):
        _, actual_mappings = read_annotated_clips(f"{annotation_dir}/{id}.json")

        first_in_section_ids = []
        curr_section = ""
        for i in range(len(self.paper_blocks)):
            if self.paper_blocks[i]['section'] != curr_section:
                first_in_section_ids.append(self.paper_blocks[i]['id'])
                curr_section = self.paper_blocks[i]['section']

        correct = 0
        total = 0

        for i in range(len(actual_mappings)): # For each clip
            is_text = False
            
            predicted_blocks = random.sample(first_in_section_ids, top_k)

            for block_id in actual_mappings[i]:
                if block_id not in self.paper_block_ids: continue
                is_text = True
                if block_id in predicted_blocks:
                    correct += 1
                    break
            
            if is_text: 
                total += 1

        return correct, total

if __name__ == "__main__":
    mapper = Mapper()

    annotation_dir = "../data/annotation"

    not_include = ["3491102.3501873", "3491102.3501967", "3462204.3481761"]
    ids = [
        "10.1145.3449140", "3411764.3445776", "3462204.3481761", "3472749.3474777", "3491102.3501873", 
        "3491102.3501931", "3491102.3501967", "3491102.3502081", "3491102.3502087", "3491102.3517505",
        "3491102.3517729"
    ]

    total_accuracy = 0
    total_correct = 0
    total_random_correct = 0
    total_random_accuracy = 0
    total_mappings = 0
    total_count = 0
    
    top_k = 5
    
    for id in ids:
        if id in not_include: continue
        
        mapper.initialize_data(id, annotation_dir)
        state_path = mapper.viterbi(top_k=top_k)
        results = mapper.evaluate(state_path, id, annotation_dir)
        random_results = mapper.evaluate_random(id, annotation_dir, top_k=top_k)
        print(f"{id}: {results[0] / results[1]}")
        total_correct += results[0]
        total_accuracy += results[0] / results[1]
        total_mappings += results[1]
        total_count += 1

        total_random_correct += random_results[0]
        total_random_accuracy += random_results[0] / random_results[1]
    
    print(f"Average accuracy: {total_accuracy / total_count}")
    print(f"Total accuracy: {total_correct / total_mappings}")
    print(f"Average random accuracy: {total_random_accuracy / total_count}")
    print(f"Total random accuracy: {total_random_correct / total_mappings}")
