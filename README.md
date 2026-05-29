# BNI Referral Contact Generator

This is a static web app for BNI members to paste a list of names (optionally with companies) and instantly get LinkedIn, Facebook and Google search links. It also provides "Open all" buttons and shareable URLs to speed up networking.

## How to use
- Enter one person per line in the textarea. You can optionally start the line with the requester's name followed by a colon; this name will be shown in its own column and won't affect the search.
- Links are generated automatically as you type.
- Use **Open all in LinkedIn**, **Open all in Facebook** or **Open all in Google** to launch every search in a new tab (appears when there are at least two names).
- Use **Copy shareable link** to generate a URL with your list embedded. Share it with the rest of the chapter to save time and increase referrals.
- Optionally add the meeting name and date; they will be included in the shareable URL.

## Deployment on Vercel
1. Push this repo to GitHub.
2. In [Vercel](https://vercel.com), click **New Project** → Import Git Repository.
3. Select this repo, set:
   - Framework: **Other**
   - Build Command: *(leave blank)*
   - Output Directory: `.`
4. Deploy — you’ll get a live URL like `https://yourproject.vercel.app`.
