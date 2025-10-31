Coin Dash Runner — Global Edition
--------------------------------
What you received:
- index.html          -> Main HTML (EN/AR auto-detect)
- style.css           -> Modern responsive styles with parallax layers
- game.js             -> Game logic + hooks for ads and localization
- manifest.json       -> Web app manifest (optional)
- README.txt          -> This file

How to use:
1) Unzip and upload the folder to Netlify, GitHub Pages, or itch.io (choose HTML5/Browser Game).
2) For GitHub Pages:
   - Create a repo and push these files to the main branch.
   - Enable GitHub Pages in repo Settings -> Pages -> Branch: main -> / (root).
3) For Netlify:
   - Drag & drop the folder or a zip onto Netlify dashboard.
4) For itch.io:
   - Create a new project, choose 'HTML' and upload the ZIP.

Ads / Monetization:
- In game.js there are two hook functions:
    showInterstitialAd();
    showRewardedAd();
  Replace these with the ad provider's SDK calls (GameMonetize, CrazyGames, GameDistribution).
- The revive button simulates rewarded ad logic; integrate your provider to grant real rewards.

Customization tips:
- Swap the SVG logo in index.html with your own.
- Add short audio files (.ogg/.mp3) and implement playSound() in game.js.
- Tweak colors in style.css and change developer name in index.html (element #devName).

Good luck with publishing! If you want, I can:
- Provide the ZIP for download now.
- Add a small preview GIF (I can generate game screenshots).
- Integrate a sample rewarded-ad snippet for GameMonetize or CrazyGames.

Made by Saudz Games (placeholder). Good luck!
