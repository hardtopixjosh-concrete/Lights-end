# Light's End

Browser action roguelite with online co-op. This repository contains the current editable game, selected original-quality runtime assets, launcher source, tools, tests, and project references.

## Play

[Play Light's End](https://veyrath-desert-roguelite.jestudios.chatgpt.site)

## Run locally

From the repository root, run:

```sh
python -m http.server 8080 --directory sites/veyrath/dist
```

Open http://localhost:8080. The browser game requires no build step. See `launcher/README.md` for the Electron launcher.

## Development

Read `AGENTS.md` and `GAME_REFERENCE.md` before changes. Game source is in `sites/veyrath/dist/`; tests and asset preparation tools are alongside it. Original design PDFs and full asset packs remain local and are excluded. Prepared runtime assets retain their original bytes; third-party asset rights remain with their respective owners (see `docs/ASSET_CATALOG.md`). No blanket redistribution license is granted by this repository.

The existing Site identity and exact-byte asset delivery workflow are preserved; see `docs/ASSET_DELIVERY.md`. Publishing requires separately provisioned credentials, which are not included. This GitHub snapshot does not change the live deployment or player saves.
