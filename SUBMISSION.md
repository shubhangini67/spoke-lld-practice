# CipherSchools submission

**Project:** Spoke  
**What it is:** a small LLD practice app (choose problem → design → feedback → revise)  
**Repo:** https://github.com/shubhangini67/spoke-lld-practice  
**Live:** https://spoke-lld-practice.vercel.app

I built this as a 2-day MVP. Please start with the live site (or `npm run dev` locally), then the notes below.

## Open these first

| File | What it is |
| --- | --- |
| [RESEARCH.md](RESEARCH.md) | Why existing LLD practice is broken, and what I thought a useful attempt looks like |
| [DESIGN.md](DESIGN.md) | How I modelled the platform (Attempt, Design, evaluation split, trade-offs) |
| [AI_USAGE.md](AI_USAGE.md) | Calls I accepted / rejected from the assistant, and what I still wrote myself |
| [README.md](README.md) | How to run it, screenshots, HLD + LLD diagrams |

## Fast demo

1. Open the site (dark/light toggle is in the header, Home is always there).
2. Pick **Parking Lot** → Start an attempt.
3. Click **Load example** (fills a discussable design, not a golden class list).
4. Submit. You should get a review with coverage evidence, not “you didn’t name it ParkingSpot”.
5. Try **Revise for the follow-up**. That clones the attempt and drops the EV prompt into notes. The old attempt stays frozen.

You can also start empty and hit Submit anyway. The domain error comes back from `validateForSubmit`, the button is not magically disabled.

## Run locally

Need Node 20+.

```bash
npm install
npm test
npm run dev
```

Then http://localhost:3000

`OPENAI_API_KEY` is optional. Without it the checker still scores. I left it off for the default demo.

Tests I care about for the brief: Stall still covers assignment, god-class penalty, LLM throw does not kill the attempt, crash → `evaluation_failed` + retry, revise does not mutate the parent, follow-up seeds the prompt.

## Stack (short)

Next.js + TypeScript. Domain lives in `src/domain` and does not import Next or `fs`. Attempts go to `data/attempts.json` locally. On Vercel that file is under `/tmp`, so history can vanish if the instance recycles. Fine for a demo, I would swap the store later.

No login. That was on purpose for a 2-day build, not because I forgot.
