#!/bin/bash
# Quick start script for VarsityViz Milestone 9 prototype

echo "Starting VarsityViz prototype server..."
echo ""
echo "Open your browser to: http://localhost:8080"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

cd "$(dirname "$0")"
python3 -m http.server 8080

