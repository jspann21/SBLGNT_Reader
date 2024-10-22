import os
import json
import csv

# Define the directory where the JSON files are located
json_folder = './'  # This assumes the JSON files are in the same directory as the script
output_csv = 'all_data.csv'

# List to hold all rows
csv_rows = []

# Iterate through all JSON files in the directory
for filename in os.listdir(json_folder):
    if filename.endswith('.json'):
        with open(os.path.join(json_folder, filename), 'r', encoding='utf-8') as json_file:
            data = json.load(json_file)
            # Navigate through the nested dictionary structure
            for book, chapters in data.items():
                for chapter, verses in chapters.items():
                    for verse, entries in verses.items():
                        for entry in entries:
                            # Flatten the data into a single row
                            row = [
                                entry.get('book_chapter_verse', ''),
                                entry.get('metadata', ''),
                                entry.get('pos_tag', ''),
                                entry['word_forms'][0] if len(entry.get('word_forms', [])) > 0 else '',
                                entry['word_forms'][1] if len(entry.get('word_forms', [])) > 1 else '',
                                entry['word_forms'][2] if len(entry.get('word_forms', [])) > 2 else '',
                                entry['word_forms'][3] if len(entry.get('word_forms', [])) > 3 else '',
                                entry.get('mounce_chapter', ''),
                                entry.get('gloss', ''),
                                entry.get('literal', ''),
                                entry.get('louw', ''),
                                entry.get('strong', ''),
                                entry.get('type', '')
                            ]
                            csv_rows.append(row)

# Define the headers for the CSV
csv_headers = ['book_chapter_verse', 'metadata', 'pos_tag', 'word_forms1', 'word_forms2', 'word_forms3', 'word_forms4', 'mounce_chapter', 'gloss', 'literal', 'louw', 'strong', 'type']

# Write the collected rows into a single CSV file
with open(output_csv, 'w', newline='', encoding='utf-8-sig') as csvfile:  # Added utf-8-sig encoding for better compatibility with Excel
    csvwriter = csv.writer(csvfile)
    csvwriter.writerow(csv_headers)
    csvwriter.writerows(csv_rows)

print(f"Data has been successfully exported to {output_csv}")
