# Adding and editing records

Each record is one JSON file in `data/<kind>/`. You can add or edit records in the GitHub website. You do not need to install anything.

## Add a record in the browser

1. Open the folder for the kind of record, such as `data/gita/`.
2. Open a similar record and copy its text.
3. Find the highest number in the folder and add one. If the last file is `oa-gita-000002.json`, the new one is `oa-gita-000003.json`.
4. Click **Add file**, then **Create new file**. Name the file with the new id and paste the text.
5. Change the `id` inside the file to match the file name. Edit the other fields.
6. Click **Commit changes**. Choose **Create a new branch** and open a pull request.

A check runs on every pull request. It tells you if a field is wrong or a link points to a record that does not exist. When the check passes, merge the pull request. The site updates in about a minute.

## Linking records

Records point to each other by id. A gīta names its composer as `"composer": "oa-person-000001"`, and a rendition names its gīta as `"gita": "oa-gita-000001"`. Add the person, rāga or tāḷa first, then link to it.

Gurus are listed on the śiṣya's record, in `gurus`. The guru's page lists the śiṣyas by itself.

## Writing the fields

- Spell a person's name the way that person writes it. Put other spellings in `alternates`.
- `name.en` is for display and may carry diacritics, such as `Kāmodī`. Put plain spellings, such as `Kamodi`, in `alternates`. Search finds both.
- Ids, field names and fixed values such as `"song_type": "chaupadi"` are always plain lower-case letters.
- Write the Odia text of a gīta stanza by stanza. The ghoṣā is stanza `0`.
- Cite every source in `sources`. See "Citing sources" below.
- A rendition needs no `name`. The site names it from the gīta and the people credited.
- If you add a record that is not from Odissi Music or Prateek Pattanaik, put your full name in `entered_by`, such as `"entered_by": ["First1 Last1"]`. A GitHub username such as `"@octocat"` is fine too. The record is then cited under your name. On a gīta or kābya the poet is the author and you are named as compiler. Records without it are cited to Prateek Pattanaik.
- Give every carrier a `rights` status. Do not add audio files to the repository. Link a YouTube or Internet Archive copy in `online` instead.

The full list of fields for each kind is in `schema/<kind>.schema.json`.

## Citing sources

Each book, article, website or recording is a source record in `data/source/`. Add the source once, then cite it by id from any record:

```json
"sources": [
  { "source": "oa-source-000002" },
  { "source": "oa-source-000001", "url": "https://odissimusic.co.in/index.php/raga/kamodi/" }
]
```

- Add `pages` for a book or article.
- Add `url` when you used one page of a website. Run `npm run archive` to add its Wayback Machine copy as `archive_url`.
- Mark a large website or database that many records draw on with `"contributing": true`. Records then name it without its authors. Its own page credits them.

The site builds a BibTeX entry for every source. All of them are in `sources.bib`.

## Add a new source

A source is a work: a book, a chapter, a journal article, a thesis, a website, a talk, a recording, a video, an interview, or an unpublished manuscript or draft. A GitHub issue or a chat about the archive is not a source. If someone tells you a fact there, cite the work it comes from, or add it to their unpublished draft.

Check the list of sources on the site first. If the source is already there, cite its id.

1. Open `data/source/` and find the highest number. If the last file is `oa-source-000004.json`, the new one is `oa-source-000005.json`.
2. Create the new file as in "Add a record in the browser" above. Copy a source of the same type as a start.
3. Fill in the fields. A book looks like this:

   ```json
   {
     "id": "oa-source-000005",
     "name": { "en": "Title of the book" },
     "type": "book",
     "authors": ["First1 Last1"],
     "publisher": "Name of the publisher",
     "place": "Cuttack",
     "date": "1975",
     "isbn": "978-81-00000-00-0",
     "language": "or",
     "record_status": "active",
     "superseded_by": null,
     "created_at": "2026-11-01",
     "updated_at": "2026-11-01"
   }
   ```

   - `name.en` is the title as printed. Add the Odia title in `name.or`.
   - `type` is one of `book`, `book_chapter`, `article`, `thesis`, `website`, `talk`, `recording`, `video`, `interview` or `unpublished`.
   - Write authors and editors by full name, as they write their own names. If a person has a record here, use the id instead, such as `"oa-person-000008"`.
   - For a chapter or an article, put the book or journal title in `in`, and the pages in `pages`.
   - For a book listed on WorldCat, add its OCLC number as `oclc`, such as `"1434248522"`.
   - For a website, add `url`. Run `npm run archive` to add `archive_url`.
   - Leave out any field you do not know.
4. Save, open a pull request and wait for the check to pass. Then cite the new id from your records.

The source gets its own page, with a BibTeX entry and a list of every record that cites it.

## Writing an archival note

An archival note is a formal note on a record, such as a doubt about who a poet was. It shows under its own heading, below the record's details. Add it to any record as `archival_note`:

```json
"archival_note": {
  "en": "First paragraph [@oa-source-000002, 12-14].\n\nSecond paragraph.",
  "by": ["oa-person-000012"]
}
```

- Leave a blank line (`\n\n`) between paragraphs.
- Citations come from the sources already in the archive. Each source page shows a citation code, such as `[@oa-source-000002]`, with a copy button.
- Copy the code and paste it into your text where the reference belongs.
- Add pages after a comma: `[@oa-source-000002, 12-14]`.
- This is the citation form that Zotero and Pandoc users already know.
- Only sources can be cited. If the source is not in the archive yet, add it first (see "Add a new source").
- `by` names the people who wrote the note. Use `or` for an Odia version.

The page numbers each citation and lists the sources under the text. The check stops a citation that is not a source.

## Merging two records

When two records turn out to be the same person or work, keep one. Move any names, sources and links from the other record into it. Then delete the other file. Ids are not final until the archive has ARKs, so no page is kept at the old address.

## Withdrawing a record

Never reuse an id or give it to another record. To withdraw a record, delete its file and add its id to the list in `data/tombstones.json`. Create that file if it is not there yet. The site then shows a short "withdrawn" page at the old address. The check refuses any new record that uses a withdrawn id.

## Working on your own computer

Install Node.js 20 or later. Run `npm install` once. Then:

- `npm run mint -- gita` prints the next free id.
- `npm run validate` checks every record.
- `npm run build` writes the site to `dist/`.
- `npm run archive` looks up Wayback Machine copies of cited pages. Add `-- --save` to archive pages that have no copy yet.

## Trying out design changes

Every page also has a copy under `/dev/`, such as `odissi.theofdn.org/dev/person/`, where you can try a new look without changing the main site. Nothing links to it. Search engines are asked to skip it.

- Edit `site-templates/dev/dev.css`. It loads after the main stylesheet, on `/dev/` pages only.
- Put pictures and patterns in `site-templates/dev/` and use them from `dev.css`.
- To add a picture to a list page, name it after the kind, such as `raga.png`. Put its credit in `raga-credit.html`.
- To check it on your computer, run `npm run build`. Then run `python3 -m http.server 8642` in `dist/` and open `localhost:8642/dev/`.
- Changes merged to `main` appear on the live `/dev/` in about a minute.

When a change is agreed, move it into `site-templates/static/styles.css`.

## Records imported from Odissi Music

Most records come from Odissi Music. Their citations link the original pages but have no `archive_url` yet. Run `npm run archive` to look them all up. It checks about 1,900 pages, a few seconds apart, so it takes a few hours.
