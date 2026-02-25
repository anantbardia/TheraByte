import os
import sys

# Ensure backend root is in path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from core.memory import store_memory, retrieve_relevant_memories

print("Testing storing memory...")
try:
    store_memory("vector_test_user", "user", "My secret pet iguana is named Bartholomew and he makes me anxious but I love him.")
    print("Store successful.")
except Exception as e:
    print(f"Store failed: {e}")

print("Testing retrieving memory...")
try:
    results = retrieve_relevant_memories("vector_test_user", "What is the name of my pet?")
    print(f"Retrieve results:\n{results}")
except Exception as e:
    print(f"Retrieve failed: {e}")
