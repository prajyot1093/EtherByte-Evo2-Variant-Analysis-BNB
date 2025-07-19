#!/usr/bin/env python3
"""
Startup script for Evo2 Genomic Analysis API
"""
import os
import sys
import logging
from pathlib import Path

# Add current directory to Python path
sys.path.append(str(Path(__file__).parent))

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

def setup_environment():
    """Setup environment variables"""
    
    # Load environment variables from .env file if it exists
    env_file = Path(__file__).parent / ".env"
    if env_file.exists():
        from dotenv import load_dotenv
        load_dotenv(env_file)
        print(f"✅ Loaded environment from {env_file}")
    
    # Set default values if not present
    os.environ.setdefault("API_HOST", "0.0.0.0")
    os.environ.setdefault("API_PORT", "8000")
    os.environ.setdefault("API_RELOAD", "True")
    
    # Blockchain configuration
    os.environ.setdefault("BNB_TESTNET_RPC", "https://data-seed-prebsc-1-s1.binance.org:8545")
    
    print("🔧 Environment configured")

def check_dependencies():
    """Check if required packages are installed"""
    required_packages = [
        "fastapi",
        "uvicorn", 
        "pydantic",
        "web3",
        "httpx"
    ]
    
    missing_packages = []
    
    for package in required_packages:
        try:
            __import__(package)
        except ImportError:
            missing_packages.append(package)
    
    if missing_packages:
        print("❌ Missing required packages:")
        for package in missing_packages:
            print(f"   - {package}")
        print("\n💡 Install missing packages with:")
        print(f"   pip install {' '.join(missing_packages)}")
        return False
    
    print("✅ All required packages are installed")
    return True

def main():
    """Main startup function"""
    print("🚀 Starting Evo2 Genomic Analysis API...")
    
    # Setup environment
    setup_environment()
    
    # Check dependencies
    if not check_dependencies():
        sys.exit(1)
    
    # Import and run the API
    try:
        import uvicorn
        from api_server import app
        
        host = os.getenv("API_HOST", "0.0.0.0")
        port = int(os.getenv("API_PORT", "8000"))
        reload = os.getenv("API_RELOAD", "True").lower() == "true"
        
        print(f"🌐 API will be available at: http://localhost:{port}")
        print(f"📚 API Documentation: http://localhost:{port}/docs")
        print("🔄 Starting server...")
        
        uvicorn.run(
            "api_server:app",
            host=host,
            port=port,
            reload=reload,
            log_level="info"
        )
        
    except Exception as e:
        print(f"❌ Failed to start API server: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
