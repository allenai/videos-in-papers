import os
import sys
from flask import Blueprint, jsonify, request, current_app, send_from_directory
from random import randint
from time import sleep
import json
from typing import List, Tuple

from app.video_handler import download_video, split_video
from app.paper_handler import get_paper, process_paper_blocks
from app.pipeline.comparer import Comparer

from app.db import db, Log

env = os.getenv('FLASK_ENV', 'production')
DIR_PATH = '/api/app'
if env == 'production':
    DIR_PATH = '/skiff_files/apps/paper-video-nav'

# Takes a list of strings and filters out any empty strings
def clean_str_list(input: List[str]) -> List[str]:
    # get rid of empty spaces ' ' => ''
    stripped = [s.strip() for s in input]
    # filter out empty elements eg. ''
    return list(filter(None, stripped))

def create_api() -> Blueprint:
    """
    Creates an instance of your API. If you'd like to toggle behavior based on
    command line flags or other inputs, add them as arguments to this function.
    """
    api = Blueprint('api', __name__)

    comparer = Comparer(
        blocks_dir=f"{DIR_PATH}/data/blocks",
        captions_dir=f"{DIR_PATH}/data/captions",
        embeds_dir=f"{DIR_PATH}/data/embeddings",
        model_name='sentence-transformers/all-MiniLM-L6-v2'
    )

    def error(message: str, status: int = 400) -> Tuple[str, int]:
        return jsonify({ 'error': message}), status

    # This route simply tells anything that depends on the API that it's
    # working. If you'd like to redefine this behavior that's ok, just
    # make sure a 200 is returned.
    @api.route('/')
    def index() -> Tuple[str, int]:
        return '', 204

    # The route below is an example API route. You can delete it and add
    # your own.
    @api.route('/api/solve', methods=['POST'])
    def solve():
        data = request.json
        if data is None:
            return error("No request body")

        question = data.get("question")
        if question is None or len(question.strip()) == 0:
            return error('Please enter a question.')

        choices = data.get("choices", [])
        cleaned_choices = clean_str_list(choices)
        if len(cleaned_choices) == 0:
            return error('Please enter at least choice value.')

        # We use a randomly generated index to choose our answer
        rand_index = randint(0, len(cleaned_choices)-1)
        selected = cleaned_choices[rand_index]

        # We use a randomly generated value between 0 and 100 to make a fake score
        random_value = randint(0, 100)
        # We produce a score with no actual meaning, it's just for demonstration
        # purposes
        score = random_value - 50 if random_value > 50 else random_value - 0

        answer = {
            'answer': selected,
            'score': score
        }
        current_app.logger.info(answer)

        # Create simulated latency. You should definitely remove this. It's
        # just so that the API actually behaves like one we'd expect you to
        # build
        sleep(randint(1,3))

        return jsonify(answer)

    @api.route('/api/annotation/<path:path>')
    def annotation(path):
        if(os.path.isfile(DIR_PATH + '/data/annotation/' + path)):
            return send_from_directory(DIR_PATH + '/data/annotation/', path)
        else:
            return jsonify({'clips': {}, 'highlights': {}, 'syncSegments': {}})

    @api.route('/api/pdf/<path:path>')
    def pdf(path):
        return send_from_directory(f"{DIR_PATH}/data/pdf/", path)

    @api.route('/api/clips/<path:path>')
    def clips(path):
        return send_from_directory(f"{DIR_PATH}/data/clips/", path)

    @api.route('/api/blocks/<path:path>')
    def blocks(path):
        return send_from_directory(f"{DIR_PATH}/data/blocks/", path)

    @api.route('/api/captions/<path:path>')
    def captions(path):
        return send_from_directory(f"{DIR_PATH}/data/captions/", path)

    @api.route('/api/process_video', methods=["POST"])
    def process_video():
        data = request.json
        if data is None:
            return error("No request body")

        doi = data.get("doi")
        video_url = data.get("url")

        try:
            download_video(video_url, doi, video_path=f"{DIR_PATH}/data/clips", caption_path=f"{DIR_PATH}/data/captions")
            return jsonify({'message': 200})
        except AssertionError as e:
            print(e)
            return jsonify({'message': 400, 'error': str(e)})
        except Exception as e:
            print(e)
            return jsonify({'message': 400, 'error': str(e)})

    @api.route('/api/process_paper', methods=['POST'])
    def process_paper():
        data = request.json
        if data is None:
            return error("No request body")

        doi = data.get("doi")
        paper_url = data.get("url")

        try:
            get_paper(paper_url, doi, f"{DIR_PATH}/data/pdf")
            process_paper_blocks(doi, f"{DIR_PATH}/data/pdf", f"{DIR_PATH}/data/blocks", f"{DIR_PATH}/data/parsed_pdf", comparer)
            return jsonify({'message': 200})
        except AssertionError as e:
            print(e)
            return jsonify({'message': 400, 'error': str(e)})
        except Exception as e:
            print(e)
            return jsonify({'message': 400, 'error': str(e)})

    @api.route('/api/get_annotations', methods=['POST'])
    def get_annotations():
        data = request.json
        if data is None:
            return error("No request body")

        doi = data.get("doi")
        userId = data.get("userId")
        
        if(os.path.isfile(DIR_PATH + '/data/annotation/' + doi + '.json')):
            return send_from_directory(DIR_PATH + '/data/annotation/', doi + '.json')
        else:
            return jsonify({'clips': {}, 'highlights': {}, 'syncSegments': {}})

    @api.route('/api/save_annotations', methods=['POST'])
    def save_annotations():
        data = request.json
        if data is None:
            return error("No request body")

        doi = data.get("doi")
        clips = data.get("clips")
        highlights = data.get('highlights')
        syncSegments = data.get('syncSegments')

        with open(f"{DIR_PATH}/data/annotation/{doi}.json", 'w') as f:
            json.dump({'highlights': highlights, 'clips': clips, 'syncSegments': syncSegments}, f)

        try:
            split_video(doi, f"{DIR_PATH}/data/clips", clips)
            return jsonify({'message': 200})
        except AssertionError as e:
            print(e)
            return jsonify({'message': 400, 'error': str(e)})
        except Exception as e:
            print(e)
            return jsonify({'message': 400, 'error': str(e)})

    @api.route('/api/suggest_blocks', methods=['POST'])
    def suggest_blocks():
        data = request.json
        if data is None:
            return error("No request body")

        doi = data.get("doi")
        mappings = data.get("mappings")
        mappings.sort(key=lambda x: x['start'])
        segments = list(map(lambda x: [x['start'], x['end']], mappings))

        try:
            predicted_comparisons, block_ids = comparer.compare(doi, segments, method='joint', is_load=True)
            predicted_blocks = comparer.mapping(doi, mappings, predicted_comparisons, block_ids)

            return jsonify({'message': 200, 'suggestions': predicted_blocks})
        except AssertionError as e:
            print(e)
            return jsonify({'message': 400, 'error': str(e)})
        except Exception as e:
            print(e)
            return jsonify({'message': 400, 'error': str(e)})


    @api.route('/api/log_action', methods=['POST'])
    def log_action():
        data = request.json
        if data is None:
            return error("No request body")

        doi = data.get("doi")
        userId = data.get("userId")
        action = data.get("action")
        timestamp = data.get("timestamp")
        data = data.get("data")

        # save the action
        try:
            log = Log(doi=doi, userId=userId, action=action, timestamp=timestamp, data=data)
            db.session.add(log)
            db.session.commit()

            return jsonify({'message': 200})
        except AssertionError as e:
            print(e)
            return jsonify({'message': 400, 'error': str(e)})
        except Exception as e:
            print(e)
            return jsonify({'message': 400, 'error': str(e)})

    @api.route('/api/get_file_list/<string:key_secret>', methods=['GET'])
    def get_file_list(key_secret):
        if os.getenv('KEY_SECRET') != key_secret:
            return jsonify({'message': 400, 'error': 'Error'})
        else:
            try: 
                folders = ['clips', 'blocks', 'captions', 'pdf', 'annotation']
                files = {}
                for folder in folders:
                    files[folder] = os.listdir(f"{DIR_PATH}/data/{folder}")
                return jsonify(files)
            except AssertionError as e:
                print(e)
                return jsonify({'message': 400, 'error': str(e)})
            except Exception as e:
                print(e)
                return jsonify({'message': 400, 'error': str(e)})

    @api.route('/api/get_log/<string:key_secret>', methods=['GET'])
    def get_log(key_secret):
        if os.getenv('KEY_SECRET') != key_secret:
            return jsonify({'message': 400, 'error': 'Error'})
        else:
            try:
                logs = Log.query.all()
                return jsonify([log.to_dict() for log in logs])
            except AssertionError as e:
                print(e)
                return jsonify({'message': 400, 'error': str(e)})
            except Exception as e:
                print(e)
                return jsonify({'message': 400, 'error': str(e)})

    return api