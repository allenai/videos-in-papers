from flask import Blueprint, jsonify, request, current_app
from random import randint
from time import sleep
from typing import List, Tuple

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

    return api
