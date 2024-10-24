from flask import Flask, request, send_from_directory, send_file, render_template
from flask_socketio import SocketIO, emit
import time
import requests


app = Flask("intros")
socketio = SocketIO(app, debug=True, cors_allowed_origins='*')

@app.route('/', methods=['GET'])
def index():
   return send_file('index.html')

@app.route('/fonts/<path:path>', methods=['GET'])
def fonts(path):
    return send_from_directory('fonts', path)

@app.route('/code.js', methods=['GET'])
def code():
    return send_file('code.js')

@app.route('/socket.io.js', methods=['GET'])
def socketio_js():
    return send_file('socket.io.js')

SCHEDULE_URL = "https://talks.nixcon.org/nixcon-2024/schedule/export/schedule.json"

cached_schedule = (None, None)

def load_schedule(force=False):
    global cached_schedule
    last_fetch = cached_schedule[0]
    now = time.time()
    if last_fetch is None or last_fetch + 15 < now:
        force = True

    if force:
        d = requests.get(SCHEDULE_URL).json()
        cached_schedule = (now, d)

    return cached_schedule[1]

@app.route('/schedule.json')
def schedule():
    return load_schedule()

@app.route('/logo.svg')
def logo():
    return send_file('logo.svg')

@app.route('/admin', methods=['GET'])
def admin_get():
    return render_template("admin.html")
    
@socketio.on("talk")
def on_talk(talk_id):
    socketio.emit("talk", talk_id)

if __name__ == "__main__":
    socketio.run(app)
