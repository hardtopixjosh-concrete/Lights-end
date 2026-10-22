# Incremental, original-quality publishing

The editable game remains in `sites/veyrath/dist/`. Keep local previews, asset builders and gameplay tests pointed there. Never recompress or resize artwork/audio to meet the Sites deployment archive limit.

Publishing uses a separate, ignored checkout at `.sites-runtime/publisher`. That checkout stores the exact runtime snapshot under `game-source/`, release metadata under `.openai/release.json`, and the small delivery Worker under `dist/server/index.js`. Do not publish the editable static dist directly with the old workflow. Preserve the existing Site project ID and public URL.

## Update sequence

1. Read GAME_REFERENCE.md and the newest relevant feature notes; preserve completed work and reuse its recorded checks. For publish-only requests, run no additional sound, gameplay, smoke, syntax or visual checks; minimize reading/tool calls. Keep required hashing, receipt matching and deployment confirmation; investigate actual publication failures only (user decision October 19).
2. Run `node tools/deploy/prepare.mjs --checkout ABSOLUTE_PUBLISHING_CHECKOUT` from the editable Site directory. This snapshots exact bytes, hashes each file and builds a Worker pinned to that manifest. No quality conversion takes place.
3. Run `node tools/deploy/upload.mjs --checkout ABSOLUTE_PUBLISHING_CHECKOUT` from the editable Site directory. It reuses objects in the live release, checks only newly encountered hashes, and uploads only missing bytes. An interrupted upload is resumable. It does not change the live release.
4. Inspect `.openai/local/upload-receipt.json` in the publishing checkout. Require its release ID to match `.openai/release.json` and its workerHash to match the current plan. Do not deploy before upload succeeds. If `unchanged` is true, the exact runtime and delivery Worker are already live: skip commit, packaging and deployment and report already current.
5. Use the Sites skill's native credential and source-helper workflow **from the publishing checkout**, then save/deploy the exact returned source commit and tiny archive. The generated Worker embeds the manifest hash. Retain saved-version and deployment receipts.
6. Record actual uploaded/reused counts and bytes in log-publishing.md. Sync the root/mirrored references. Do not repeat successful gameplay checks during packaging.

The first migration uploads all unique objects once. A no-change upload sends **zero object bytes**; a code-only edit reuses all artwork/audio. Git source synchronization also transfers only missing Git objects.

## Delivery and rollback

Runtime files are stored under SHA-256 keys in the Site's BUCKET R2 binding. Uploads validate checksums, keep exact source bytes, and cannot overwrite an existing object. A release manifest maps paths to hashes. Nothing is automatically garbage-collected: old releases remain available for in-flight sessions and rollback.

HTML sets a release-specific base URL. Code and relative asset requests stay pinned to that release; binary requests redirect to the same immutable content URL when bytes are unchanged. Browser caching can therefore reuse images, GLB models and audio across builds. HTTP ranges are supported for audio. The Worker also uses edge caching where the platform supports it; do not claim measured cache savings without telemetry.

Native Sites rollback to an earlier Worker version restores that version's pinned manifest. Never delete old objects while retained releases may reference them. A future garbage collector must compute retained-manifest reachability and require an explicit retention policy.

## Credentials and limits

The upload endpoint requires ASSET_UPLOAD_TOKEN stored as a **secret** in Sites runtime settings. No token belongs in source, HTML, logs, manifests or command arguments. On Windows, its local copy is encrypted with the current user's DPAPI at ignored `.openai/local/asset-upload-token.dpapi`. The uploader reads it internally; never print it. Another OS can supply VEYRATH_ASSET_UPLOAD_TOKEN through its secret manager. If the credential is lost, rotate it in Sites, redeploy the current Worker to apply the environment revision, then protect the replacement locally.

The current upload endpoint accepts an individual object up to 96 MiB; this is not a total-game limit. If an individual file grows larger, add a streaming/multipart upload path or split its delivery container without reducing source quality. Do not silently alter media. Plan storage/request/traffic limits still apply; content addressing reduces redundant transfers, not all hosting usage.

Game saves remain in the original browser/launcher profile and origin. This change does not move saves into R2 or touch player data.

## Initial migration

The one-time bootstrap includes the previous static game under `dist/client` while provisioning the R2 Worker. After the full-quality snapshot uploads, normal releases contain only the delivery Worker, not bundled media. Keep the bootstrap snapshot available locally until migration is verified. Original high-quality boss images were restored byte-for-byte from source commit 6eb2ce9; never reapply the unapproved quality-78 compression from 2d9d944.
