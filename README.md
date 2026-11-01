# odissi.theofdn.org

An archive of Odissi music. It holds gītas, the kābyas they come from, their renditions, the discs and manuscripts that carry them, and the people, rāgas and tāḷas behind them.

Prateek Pattanaik leads the archive. It builds on his earlier work, including his site [Odissi Music](https://odissimusic.co.in/).

## Records

Each record is one JSON file in `data/<kind>/`, checked against `schema/<kind>.schema.json`.

- `gita`: a song, with its poet, mūḷa rāga and tāḷa, and full text by stanza.
- `kabya`: a long work made of many gītas, such as a campū.
- `rendition`: one recording, notation or manuscript copy of a gīta.
- `carrier`: a disc, tape, manuscript, book or online copy that holds renditions.
- `person`: a poet, guru, vocalist, instrumentalist, notator or scribe. Gurus are listed on the śiṣya's record.
- `raga`, `tala`: rāgas and tāḷas.
- `collection`: a personal, family or institutional collection.

Records link to each other by id, such as `om-raga-000001`. Names with diacritics are for display only. Search matches them with or without diacritics.

## Build

Install Node.js 20 or later. Then run:

```
npm install
npm run validate
npm run build
```

The site is written to `dist/`. To get the next free id for a new record, run `npm run mint -- gita`.

## Licence

Records and text are under CC BY-SA 4.0. See `LICENSE`.

The build is adapted from the [Registry of Type Design](https://github.com/ofdn/rtd). The page layout comes from [theofdn.org](https://github.com/ofdn/theofdn.org).
