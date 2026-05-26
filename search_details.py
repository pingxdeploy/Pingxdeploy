log_path = r"C:\Users\suvar\.gemini\antigravity\brain\f786931d-5227-4e33-b948-7936e5396d77\.system_generated\logs\overview.txt"
with open(log_path, 'r', encoding='utf-8') as f:
    content = f.read()

lines = content.split('\n')
for step_idx in [1129, 1150, 1156]:
    print("\n--- STEP %d ---" % step_idx)
    for line in lines:
        if ('"step_index":%d' % step_idx) in line or ('"step_index": %d' % step_idx) in line:
            # Print first 2000 chars of the raw line
            print(line[:2000])
