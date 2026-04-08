# My Story - Friend-Safe Template

This is a clean template copy of the autobiography capture app.

What has been sanitized in this copy:
- Personal entries removed from `entries/`
- Git history removed (fresh repository required)
- No default Worker URL in `app.js`
- Worker requires explicit `GITHUB_REPO` and `ALLOWED_ORIGIN`

## Quick Setup

1. Create a new GitHub repository (empty)
2. Push this folder to that new repo
3. Enable GitHub Pages for branch `main` and folder `/ (root)`
4. Deploy `worker/index.js` to Cloudflare Workers
5. In Worker settings, add secrets/vars:
   - `GITHUB_TOKEN` (fine-grained PAT with Contents read/write)
   - `GITHUB_REPO` (`owner/repo-name`)
   - `ALLOWED_ORIGIN` (`https://<username>.github.io`)
6. Open the app URL and set your Worker URL in Settings

## Entry Format

Entries are created as markdown files:

`entries/<chapter>/<optional-story>/YYYY-MM-DD_HH-MM_raw.md`

Each entry contains frontmatter:
- `date`
- `time`
- `chapter`
- `chapter_name`
- optional `story`
- optional `tags`

## Security Notes

- Do not hardcode production worker URLs in shared templates.
- Keep `GITHUB_TOKEN` only in Worker secrets, never in frontend code.
- Restrict Worker by `ALLOWED_ORIGIN` to your deployed app domain.
