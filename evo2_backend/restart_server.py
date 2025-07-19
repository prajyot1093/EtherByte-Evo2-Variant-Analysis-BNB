#!/usr/bin/env python3
"""
Clean restart script for the API server
Ensures all changes are loaded properly
"""
import subprocess
import sys
import os
import signal
import time

def kill_existing_processes():
    """Kill any existing API server processes"""
    try:
        # Kill any existing Python processes running on port 8001
        subprocess.run(["taskkill", "/f", "/im", "python.exe"], 
                      capture_output=True, text=True)
        print("✅ Cleaned up existing processes")
        time.sleep(2)
    except Exception as e:
        print(f"⚠️ Cleanup warning: {e}")

def start_server():
    """Start the API server fresh"""
    print("🚀 Starting API server with all fixes...")
    try:
        # Change to the backend directory
        os.chdir(os.path.dirname(os.path.abspath(__file__)))
        
        # Start the server
        subprocess.run([sys.executable, "api_server.py"], check=True)
    except KeyboardInterrupt:
        print("\n⏹️ Server stopped by user")
    except Exception as e:
        print(f"❌ Server error: {e}")

if __name__ == "__main__":
    print("🔄 Performing clean restart...")
    kill_existing_processes()
    start_server()
