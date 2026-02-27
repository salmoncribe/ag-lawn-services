import sqlite3
import json

conn = sqlite3.connect("data/local.db")
conn.row_factory = sqlite3.Row
cur = conn.cursor()

cur.execute("SELECT * FROM clips ORDER BY created_at DESC LIMIT 1")
row = cur.fetchone()

if row:
    print(dict(row))
else:
    print("No clips found")
