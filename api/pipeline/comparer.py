import re
import json
from utils import *
import numpy as np
import evaluate
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity

class Comparer():
    def __init__(self, blocks_dir=None, captions_dir=None, model=None):
        self.blocks_dir = blocks_dir
        self.caption_dir = captions_dir

        self.embedder = model
        self.rouge = evaluate.load('rouge')
    
    def _read_paper_blocks(self, id):
        """
        Read the paper blocks from the input path
        """
        with open(f"{self.blocks_dir}/{id}.json", 'r') as f:
            blocks = json.load(f)

        output = []
        for block in blocks:
            if block['type'] != 'Paragraph': continue
            text = ' '.join(map(lambda x: x['text'], block['tokens']))
            output.append({'id': block['id'], 'index': block['index'], 'text': text})

        return output

    def _read_caption_blocks(self, id, segments):
        """
        Read the caption blocks
        """
        # Read the captions
        sentences, sentence_keys, captions = read_captions(f"{self.caption_dir}/{id}.json")

        caption_blocks = []
        for i, segment in enumerate(segments):
            block = ""
            for caption in captions:
                if segment[0] <= caption['start']/1000 and caption['end']/1000 <= segment[1]:
                    block += caption['caption'].strip() + " "
            caption_blocks.append(block.strip())

        return caption_blocks

    def extract_salient(self, paragraph, num_sentences=5):
        """
        Extract the salient sentences from the paragraph
        """
        # Split into sentences considering different punctuation and speechmarks
        sentences = re.split(r'(?<!\w\.\w.)(?<![A-Z][a-z]\.)(?<=\.|\?|\!)\s', paragraph)

        # Calculate the embeddings
        embeddings = self.embedder.encode(sentences)

        # Calculate the similarity matrix
        similarity = cosine_similarity(embeddings)

        # Calculate the saliency scores
        scores = np.sum(similarity, axis=1)

        # Sort the sentences
        sorted_indices = np.argsort(scores)[::-1][:num_sentences]
        sorted_indices.sort()

        # Return the top sentences
        return ' '.join([sentences[i].strip() for i in sorted_indices[:num_sentences]])

    def compare_embedding(self, id, segments):
        """
        Compare the captions to the blocks
        """
        # Read caption blocks
        caption_blocks = self._read_caption_blocks(id, segments)

        # Read paper blocks
        paper_blocks = self._read_paper_blocks(id)
        paper_block_ids = list(map(lambda x: x['id'], paper_blocks))
        paper_blocks = list(map(lambda x: self.extract_salient(x['text']), paper_blocks))

        # Calculate the similarity between the caption chunks and the blocks
        caption_embeddings = self.embedder.encode(caption_blocks)
        paper_embeddings = self.embedder.encode(paper_blocks)
        comparisons = cosine_similarity(caption_embeddings, paper_embeddings)

        return comparisons, paper_block_ids

    def compare_rouge(self, id, segments):
        # Read caption blocks
        caption_blocks = self._read_caption_blocks(id, segments)

        # Read paper blocks
        paper_blocks = self._read_paper_blocks(id)
        paper_block_ids = list(map(lambda x: x['id'], paper_blocks))
        paper_blocks = list(map(lambda x: self.extract_salient(x['text']), paper_blocks))

        # Calculate the similarity between the caption chunks and the blocks
        comparisons = []
        for caption_block in caption_blocks:
            scores = self.rouge.compute(
                predictions=[caption_block] * len(paper_blocks), 
                references=paper_blocks, 
                rouge_types=['rouge1', 'rouge2', 'rougeL'],
                use_aggregator=False
            )
            comparisons.append([(scores['rouge1'][i] + scores['rouge2'][i] + scores['rougeL'][i])/3 for i in range(len(scores['rouge1']))])

        return np.array(comparisons), paper_block_ids

    def compare(self, id, segments, method='embedding', ratio=0.5):
        if method == 'embedding':
            comparisons, block_ids = self.compare_embedding(id, segments)
        elif method == 'rouge':
            comparisons, block_ids = self.compare_rouge(id, segments)
        elif method == 'joint':
            comparisons_embed, block_ids = self.compare_embedding(id, segments)
            comparisons_rouge, block_ids = self.compare_rouge(id, segments)
            row_sums = comparisons_embed.sum(axis=1)
            comparisons_embed = comparisons_embed / row_sums[:, np.newaxis]
            row_sums = comparisons_rouge.sum(axis=1)
            comparisons_rouge = comparisons_rouge / row_sums[:, np.newaxis]

            print(np.sum(comparisons_embed[0]))
            comparisons = comparisons_embed * ratio + comparisons_rouge * (1 - ratio)

        return comparisons, block_ids

    def evaluate(self, predicted, actual, block_ids, top_k=5):
        total = 0
        correct = 0
        predicted_top = np.argsort(predicted, axis=1)[:, -top_k:]
        for i in range(predicted.shape[0]):
            predicted_blocks = list(map(lambda x: block_ids[x], predicted_top[i]))
            is_text = False
            for block_id in actual[i]:
                if block_id not in block_ids: continue
                is_text = True
                if block_id in predicted_blocks:
                    correct += 1
                    break
            if is_text: 
                total += 1
            # else:
            #     print(f"Caption {i} not mapped to any block")
        
        return correct/total

    def evaluate_compare(self, predicted_1, predicted_2, actual, block_ids, top_k=5):
        total = 0
        correct_1 = 0
        correct_2 = 0
        predicted_1_top = np.argsort(predicted_1, axis=1)[:, -top_k:]
        predicted_2_top = np.argsort(predicted_2, axis=1)[:, -top_k:]
        for i in range(predicted_1.shape[0]):
            predicted_1_blocks = list(map(lambda x: block_ids[x], predicted_1_top[i]))
            predicted_2_blocks = list(map(lambda x: block_ids[x], predicted_2_top[i]))
            is_text = False
            found_1 = False
            found_2 = False
            for block_id in actual[i]:
                if block_id not in block_ids: continue
                is_text = True
                if block_id in predicted_1_blocks and not found_1:
                    found_1 = True
                if block_id in predicted_2_blocks and not found_2:
                    found_2 = True
                if found_1 and found_2:
                    break
            
            if found_1: correct_1 += 1
            if found_2: correct_2 += 1


            if is_text: 
                total += 1
            # else:
            #     print(f"Caption {i} not mapped to any block")
        
        return correct_1/total, correct_2/total


if __name__ == "__main__":
    comparer = Comparer(
        blocks_dir="../app/data/blocks",
        captions_dir="../app/data/captions",
        model=SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2') #allenai-specter
    )

    annotation_dir = "../app/data/annotation"

    not_include = ["3491102.3501873", "3491102.3501967", "3462204.3481761"]
    ids = [
        "10.1145.3449140", "3411764.3445776", "3462204.3481761", "3472749.3474777", "3491102.3501873", 
        "3491102.3501931", "3491102.3501967", "3491102.3502081", "3491102.3502087", "3491102.3517505",
        "3491102.3517729"
    ]

    is_separate = False

    if is_separate:
        total_accuracy_emb = 0
        total_accuracy_rouge = 0
        total_count = 0
        for id in ids:
            if id in not_include: continue

            print(f"Processing {id}")

            segments, actual_comparisons = read_annotated_clips(f"{annotation_dir}/{id}.json")
            predicted_comparisons_1, block_ids = comparer.compare(id, segments, method='embedding')
            predicted_comparisons_2, block_ids = comparer.compare(id, segments, method='rouge')
            accuracy_emb, accuracy_rouge  = comparer.evaluate_compare(
                predicted_comparisons_1, 
                predicted_comparisons_2, 
                actual_comparisons, 
                block_ids,
            )

            print(f"(Embedding) {accuracy_emb}, (ROUGE) {accuracy_rouge}")
            total_count += 1
            total_accuracy_emb += accuracy_emb
            total_accuracy_rouge += accuracy_rouge
        
        print()
        print(f"Embedding Accuracy: {total_accuracy_emb/total_count}")
        print(f"ROUGE Accuracy: {total_accuracy_rouge/total_count}")
    else:
        for i in range(1,10):
            total_accuracy = 0
            total_count = 0
            for id in ids:
                if id in not_include: continue

                segments, actual_comparisons = read_annotated_clips(f"{annotation_dir}/{id}.json")
                predicted_comparisons, block_ids = comparer.compare(id, segments, method='joint', ratio=i/10)
                accuracy = comparer.evaluate(
                    predicted_comparisons, 
                    actual_comparisons, 
                    block_ids,
                )

                total_count += 1
                total_accuracy += accuracy
            
            print()
            print(f"[Ratio: {i/10}] Accuracy: {total_accuracy/total_count}")
        
