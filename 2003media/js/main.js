/* =============================================================
   1201 2003 Media Explorer — main.js
   ============================================================= */

'use strict';

// --- State ---
let works = [];
let player = null;
let playerReady = false;
let spinning = false;

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// --- DOM refs (populated after DOMContentLoaded) ---
let spinBtn, reels, resultDisplay, resultTitle, resultArtist,
    videoArea, youtubePlayerWrapper, noVideoMsg, pdfRow, pdfLink;

// =============================================================
// Data loading
// =============================================================

async function loadWorks() {
  const res = await fetch('works.json');
  works = await res.json();
}

// =============================================================
// Random selection (weighted by duplicates)
// =============================================================

function pickWork() {
  return works[Math.floor(Math.random() * works.length)];
}

// =============================================================
// Slot machine animation
// =============================================================

const REEL_FIELDS = ['title', 'artist', 'type'];
const SPIN_DURATION_MS = 2000;    // how long before decel begins
const REEL_STOP_STAGGER_MS = 350; // gap between each reel settling

// Returns a random short fragment from a random work for a given field.
function randomFragment(field) {
  const w = works[Math.floor(Math.random() * works.length)];
  const val = w[field] || w['title'];
  // Trim to ~18 chars at a word boundary so it fits the reel
  return val.length > 18 ? val.slice(0, 16) + '\u2026' : val;
}

function runSlotAnimation(selectedWork, onComplete) {
  spinning = true;
  spinBtn.disabled = true;

  const finalValues = buildFinalValues(selectedWork);

  // Skip animation entirely for users who prefer reduced motion
  if (prefersReducedMotion) {
    reels.forEach((reelEl, i) => {
      reelEl.querySelector('.reel-cell').textContent = finalValues[i];
    });
    showResult(selectedWork);
    spinning = false;
    spinBtn.disabled = false;
    onComplete(selectedWork);
    return;
  }

  const intervals = reels.map((reelEl, i) => {
    const baseSpeed = 60 + i * 25; // 60ms / 85ms / 110ms
    return setInterval(() => {
      reelEl.querySelector('.reel-cell').textContent = randomFragment(REEL_FIELDS[i]);
    }, baseSpeed);
  });

  // After SPIN_DURATION_MS, stop reels one by one
  setTimeout(() => {
    reels.forEach((reelEl, i) => {
      setTimeout(() => {
        clearInterval(intervals[i]);
        reelEl.querySelector('.reel-cell').textContent = finalValues[i];

        // Last reel stopped — reveal result and re-enable button
        if (i === reels.length - 1) {
          showResult(selectedWork);
          spinning = false;
          spinBtn.disabled = false;
          onComplete(selectedWork);
        }
      }, i * REEL_STOP_STAGGER_MS);
    });
  }, SPIN_DURATION_MS);
}

// Decides what each reel shows when it settles.
// Reel 1: title (possibly truncated)
// Reel 2: artist if present, otherwise type
// Reel 3: type (or second half of title if long)
function buildFinalValues(work) {
  const title = work.title || '';
  const artist = work.artist || '';
  const type = work.type || '';

  if (title.length > 20) {
    // Split long title across reels 1 and 2; reel 3 gets type
    const mid = title.lastIndexOf(' ', Math.floor(title.length / 2)) || Math.floor(title.length / 2);
    return [
      title.slice(0, mid) || title,
      title.slice(mid).trim() || (artist || type),
      type,
    ];
  }

  return [
    title,
    artist || '\u2014',
    type,
  ];
}

// =============================================================
// Result display
// =============================================================

function showResult(work) {
  resultTitle.textContent = work.title;

  if (work.artist) {
    resultArtist.textContent = work.artist;
    resultArtist.classList.remove('hidden');
  } else {
    resultArtist.textContent = '';
    resultArtist.classList.add('hidden');
  }

  resultDisplay.classList.remove('hidden');
}

// =============================================================
// YouTube IFrame Player API
// =============================================================

// Called by the YouTube IFrame API when the API script has loaded.
window.onYouTubeIframeAPIReady = function () {
  playerReady = false; // player itself is created lazily
};

function initOrLoadVideo(youtubeId) {
  videoArea.classList.remove('hidden');

  if (!youtubeId) {
    showFallback();
    return;
  }

  youtubePlayerWrapper.classList.remove('hidden');
  noVideoMsg.classList.add('hidden');

  if (!player) {
    // First use: create the player
    player = new YT.Player('youtube-player', {
      height: '360',
      width: '640',
      videoId: youtubeId,
      playerVars: {
        rel: 0,
        modestbranding: 1,
        autoplay: 1,
        origin: window.location.origin,
      },
      events: {
        onReady: function () { playerReady = true; },
        onError: function () { showFallback(); },
      },
    });
  } else {
    // Subsequent spins: swap video in existing player
    player.loadVideoById(youtubeId);
  }
}

function showFallback() {
  youtubePlayerWrapper.classList.add('hidden');
  noVideoMsg.classList.remove('hidden');
}

// =============================================================
// PDF link
// =============================================================

function updatePdfLink(work) {
  pdfLink.href = `https://cdn.loc.gov/copyright/1201/2003/reply/${work.sourceFile}.pdf`;
  pdfRow.classList.remove('hidden');
}

// =============================================================
// Main spin handler
// =============================================================

function handleSpin() {
  if (spinning) return;

  const selectedWork = pickWork();

  runSlotAnimation(selectedWork, function (work) {
    initOrLoadVideo(work.youtubeId);
    updatePdfLink(work);
  });
}

// =============================================================
// Init
// =============================================================

document.addEventListener('DOMContentLoaded', async function () {
  // Cache DOM refs
  spinBtn         = document.getElementById('spin-btn');
  reels           = [
    document.getElementById('reel-1'),
    document.getElementById('reel-2'),
    document.getElementById('reel-3'),
  ];
  resultDisplay   = document.getElementById('result-display');
  resultTitle     = document.getElementById('result-title');
  resultArtist    = document.getElementById('result-artist');
  videoArea            = document.getElementById('video-area');
  youtubePlayerWrapper = document.getElementById('youtube-player-wrapper');
  noVideoMsg      = document.getElementById('no-video-msg');
  pdfRow          = document.getElementById('pdf-row');
  pdfLink         = document.getElementById('pdf-link');

  spinBtn.addEventListener('click', handleSpin);

  try {
    await loadWorks();
  } catch (e) {
    console.error('Failed to load works.json:', e);
    spinBtn.disabled = true;
    spinBtn.textContent = 'ERROR LOADING DATA';
  }
});
