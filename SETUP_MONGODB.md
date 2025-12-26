# MongoDB Setup Guide

## Installation

### Windows
1. Download MongoDB Community Server from https://www.mongodb.com/try/download/community
2. Run the installer and follow the setup wizard
3. MongoDB will be installed as a Windows service by default

### macOS
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

### Linux (Ubuntu/Debian)
```bash
sudo apt-get update
sudo apt-get install -y mongodb
sudo systemctl start mongodb
sudo systemctl enable mongodb
```

## Configuration

Update `backend/app/core/config.py` or create a `.env` file:

```python
database_url = "mongodb://localhost:27017"
database_name = "emolit_db"
```

## Running MongoDB

### Windows
MongoDB should start automatically as a service. If not:
```bash
net start MongoDB
```

### macOS/Linux
```bash
mongod --dbpath /path/to/data/directory
```

## Verify Installation

Connect to MongoDB shell:
```bash
mongosh
```

Or check if it's running:
```bash
# Windows
sc query MongoDB

# macOS/Linux
brew services list
# or
sudo systemctl status mongodb
```

## Default Connection
- Host: `localhost`
- Port: `27017`
- Database: `emolit_db` (created automatically on first use)

