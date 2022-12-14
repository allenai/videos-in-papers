import re
import json
from app.pipeline.utils import *
import numpy as np
import random
import evaluate
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity

class Comparer():
    def __init__(self, blocks_dir=None, captions_dir=None, embeds_dir=None, model_name=None):
        self.blocks_dir = blocks_dir
        self.caption_dir = captions_dir
        self.embeds_dir = embeds_dir

        self.embedder = SentenceTransformer(model_name)
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
            output.append({'id': block['id'], 'index': block['index'], 'text': text, 'section': block['section']})

        return output

    def _read_caption_blocks(self, id, segments):
        """
        Read the caption blocks
        """
        # Read the captions
        _, _, captions = read_captions(f"{self.caption_dir}/{id}.json")

        caption_blocks = []
        for i, segment in enumerate(segments):
            block = ""
            for caption in captions:
                if segment[0] <= caption['start'] and caption['end'] <= segment[1]:
                    block += caption['caption'].strip() + " "
            caption_blocks.append(block.strip())

        return caption_blocks

    def extract_salient(self, paragraph, is_embedding=True, num_sentences=5):
        """
        Extract the salient sentences from the paragraph
        """
        if is_embedding:
            # Split into sentences, calculate embeddings, and calculate similarity matrix
            sentences = re.split(r'(?<!\w\.\w.)(?<![A-Z][a-z]\.)(?<=\.|\?|\!)\s', paragraph)
            embeddings = self.embedder.encode(sentences)
            similarity = cosine_similarity(embeddings)
            scores = np.sum(similarity, axis=1)

            # Sort the sentences and return top
            if len(sentences) <= num_sentences:
                return paragraph

            sorted_indices = np.argsort(scores)[::-1][:num_sentences]
            #sorted_indices = np.append(sorted_indices, np.argsort(scores)[::-1][-num_sentences//2+1:])
            sorted_indices.sort()
            return ' '.join([sentences[i].strip() for i in sorted_indices])
        else:
            doc = self.textrank(paragraph)
            top_sentences = [sent.text for sent in doc._.textrank.summary(limit_phrases=15, limit_sentences=num_sentences)]
            return ' '.join(top_sentences)

    def summarize(self, paragraphs):
        """
        Summarize the paragraphs
        """
        inputs = self.summary_tokenizer(paragraphs, max_length=1024, return_tensors="pt", padding="max_length")

        # Generate Summary
        summary_ids = self.summary_model.generate(inputs["input_ids"], num_beams=2, min_length=0, max_length=64)
        return self.summary_tokenizer.batch_decode(summary_ids, skip_special_tokens=True, clean_up_tokenization_spaces=False)

    def save_paper_embeddings(self, id, preprocess='extract'):
        """
        Save the embeddings
        """
        # Read the paper blocks
        paper_blocks = self._read_paper_blocks(id)
        paper_block_ids = list(map(lambda x: x['id'], paper_blocks))
        if preprocess == 'extract':
            paper_blocks = list(map(lambda x: self.extract_salient(x['text']), paper_blocks))
        embeddings = self.embedder.encode(paper_blocks)
        embeddings = np.concatenate((np.array(paper_block_ids).reshape(-1, 1), embeddings), axis=1)
        np.save(f"{self.embeds_dir}/{id}.npy", embeddings)
        
        if preprocess == 'extract':
            # save json with extracted sentences
            extracted = []
            for i, block in enumerate(paper_blocks):
                extracted.append({'id': paper_block_ids[i], 'text': block})
            with open(f"{self.blocks_dir}/{id}_{preprocess}.json", 'w') as f:
                json.dump(extracted, f)

    def load_embeddings(self, id, preprocess='extract'):
        """
        Load the embeddings
        """
        # Read the preprocessed paper blocks
        if preprocess == 'extract':
            with open(f"{self.blocks_dir}/{id}_{preprocess}.json", 'r') as f:
                paper_blocks = json.load(f)
        else:
            paper_blocks = self._read_paper_blocks(id)

        return np.load(f"{self.embeds_dir}/{id}.npy"), paper_blocks

    def compare_embedding(self, caption_embeddings, paper_embeddings):
        """
        Compare the captions to the blocks
        """
        # Calculate the similarity between the caption chunks and the blocks
        comparisons = cosine_similarity(caption_embeddings, paper_embeddings)

        return comparisons

    def compare_rouge(self, caption_blocks, paper_blocks):
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

        return np.array(comparisons)

    def compare(self, id, segments, method='embedding', preprocess='extract', normalize=False, ratio=0.5, is_load=False):
        """
        Compare the captions to the blocks
        """
        # Read caption blocks
        caption_blocks = self._read_caption_blocks(id, segments)

        # Read paper blocks
        if not is_load:
            paper_blocks = self._read_paper_blocks(id)
            paper_block_ids = list(map(lambda x: x['id'], paper_blocks))
            if preprocess == 'extract':
                paper_blocks = list(map(lambda x: self.extract_salient(x['text']), paper_blocks))
            elif preprocess == 'summarize':
                paper_blocks = self.summarize(list(map(lambda x: x['text'], paper_blocks)))
            else:
                paper_blocks = list(map(lambda x: x['text'], paper_blocks))
        else:
            paper_embeddings, paper_blocks = self.load_embeddings(id, preprocess)
            paper_block_ids = paper_embeddings[:, 0]
            paper_embeddings = paper_embeddings[:, 1:]

        # Compare the blocks based on method
        if method == 'embedding':
            caption_embeddings = self.embedder.encode(caption_blocks)
            if not is_load:
                paper_embeddings = self.embedder.encode(paper_blocks)
            comparisons = self.compare_embedding(caption_blocks, paper_blocks)
        elif method == 'rouge':
            comparisons = self.compare_rouge(caption_blocks, paper_blocks)
        elif method == 'joint':
            caption_embeddings = self.embedder.encode(caption_blocks)
            if not is_load:
                paper_embeddings = self.embedder.encode(paper_blocks)
            comparisons_embed = self.compare_embedding(caption_embeddings, paper_embeddings)
            comparisons_rouge = self.compare_rouge(caption_blocks, paper_blocks)
            if normalize:
                row_sums = comparisons_embed.sum(axis=1)
                comparisons_embed = comparisons_embed / row_sums[:, np.newaxis]
                row_sums = comparisons_rouge.sum(axis=1)
                comparisons_rouge = comparisons_rouge / row_sums[:, np.newaxis]

            comparisons = comparisons_embed * ratio + comparisons_rouge * (1 - ratio)

        return comparisons, paper_block_ids
    
    def mapping(self, id, mappings, comparison_matrix, paper_block_ids, top_k=5):
        """
        Map the segments to the blocks
        """
        paper_blocks = self._read_paper_blocks(id)

        clip_id = None
        for i, mapping in enumerate(mappings):
            if len(mapping['blocks']) > 0:
                for blk_id in mapping['blocks']:
                    idx = np.where(paper_block_ids == blk_id)[0]
                    if idx >= 0:
                        comparison_matrix[:, idx] = 0
            else:
                clip_id = i

        # Get the top k blocks
        transition_vector = np.full(comparison_matrix.shape[1], 0.6)
        if clip_id != 0:
            prev_mapping = mappings[clip_id - 1]
            if len(prev_mapping['blocks']) > 0:
                blk_id = prev_mapping['blocks'][0]
                block_indices = [i for i, block in enumerate(paper_blocks) if block['id'] <= blk_id]
                main_block = paper_blocks[block_indices[-1]]
                block_indices = list(filter(lambda idx: paper_blocks[idx]['section'] != main_block['section'], block_indices))
                transition_vector[block_indices] = 0.4
            
        top_blocks = np.argsort(comparison_matrix[clip_id]*transition_vector)[-top_k:]
        top_blocks = top_blocks[::-1]
        top_blocks = top_blocks.tolist()
        top_blocks = list(map(lambda x: paper_block_ids[x], top_blocks))

        return top_blocks


    def evaluate(self, predicted, actual, paper_block_ids, top_k=5):
        predicted_top = np.argsort(predicted, axis=1)[:, -top_k:]
        
        total = 0
        correct = 0

        for i in range(predicted.shape[0]): # For each clip
            is_text = False
            
            predicted_blocks = list(map(lambda idx: paper_block_ids[idx], predicted_top[i]))

            for block_id in actual[i]:
                if block_id not in paper_block_ids: continue
                is_text = True
                if block_id in predicted_blocks:
                    correct += 1
                    break
            
            if is_text: 
                total += 1
        
        return correct, total
    
    def evaluate_random(self, id, actual, top_k=5):
        paper_blocks = self._read_paper_blocks(id)
        paper_block_ids = list(map(lambda x: x['id'], paper_blocks))

        first_in_section_ids = []
        curr_section = ""
        for i in range(len(paper_blocks)):
            if paper_blocks[i]['section'] != curr_section:
                first_in_section_ids.append(paper_blocks[i]['id'])
                curr_section = paper_blocks[i]['section']

        correct = 0
        total = 0

        for i in range(len(actual)): # For each clip
            is_text = False
            
            predicted_blocks = random.sample(first_in_section_ids, top_k)

            for block_id in actual[i]:
                if block_id not in paper_block_ids: continue
                is_text = True
                if block_id in predicted_blocks:
                    correct += 1
                    break
            
            if is_text: 
                total += 1

        return correct, total


if __name__ == "__main__":
    comparer = Comparer(
        blocks_dir="../data/blocks",
        captions_dir="../data/captions",
        embeds_dir='../data/embeddings',
        model_name='sentence-transformers/all-MiniLM-L6-v2' #allenai-specter
    )

    annotation_dir = "../data/annotation"

    not_include = ["3491102.3501873", "3491102.3501967", "3462204.3481761"]
    ids = [
        "10.1145.3449140", "3411764.3445776", "3462204.3481761", "3472749.3474777", "3491102.3501873", 
        "3491102.3501931", "3491102.3501967", "3491102.3502081", "3491102.3502087", "3491102.3517505",
        "3491102.3517729"
    ]
    
    is_separate = False

    if is_separate:
        total_correct_emb = 0
        total_correct_rouge = 0
        total_count = 0
        for id in ids:
            if id in not_include: continue

            segments, actual_comparisons = read_annotated_clips(f"{annotation_dir}/{id}.json")

            for i in range(2):
                if i == 0:
                    comparisons, paper_block_ids = comparer.compare(id, segments, method='embedding')
                else:
                    comparisons, paper_block_ids = comparer.compare(id, segments, method='rouge')

                correct, total = comparer.evaluate(comparisons, actual_comparisons, paper_block_ids, top_k=5)
                print(f"{id} - {correct} / {total}")

                if i == 0:
                    total_correct_emb += correct
                    total_count += total
                else:
                    total_correct_rouge += correct
        
        print()
        print(f"EMBEDDING ACCURACY: {total_correct_emb/total_count}")
        print(f"ROUGE ACCURACY: {total_correct_rouge/total_count}")
    else:
        total_correct = 0
        total_count = 0
        total_random_correct = 0
        for id in ids:
            if id in not_include: continue

            segments, actual_comparisons = read_annotated_clips(f"{annotation_dir}/{id}.json")
            predicted_comparisons, block_ids = comparer.compare(id, segments, method='joint')
            results = comparer.evaluate(
                predicted_comparisons, 
                actual_comparisons, 
                block_ids,
                top_k=1
            )

            print(f"{id} - {results[0]} / {results[1]}")

            total_count += 1 #results[1]
            total_correct += results[0]/results[1]

            random_results = comparer.evaluate_random(id, actual_comparisons, top_k=1)
            total_random_correct += random_results[0]/random_results[1]

        print(total_correct, total_count)
        
        print()
        print(f"ACCURACY: {total_correct/total_count}")
        print(f"RANDOM ACCURACY: {total_random_correct/total_count}")