# Adding and editing records

Each record is one JSON file in `data/<kind>/`. You can add or edit records in the GitHub website. You do not need to install anything.

## Add a record in the browser

1. Open the folder for the kind of record, such as `data/gita/`.
2. Open a similar record and copy its text.
3. Find the highest number in the folder and add one. If the last file is `om-gita-000002.json`, the new one is `om-gita-000003.json`.
4. Click **Add file**, then **Create new file**. Name the file with the new id and paste the text.
5. Change the `id` inside the file to match the file name. Edit the other fields.
6. Click **Commit changes**. Choose **Create a new branch** and open a pull request.

A check runs on every pull request. It tells you if a field is wrong or a link points to a record that does not exist. When the check passes, merge the pull request. The site updates in about a minute.

## Linking records

Records point to each other by id. A gīta names its poet as `"poet": "om-person-000001"`, and a rendition names its gīta as `"gita": "om-gita-000001"`. Add the person, rāga or tāḷa first, then link to it.

Gurus are listed on the śiṣya's record, in `gurus`. The guru's page lists the śiṣyas by itself.

## Writing the fields

- Spell a person's name the way that person writes it. Put other spellings in `alternates`.
- `name.en` is for display and may carry diacritics, such as `Kāmodī`. Put plain spellings, such as `Kamodi`, in `alternates`. Search finds both.
- Ids, field names and fixed values such as `"song_type": "chaupadi"` are always plain lower-case letters.
- Write the Odia text of a gīta stanza by stanza. The ghoṣā is stanza `0`.
- Cite every source in `sources`. See "Citing sources" below. Put your full name in `entered_by`.
- A rendition needs no `name`. The site names it from the gīta and the people credited.
- Give every carrier a `rights` status. Do not add audio files to the repository. Link a YouTube or Internet Archive copy in `online` instead.

The full list of fields for each kind is in `schema/<kind>.schema.json`.

## Citing sources

Each book, article, website or recording is a source record in `data/source/`. Add the source once, then cite it by id from any record:

```json
"sources": [
  { "source": "om-source-000002" },
  { "source": "om-source-000001", "url": "https://odissimusic.co.in/index.php/raga/kamodi/" }
]
```

- Add `pages` for a book or article.
- Add `url` when you used one page of a website. Run `npm run archive` to add its Wayback Machine copy as `archive_url`.
- Mark a large website or database that many records draw on with `"contributing": true`. Records then name it without its authors. Its own page credits them.

The site builds a BibTeX entry for every source. All of them are in `sources.bib`.

## Add a new source

Check the list of sources on the site first. If the source is already there, cite its id.

1. Open `data/source/` and find the highest number. If the last file is `om-source-000004.json`, the new one is `om-source-000005.json`.
2. Create the new file as in "Add a record in the browser" above. Copy a source of the same type as a start.
3. Fill in the fields. A book looks like this:

   ```json
   {
     "id": "om-source-000005",
     "name": { "en": "Title of the book" },
     "type": "book",
     "authors": ["First1 Last1"],
     "publisher": "Name of the publisher",
     "place": "Cuttack",
     "date": "1975",
     "isbn": "978-81-00000-00-0",
     "language": "or",
     "entered_by": ["Your full name"],
     "record_status": "active",
     "superseded_by": null,
     "created_at": "2026-11-01",
     "updated_at": "2026-11-01"
   }
   ```

   - `name.en` is the title as printed. Add the Odia title in `name.or`.
   - `type` is one of `book`, `book_chapter`, `article`, `thesis`, `website`, `recording`, `video`, `interview`, `unpublished` or `other`.
   - Write authors and editors by full name, as they write their own names. If a person has a record here, use the id instead, such as `"om-person-000008"`.
   - For a chapter or an article, put the book or journal title in `in`, and the pages in `pages`.
   - For a website, add `url`. Run `npm run archive` to add `archive_url`.
   - Leave out any field you do not know.
4. Save, open a pull request and wait for the check to pass. Then cite the new id from your records.

The source gets its own page, with a BibTeX entry and a list of every record that cites it.

## Working on your own computer

Install Node.js 20 or later. Run `npm install` once. Then:

- `npm run mint -- gita` prints the next free id.
- `npm run validate` checks every record.
- `npm run build` writes the site to `dist/`.
- `npm run archive` looks up Wayback Machine copies of cited pages. Add `-- --save` to archive pages that have no copy yet.
