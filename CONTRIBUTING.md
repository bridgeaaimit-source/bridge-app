# BRIDGE Team Workflow

## First time setup (every team member)
npm i -g vercel
vercel login
vercel link
vercel env pull .env.local
npm install
npm run dev

## Every morning before starting work
git checkout develop
git pull origin develop
git checkout dev/yourname
git merge develop
npm run dev

## While working — commit every 1-2 hours
git add .
git commit -m "feat(pagename): what you built"

## Commit message format
feat(page): new feature
fix(page): bug fix
style(page): UI changes
refactor(page): cleanup

## End of day — push
git push origin dev/yourname

## When feature is ready
1. Push your branch: git push origin dev/yourname
2. Go to GitHub → New Pull Request
3. Base: develop ← Compare: dev/yourname
4. Fill the PR template
5. Tag Siddhesh as reviewer
6. DO NOT merge your own PR

## Golden rules
- Never push directly to main or develop
- Only touch your assigned pages (see CODEOWNERS)
- Never commit .env.local
- Never merge without Siddhesh's approval
