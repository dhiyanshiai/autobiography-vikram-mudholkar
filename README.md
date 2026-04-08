# My Story - Hosted Template (Vercel)

This version is prepared for easy remote access through a single Vercel link.

Your friend does not need to deploy anything.

## How It Works

- Frontend is hosted on Vercel
- Backend save API is `api/save-entry.js` on the same Vercel project
- Backend export API is `api/export-entries.js` for ZIP + Markdown drafting bundle
- API writes markdown files directly into the configured GitHub repository

## One-Time Vercel Setup (Owner Only)

1. Import this GitHub repo into Vercel
2. In Vercel Project Settings -> Environment Variables, add:
   - `GITHUB_TOKEN` = fine-grained PAT with `Contents: Read and write`
   - `GITHUB_REPO` = `dhiyanshiai/autobiography-vikram-mudholkar`
   - `BASIC_AUTH_USERNAME` = `dhiyanshiai`
   - `BASIC_AUTH_PASSWORD` = `saurav`
3. Deploy
4. Share the production URL with your friend

## Friend Usage

1. Open the shared Vercel URL
2. Select chapter/story
3. Record or type memory
4. Tap **Save to GitHub**
5. Tap **Export bundle** anytime to download all saved entries as:
   - `book-draft-bundle.md` (single combined draft file)
   - original entry markdown files inside the same ZIP

No setup is needed for normal usage.

## Optional Advanced Setting

- In app Settings, `Save API URL` defaults to `/api/save-entry`
- Change only if routing to another backend

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

## Chapter Defaults

- App starts with only one default chapter: `Childhood`
- User can add all other chapters from inside the app

## Security Notes

- Keep `GITHUB_TOKEN` only in Vercel environment variables
- Never hardcode token in frontend code
- Use a fine-grained token scoped to this single repository
- App/API access is protected using Basic Auth via `middleware.js`
