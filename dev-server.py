#!/usr/bin/env python3
"""Servidor estático simple para desarrollo local.

Solo desactiva la caché para HTML/CSS/JS (los archivos que editamos
constantemente, para ver los cambios al instante). Las imágenes sí se
cachean con normalidad - si no, cosas como la precarga de la butaca
iluminada no sirven de nada, porque el navegador se ve obligado a
redescargarla en cuanto el JS la usa.
"""
import http.server

NO_CACHE_EXTENSIONS = (".html", ".css", ".js")

class DevHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        if self.path.endswith(NO_CACHE_EXTENSIONS) or self.path == "/":
            self.send_header("Cache-Control", "no-store, no-cache, must-revalidate")
        else:
            self.send_header("Cache-Control", "public, max-age=3600")
        super().end_headers()

if __name__ == "__main__":
    http.server.test(HandlerClass=DevHandler, port=5500)
