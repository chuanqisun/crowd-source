---
applyTo: "**/crowd.component.ts"
---

# RxJS flow design

- line$ contains current line content. Observe it distinc until changed. When it changes,
  1. cancel existing voice generation and playing
  2. start voice generation (but do not play the sound). Queue up the sound for playing later
- When editor idles, start playing the sound. Keep playing until all the sound from line$ is played
- When user presses escape, cancel all sound generation and playing
