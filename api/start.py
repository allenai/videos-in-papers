import argparse
import os
import sys
import logging
from typing import Tuple
from gevent.pywsgi import WSGIServer
from flask import Flask, Response, request, jsonify
from app.api import create_api
from app.utils import StackdriverJsonFormatter
from werkzeug.middleware.proxy_fix import ProxyFix

def start():
    """
    Starts up a HTTP server attached to the provider port, and optionally
    in development mode (which is ideal for local development but unideal
    for production use).
    """
    parser = argparse.ArgumentParser(description='Starts your application\'s HTTP server.')
    parser.add_argument(
        '--port',
        '-p',
        help='The port to listen on',
        default=8000
    )
    args = parser.parse_args()

    # We change a few things about the application's behavior depending on this
    # value. If it's set to "production" we:
    #
    #   1. Emit JSON serialized logs
    #   2. Use a "production-class" WSGI server
    #   3. Don't watch the filesystem for code changes
    #
    # If the value is anything other than "production" settings are applied
    # that are appropriate when working locally. The biggest change being that
    # Flask watches the source code for changes and restarts automatically
    # when they occur.
    #
    # We default to `"production"` as that's what Flask does:
    # https://flask.palletsprojects.com/en/2.0.x/config/#environment-and-debug-features
    env = os.getenv('FLASK_ENV', 'production')

    # Locally we don't specify any handlers, which causes `basicConfig` to set
    # up one for us that writes human readable messages.
    handlers = None

    # If we're in production we setup a handler that writes JSON log messages
    # in a format that Google likes.
    is_prod = env == 'production'
    if is_prod:
        json_handler = logging.StreamHandler()
        json_handler.setFormatter(StackdriverJsonFormatter())
        handlers = [ json_handler ]

    logging.basicConfig(
        level=os.environ.get('LOG_LEVEL', default=logging.INFO),
        handlers=handlers
    )
    logger = logging.getLogger()
    logger.debug("AHOY! Let's get this boat out to water...")

    app = Flask("app")

    # Bind the API functionality to our application. You can add additional
    # API endpoints by editing api.py.
    logger.debug("Starting: init API...")
    app.register_blueprint(create_api(), url_prefix='/')
    logger.debug("Complete: init API...")

    # In production we use a HTTP server appropriate for production.
    if is_prod:
        logger.debug("Starting: gevent.WSGIServer...")
        # There are two proxies -- the one that's run as a sibling of this process, and
        # the Ingress controller that runs on the cluster.
        # See: https://skiff.allenai.org/templates.html
        num_proxies = 2
        proxied_app = ProxyFix(app, x_for=num_proxies, x_proto=num_proxies, x_host=num_proxies,
                               x_port=num_proxies)
        http_server = WSGIServer(('0.0.0.0', args.port), proxied_app, log=logger,
            error_log=logger)
        app.logger.info(f'Server listening at http://0.0.0.0:{args.port}')
        http_server.serve_forever()
    else:
        logger.debug("Starting: Flask development server...")
        num_proxies = 1
        proxied_app = ProxyFix(app, x_for=num_proxies, x_proto=num_proxies, x_host=num_proxies,
                               x_port=num_proxies)
        app.run(host='0.0.0.0', port=args.port)

if __name__ == '__main__':
    start()

