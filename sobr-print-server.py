#!/usr/bin/env python3
"""
Very simple HTTP server in python for logging requests
Usage::
    ./sobr-print-server.py [<port>]
"""
from escpos.printer import Usb
from http.server import BaseHTTPRequestHandler, HTTPServer
from systemd.journal import JournaldLogHandler
import logging
import json
import ssl

# get an instance of the logger object this module will use
logger = logger = logging.getLogger(__name__)

# instantiate the JournaldLogHandler to hook into systemd
journald_handler = JournaldLogHandler()

# set a formatter to include the level name
journald_handler.setFormatter(logging.Formatter(
    '[%(levelname)s] %(message)s'
))

# add the journald handler to the current logger
logger.addHandler(journald_handler)

# optionally set the logging level
logger.setLevel(logging.INFO)

# Connect to USB printer
p = Usb(0x0416, 0x5011, profile="POS-5890")

def print_text(text):
    p.text(text + "\n")

class S(BaseHTTPRequestHandler):
    def _set_response(self):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()

    def do_GET(self):
        logger.info("GET request,\nPath: %s\nHeaders:\n%s\n", str(self.path), str(self.headers))
        self._set_response()
        self.wfile.write(json.dumps(True).encode('utf-8'))

    def do_POST(self):
        content_length = int(self.headers['Content-Length']) # <--- Gets the size of data
        post_data = self.rfile.read(content_length) # <--- Gets the data itself
        text = post_data.decode('utf-8')
        logger.info("POST request,\nPath: %s\nHeaders:\n%s\n\nBody:\n%s\n",
                str(self.path), str(self.headers), text)
        self._set_response()
        self.wfile.write(json.dumps(True).encode('utf-8'))
        print_text(text)
        print_text("\n\n")

def run(server_class=HTTPServer, handler_class=S, port=8888):
    server_address = ('', port)
    httpd = server_class(server_address, handler_class)
    httpd.socket = ssl.wrap_socket (httpd.socket,
        keyfile="/home/pi/letsencrypt/live/sobr.co/privkey.pem",
        certfile='/home/pi/letsencrypt/live/sobr.co/fullchain.pem', server_side=True)
    logger.info('Starting httpd...\n')
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
    httpd.server_close()
    logger.info('Stopping httpd...\n')

if __name__ == '__main__':
    from sys import argv

    if len(argv) == 2:
        run(port=int(argv[1]))
    else:
        run()
