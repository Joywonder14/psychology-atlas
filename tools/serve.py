#!/usr/bin/env python3
"""Local preview with Markdown rebuilds. No packages required."""
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
import threading
import time
import webbrowser
import argparse
import os
import json
from build import build, ROOT

revision=0
def stamp():
    return tuple((str(p),p.stat().st_mtime_ns) for folder in ('knowledge','app') for p in sorted((ROOT/folder).rglob('*')) if p.is_file() and not p.name.startswith('._'))
def watch():
    global revision
    previous=stamp()
    while True:
        time.sleep(1)
        current=stamp()
        if current!=previous:
            previous=current
            try: build();revision+=1
            except Exception as error:print('内容暂未更新，请检查编辑格式：',error,flush=True)
class Handler(SimpleHTTPRequestHandler):
    def __init__(self,*args,**kwargs):super().__init__(*args,directory=str(ROOT/'dist'),**kwargs)
    def do_GET(self):
        if self.path=='/__version':
            self.send_response(200);self.send_header('Content-Type','application/json');self.send_header('Cache-Control','no-store');self.end_headers();self.wfile.write(json.dumps({'version':revision}).encode())
        else:super().do_GET()
    def log_message(self,*args):pass
if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--port',type=int,default=8765);parser.add_argument('--no-open',action='store_true');args=parser.parse_args()
    build()
    try:server=ThreadingHTTPServer(('127.0.0.1',args.port),Handler)
    except OSError as error:raise SystemExit(f'端口 {args.port} 已被使用。关闭已有预览，或用 --port 8766 指定其他端口。')
    threading.Thread(target=watch,daemon=True).start()
    url=f'http://127.0.0.1:{args.port}/'
    print(f'心理学图谱：{url}\n保存 Markdown 后网页内容会自动更新。按 Control-C 关闭。',flush=True)
    if not args.no_open:webbrowser.open(url)
    try:server.serve_forever()
    except KeyboardInterrupt:server.server_close()
