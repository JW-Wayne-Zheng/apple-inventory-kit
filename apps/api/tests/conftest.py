import os

os.environ["INVENTORY_PROVIDER"] = "mock"
os.environ["PERSIST_INVENTORY"] = "false"
os.environ["REDIS_URL"] = "redis://127.0.0.1:6399/15"
