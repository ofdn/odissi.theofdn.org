# Adding and editing records

Each record is one JSON file in `data/<kind>/`. You can add or edit records in the GitHub website. You do not need to install anything.

## Enter data on the site

Open https://odissi.theofdn.org/enter-data/ while signed in to GitHub. You need write access to the repository.

1. Choose the kind of record and fill in the form. Search for linked records by name.
2. Click **Add to the list**. Add as many records as you like. A new record can link to another new one in the list.
3. To add many at once, download the CSV template, fill in one record per row, and choose the file.
4. Click **Send to GitHub**. Check the issue that opens and submit it.

Each record becomes its own pull request, with the issue linked. New records that link to each other share one. If a record fails the check, the issue says why. Merge the pull requests to publish them.

## Add a record in the browser

1. Open the folder for the kind of record, such as `data/gita/`.
2. Open a similar record and copy its text.
3. Click **Add file**, then **Create new file**. Name it `new-gita-` and a short word, such as `new-gita-kadamba.json`. See "Choosing an id" below.
4. Paste the text. Set the `id` inside to the same name, then edit the other fields.
5. Click **Commit changes**. Choose **Create a new branch** and open a pull request.

A check runs on every pull request. It tells you if a field is wrong or a link points to a record that does not exist. When the check passes, merge the pull request. The site updates in about a minute.

## Choosing an id

You don't choose the number. Name a new file `new-<kind>-<word>.json`, such as `data/gita/new-gita-kadamba.json`, and use the same name as its `id`. Other new records link to it by that name.

When the pull request is merged, each new record gets the next free id. Every link to it changes too. Records merged one after another never share a number.

Never reuse an id, even after its file is deleted. The check refuses ids listed in `data/tombstones.json`.

## Linking records

Records point to each other by id. A gīta names its composer as `"composer": "oa-person-000001"`, and a rendition names its gīta as `"gita": "oa-gita-000001"`. Add the person, rāga or tāḷa first, then link to it.

Gurus are listed on the śiṣya's record, in `gurus`. The guru's page lists the śiṣyas by itself.

## Writing the fields

- Spell a person's name the way that person writes it. Put other spellings in `alternates`.
- Citations put the last word of a name first, as the surname. If a name has no surname, such as Kali Charan, add `"as_written": true` to `name`.
- `name.en` is for display and may carry diacritics, such as `Kāmodī`. Put plain spellings, such as `Kamodi`, in `alternates`. Search finds both.
- Ids, field names and fixed values such as `"song_type": "chaupadi"` are always plain lower-case letters.
- Write the Odia text of a gīta stanza by stanza. The ghoṣā is stanza `0`.
- Cite every source in `sources`. See "Citing sources" below.
- A rendition needs no `name`. The site names it from the gīta and the people credited.
- Prateek Pattanaik is cited as editor of every record. If someone else edits a record with him, list both in `editors`, such as `"editors": ["Prateek Pattanaik", "First1 Last1"]`.
- Put your full name in `entered_by` when you add a record, such as `"entered_by": ["First1 Last1"]`. A GitHub username such as `"@octocat"` is fine too. It records who entered the data. Citations never use it: a gīta or kābya is cited to its poet, and Prateek Pattanaik is named as editor of the archive on every record.
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

When two records turn out to be the same person or work, keep one. Move any names, sources and links from the other record into it. Then withdraw the other record, as below, so its old address still opens a page.

## Withdrawing a record

Never reuse an id or give it to another record. To withdraw a record, delete its file and add its id to the list in `data/tombstones.json`. Create that file if it is not there yet. The site then shows a short "withdrawn" page at the old address. The check refuses any new record that uses a withdrawn id.

## Permanent links (ARKs)

Each record will get an ARK under O Foundation's NAAN 15056, such as `ark:15056/oa-gita-000001`. It opens through `https://n2t.net/ark:15056/oa-gita-000001`. ARKs are off until N2T sends them to this site.

To switch them on, open `scripts/lib/config.js`. Set `ARK_ON` to `true`. If the shoulder isn't the id's own `oa`, put it in `ARK_SHOULDER`. The build then writes a redirect page for each ARK, under `ark:15056/` and `ark:/15056/`, with and without hyphens. Every page shows its permanent link, and citations use it.

## Working on your own computer

Install Node.js 20 or later. Run `npm install` once. Then:

- `npm run validate` checks every record. It checks `new-…` files with the ids they'll get on merge.
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
