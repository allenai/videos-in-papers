import os
import sys
import json
import random
import string
import traceback
from time import sleep
from flask import Blueprint, jsonify, request, current_app, send_from_directory
from typing import List, Tuple

from app.video_handler import download_video, split_video, convert_video, process_captions
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
            print('Error: No request body')
            return {'message': 400, 'error': 'No request body'}

        question = data.get("question")
        if question is None or len(question.strip()) == 0:
            return error('Please enter a question.')

        choices = data.get("choices", [])
        cleaned_choices = clean_str_list(choices)
        if len(cleaned_choices) == 0:
            return error('Please enter at least choice value.')

        # We use a randomly generated index to choose our answer
        rand_index = random.randint(0, len(cleaned_choices)-1)
        selected = cleaned_choices[rand_index]

        # We use a randomly generated value between 0 and 100 to make a fake score
        random_value = random.randint(0, 100)
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
        sleep(random.randint(1,3))

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

    @api.route('/api/process_video_url', methods=["POST"])
    def process_video_url():
        data = request.json
        if data is None:
            print('Error: No request body')
            return {'message': 400, 'error': 'No request body'}

        doi = data.get("doi")
        # replace backslash with dot
        doi = doi.replace('/', '.')
        video_url = data.get("url")

        try:
            # check if file exists
            if(os.path.isfile(f"{DIR_PATH}/data/clips/{doi}/full.mp4")):
                return jsonify({'message': 200, 'error': 'DOI already exists.'})

            download_video(video_url, doi, video_path=f"{DIR_PATH}/data/clips", caption_path=f"{DIR_PATH}/data/captions")
            return jsonify({'message': 200})
        except AssertionError as e:
            error = str(e) + '\n' + traceback.format_exc()
            # write error into data/error.log
            with open(f"{DIR_PATH}/data/error.log", 'a+') as f:
                f.write(error)
            return jsonify({'message': 400, 'error': error})
        except Exception as e:
            error = str(e) + '\n' + traceback.format_exc()
            with open(f"{DIR_PATH}/data/error.log", 'a+') as f:
                f.write(error)
            return jsonify({'message': 400, 'error': error})

    @api.route('/api/process_video_file', methods=["POST"])
    def process_video_file():
        if 'file' not in request.files:
            with open(f"{DIR_PATH}/data/error.log", 'a+') as f:
                f.write('Error: No file part')
            return {'message': 400, 'error': 'No selected file'}

        doi = request.form.get("doi")
        # replace backslash with dot
        doi = doi.replace('/', '.')
        file = request.files['file']

        if file.filename == '':
            with open(f"{DIR_PATH}/data/error.log", 'a+') as f:
                f.write(error)
            return {'message': 400, 'error': 'No selected file'}

        try:
            if not os.path.exists(f"{DIR_PATH}/data/clips/{doi}"):
                os.makedirs(f"{DIR_PATH}/data/clips/{doi}")

            # check if file exists
            # if(os.path.isfile(f"{DIR_PATH}/data/clips/{doi}/full.mp4")):
            #     return jsonify({'message': 200, 'error': 'DOI already exists.'})

            if '.mp4' in file.filename:
                file.save(os.path.join(f"{DIR_PATH}/data/clips/{doi}", 'full.mp4'))
            else:
                file.save(os.path.join(f"{DIR_PATH}/data/clips/{doi}", file.filename))
                convert_video(f"{DIR_PATH}/data/clips/{doi}/{file.filename}", f"{DIR_PATH}/data/clips/{doi}/full.mp4")
            return jsonify({'message': 200})
        except AssertionError as e:
            error = str(e) + '\n' + traceback.format_exc()
            with open(f"{DIR_PATH}/data/error.log", 'a+') as f:
                f.write(error)
            return jsonify({'message': 400, 'error': error})
        except Exception as e:
            error = str(e) + '\n' + traceback.format_exc()
            with open(f"{DIR_PATH}/data/error.log", 'a+') as f:
                f.write(error)
            return jsonify({'message': 400, 'error': error})

    @api.route('/api/process_caption_file', methods=["POST"])
    def process_caption_file():
        if 'file' not in request.files:
            print('Error: No file part')
            return {'message': 400, 'error': 'No selected file'}

        doi = request.form.get("doi")
        # replace backslash with dot
        doi = doi.replace('/', '.')
        file = request.files['file']

        if file.filename == '':
            return {'message': 400, 'error': 'No selected file'}

        try:
            # check if file exists
            # if(os.path.isfile(f"{DIR_PATH}/data/captions/{doi}.json")):
            #     return jsonify({'message': 200, 'error': 'DOI already exists.'})

            file.save(f"{DIR_PATH}/data/captions/{doi}_{file.filename}")
            process_captions(f"{DIR_PATH}/data/captions/{doi}_{file.filename}", f"{DIR_PATH}/data/captions/{doi}.json")
            return jsonify({'message': 200})
        except AssertionError as e:
            error = str(e) + '\n' + traceback.format_exc()
            with open(f"{DIR_PATH}/data/error.log", 'a+') as f:
                f.write(error)
            return jsonify({'message': 400, 'error': error})
        except Exception as e:
            error = str(e) + '\n' + traceback.format_exc()
            with open(f"{DIR_PATH}/data/error.log", 'a+') as f:
                f.write(error)
            return jsonify({'message': 400, 'error': error})

    @api.route('/api/process_paper_url', methods=['POST'])
    def process_paper_url():
        data = request.json
        if data is None:
            print('Error: No request body')
            return {'message': 400, 'error': 'No request body'}

        doi = data.get("doi")
        # replace backslash with dot
        doi = doi.replace('/', '.')
        paper_url = data.get("url")

        try:
            if(os.path.isfile(f"{DIR_PATH}/data/blocks/{doi}.json")):
                with open(f"{DIR_PATH}/data/tokens.json", 'r') as f:
                    tokens = json.load(f)

                if doi in tokens:
                    token = tokens[doi]
                    return jsonify({'message': 200, 'token': token})

            get_paper(paper_url, doi, f"{DIR_PATH}/data/pdf")
            process_paper_blocks(doi, f"{DIR_PATH}/data/pdf", f"{DIR_PATH}/data/blocks", f"{DIR_PATH}/data/parsed_pdf", comparer)

            # if token file exists read it
            tokens = {}
            if os.path.exists(f"{DIR_PATH}/data/tokens.json"):
                with open(f"{DIR_PATH}/data/tokens.json", 'r') as f:
                    tokens = json.load(f)
            
            # create random 16 character token
            token = ''.join(random.choices(string.ascii_uppercase + string.digits, k=16))
            tokens[doi] = token

            # write token file
            with open(f"{DIR_PATH}/data/tokens.json", 'w') as f:
                json.dump(tokens, f)

            return jsonify({'message': 200, 'token': token})
        except AssertionError as e:
            error = str(e) + '\n' + traceback.format_exc()
            with open(f"{DIR_PATH}/data/error.log", 'a+') as f:
                f.write(error)
            return jsonify({'message': 400, 'error': error})
        except Exception as e:
            error = str(e) + '\n' + traceback.format_exc()
            with open(f"{DIR_PATH}/data/error.log", 'a+') as f:
                f.write(error)
            return jsonify({'message': 400, 'error': error})

    @api.route('/api/process_paper_file', methods=['POST'])
    def process_paper_file():
        if 'file' not in request.files:
            print('Error: No selected file')
            return {'message': 400, 'error': 'No file part'}

        doi = request.form.get("doi")
        # replace backslash with dot
        doi = doi.replace('/', '.')
        file = request.files['file']

        if file.filename == '':
            return {'message': 400, 'error': 'No selected file'}

        try:
            # if(os.path.isfile(f"{DIR_PATH}/data/blocks/{doi}.json")):
            #     with open(f"{DIR_PATH}/data/tokens.json", 'r') as f:
            #         tokens = json.load(f)

            #     if doi in tokens:
            #         token = tokens[doi]
            #         return jsonify({'message': 200, 'token': token})
            
            file.save(os.path.join(f"{DIR_PATH}/data/pdf", doi + '.pdf'))
            process_paper_blocks(doi, f"{DIR_PATH}/data/pdf", f"{DIR_PATH}/data/blocks", f"{DIR_PATH}/data/parsed_pdf", comparer)

            # if token file exists read it
            tokens = {}
            if os.path.exists(f"{DIR_PATH}/data/tokens.json"):
                with open(f"{DIR_PATH}/data/tokens.json", 'r') as f:
                    tokens = json.load(f)
            
            # create random 16 character token
            token = ''.join(random.choices(string.ascii_uppercase + string.digits, k=16))
            tokens[doi] = token

            # write token file
            with open(f"{DIR_PATH}/data/tokens.json", 'w') as f:
                json.dump(tokens, f)

            return jsonify({'message': 200, 'token': token})
        except AssertionError as e:
            error = str(e) + '\n' + traceback.format_exc()
            with open(f"{DIR_PATH}/data/error.log", 'a+') as f:
                f.write(error)
            return jsonify({'message': 400, 'error': error})
        except Exception as e:
            error = str(e) + '\n' + traceback.format_exc()
            with open(f"{DIR_PATH}/data/error.log", 'a+') as f:
                f.write(error)
            return jsonify({'message': 400, 'error': error})

    @api.route('/api/get_annotations', methods=['POST'])
    def get_annotations():
        data = request.json
        if data is None:
            print('Error: No request body')
            return {'message': 400, 'error': 'No request body'}

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
            print('Error: No request body')
            return {'message': 400, 'error': 'No request body'}

        doi = data.get("doi")
        clips = data.get("clips")
        highlights = data.get('highlights')
        syncSegments = data.get('syncSegments')

        captions = []
        with open(f"{DIR_PATH}/data/captions/{doi}.json", 'r') as f:
            captions = json.load(f)

        new_clips = {}
        # TODO: check if there are any long enough not used clips and add it to clips
        last_time = None
        last_clip = None
        sorted_clips = sorted(clips.items(), key=lambda x: x[1]['start'])
        for clip_id, clip in sorted_clips:
            if last_time is not None and clips[clip_id]['start'] - last_time > 5000:
                new_clip_id = str(int(last_clip) * -1 - 10)
                new_clips[new_clip_id] = {
                    "id": new_clip_id,
                    "start": last_time,
                    "end": clips[clip_id]['start'],
                    "highlights": [],
                    "position": 0,
                    "top": 0,
                    "page": 0,
                    "captions": list(filter(lambda x: (last_time <= x['start'] and x['start'] <= clips[clip_id]['start']) or (last_time <= x['end'] and x['end'] <= clips[clip_id]['start']), captions))
                }

            new_clips[clip_id] = clips[clip_id]
            last_time = clips[clip_id]['end']
            last_clip = clip_id

        clips = new_clips

        with open(f"{DIR_PATH}/data/annotation/{doi}.json", 'w') as f:
            json.dump({'highlights': highlights, 'clips': clips, 'syncSegments': syncSegments}, f)

        try:
            split_video(doi, f"{DIR_PATH}/data/clips", clips)
            return jsonify({'message': 200})
        except AssertionError as e:
            error = str(e) + '\n' + traceback.format_exc()
            with open(f"{DIR_PATH}/data/error.log", 'a+') as f:
                f.write(error)
            return jsonify({'message': 400, 'error': error})
        except Exception as e:
            error = str(e) + '\n' + traceback.format_exc()
            with open(f"{DIR_PATH}/data/error.log", 'a+') as f:
                f.write(error)
            return jsonify({'message': 400, 'error': error})

    @api.route('/api/suggest_blocks', methods=['POST'])
    def suggest_blocks():
        data = request.json
        if data is None:
            print('Error: No request body')
            return {'message': 400, 'error': 'No request body'}

        doi = data.get("doi")
        mappings = data.get("mappings")
        mappings.sort(key=lambda x: x['start'])
        segments = list(map(lambda x: [x['start'], x['end']], mappings))

        try:
            predicted_comparisons, block_ids = comparer.compare(doi, segments, method='joint', is_load=True)
            predicted_blocks = comparer.mapping(doi, mappings, predicted_comparisons, block_ids)

            return jsonify({'message': 200, 'suggestions': predicted_blocks})
        except AssertionError as e:
            error = str(e) + '\n' + traceback.format_exc()
            with open(f"{DIR_PATH}/data/error.log", 'a+') as f:
                f.write(error)
            return jsonify({'message': 400, 'error': error})
        except Exception as e:
            error = str(e) + '\n' + traceback.format_exc()
            with open(f"{DIR_PATH}/data/error.log", 'a+') as f:
                f.write(error)
            return jsonify({'message': 400, 'error': error})


    @api.route('/api/log_action', methods=['POST'])
    def log_action():
        data = request.json
        if data is None:
            print('Error: No request body')
            return {'message': 400, 'error': 'No request body'}

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
            error = str(e) + '\n' + traceback.format_exc()
            with open(f"{DIR_PATH}/data/error.log", 'a+') as f:
                f.write(error)
            return jsonify({'message': 400, 'error': error})
        except Exception as e:
            error = str(e) + '\n' + traceback.format_exc()
            with open(f"{DIR_PATH}/data/error.log", 'a+') as f:
                f.write(error)
            return jsonify({'message': 400, 'error': error})

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
                error = str(e) + '\n' + traceback.format_exc()
                with open(f"{DIR_PATH}/data/error.log", 'a+') as f:
                    f.write(error)
                return jsonify({'message': 400, 'error': error})
            except Exception as e:
                error = str(e) + '\n' + traceback.format_exc()
                with open(f"{DIR_PATH}/data/error.log", 'a+') as f:
                    f.write(error)
                return jsonify({'message': 400, 'error': error})

    @api.route('/api/get_log/<string:key_secret>', methods=['GET'])
    def get_log(key_secret):
        if os.getenv('KEY_SECRET') != key_secret:
            return jsonify({'message': 400, 'error': 'Error'})
        else:
            try:
                logs = Log.query.all()
                return jsonify([log.to_dict() for log in logs])
            except AssertionError as e:
                error = str(e) + '\n' + traceback.format_exc()
                with open(f"{DIR_PATH}/data/error.log", 'a+') as f:
                    f.write(error)
                return jsonify({'message': 400, 'error': error})
            except Exception as e:
                error = str(e) + '\n' + traceback.format_exc()
                with open(f"{DIR_PATH}/data/error.log", 'a+') as f:
                    f.write(error)
                return jsonify({'message': 400, 'error': error})

    @api.route('/api/get_token_list/<string:key_secret>', methods=['GET'])
    def get_token_list(key_secret):
        if os.getenv('KEY_SECRET') != key_secret:
            return jsonify({'message': 400, 'error': 'Error'})
        else:
            try:
                with open(f"{DIR_PATH}/data/tokens.json", 'r') as f:
                    tokens = json.load(f)
                return jsonify(tokens)
            except AssertionError as e:
                error = str(e) + '\n' + traceback.format_exc()
                with open(f"{DIR_PATH}/data/error.log", 'a+') as f:
                    f.write(error)
                return jsonify({'message': 400, 'error': error})
            except Exception as e:
                error = str(e) + '\n' + traceback.format_exc()
                with open(f"{DIR_PATH}/data/error.log", 'a+') as f:
                    f.write(error)
                return jsonify({'message': 400, 'error': error})

    @api.route('/api/get_error_log/<string:key_secret>', methods=['GET'])
    def get_error_log(key_secret):
        if os.getenv('KEY_SECRET') != key_secret:
            return jsonify({'message': 400, 'error': 'Error'})
        else:
            try:
                with open(f"{DIR_PATH}/data/error.log", 'r') as f:
                    return jsonify(f.read())
            except AssertionError as e:
                error = str(e) + '\n' + traceback.format_exc()
                with open(f"{DIR_PATH}/data/error.log", 'a+') as f:
                    f.write(error)
                return jsonify({'message': 400, 'error': error})
            except Exception as e:
                error = str(e) + '\n' + traceback.format_exc()
                with open(f"{DIR_PATH}/data/error.log", 'a+') as f:
                    f.write(error)
                return jsonify({'message': 400, 'error': error})

    @api.route('/api/check_start_key/<string:key_secret>', methods=['GET'])
    def check_start_key(key_secret):
        try:
            if os.getenv('START_KEY_SECRET') != key_secret:
                return jsonify({'message': 200, 'correct': False})
            else:
                return jsonify({'message': 200, 'correct': True})
        except AssertionError as e:
            error = str(e) + '\n' + traceback.format_exc()
            with open(f"{DIR_PATH}/data/error.log", 'a+') as f:
                f.write(error)
            return jsonify({'message': 400, 'error': error})
        except Exception as e:
            error = str(e) + '\n' + traceback.format_exc()
            with open(f"{DIR_PATH}/data/error.log", 'a+') as f:
                f.write(error)
            return jsonify({'message': 400, 'error': error})

    @api.route('/api/check_author_token/<string:doi>/<string:token>', methods=['GET'])
    def check_author_token(doi, token):
        try:
            with open(f"{DIR_PATH}/data/tokens.json", 'r') as f:
                data = json.load(f)
                if doi in data and data[doi] == token:
                    return jsonify({'message': 200, 'correct': True})
                elif not doi in data and data['default'] == token:
                    return jsonify({'message': 200, 'correct': True})
                else:
                    return jsonify({'message': 200, 'correct': False})
        except AssertionError as e:
            error = str(e) + '\n' + traceback.format_exc()
            with open(f"{DIR_PATH}/data/error.log", 'a+') as f:
                f.write(error)
            return jsonify({'message': 400, 'error': error})
        except Exception as e:
            error = str(e) + '\n' + traceback.format_exc()
            with open(f"{DIR_PATH}/data/error.log", 'a+') as f:
                f.write(error)
            return jsonify({'message': 400, 'error': error})

    return api