This repo contains the DVD extras for the Engelberg Center report [Unbalanced Interests](https://www.nyuengelberg.org/outputs/unbalanced-interests).  You can visit each of the extras at 1201.nyuengelberg.org/[name of folder] (for example 1201.nyuengelberg.org/2003media).

In addition to the code that powers these pages, this repo also has data used to generate them.

## Cloudflare Pages Deployment Instructions

1. As imported from `https://github.com/blprnt/burdenofproof`, `data/occurrences_2015_r2.jsonl` is too large for cloudflare pages to deploy. The fix is to split it into two files and update the reference in the sketch.

```
split -l 138169 burdenofproof/explore/data/occurrences_2015_r2.jsonl burdenofproof/explore/data/occurrences_2015_r2_part
# rename the two output files:
mv burdenofproof/explore/data/occurrences_2015_r2_partaa burdenofproof/explore/data/occurrences_2015_r2a.jsonl
mv burdenofproof/explore/data/occurrences_2015_r2_partab burdenofproof/explore/data/occurrences_2015_r2b.jsonl
rm burdenofproof/explore/data/occurrences_2015_r2.jsonl
```

Then at `burdenofproof/explore/sketch.js` in the `OCC_FILES` array replace:

`'data/occurrences_2015_r2.jsonl',`

with 

```
'data/occurrences_2015_r2a.jsonl',
'data/occurrences_2015_r2b.jsonl',
```

2. The cloudflare build settings are:

**Framework**: none

**Build command**:
`cd burdenofproof && jekyll build --destination ../_site/burdenofproof && cd .. && cp -r 2003media _site/2003media && cp -r leaderboard _site/leaderboard && cp _redirects _site/_redirects`

**Build output directory**: `_site`