# Stratified sampling: pick a party, then an MP

Each round samples a party uniformly from the eight Riksdag parties, then a random MP from that party. The naive alternative — uniform sampling over all 349 MPs — was rejected because party sizes range from ~107 (S) to ~16 (L), making "always guess S" a 30%+ optimal-guess baseline that would collapse the game into calibration. Stratified sampling keeps the optimal-guess baseline at the random-guess baseline (12.5%) and makes per-party accuracy directly comparable in stats.

**Vildar handling under stratified sampling:** politiska vildar are *not* a 9th sampling stratum. They're sampled inside the party they were originally elected to (so they appear at the natural "rare event" rate). The right answer at scoring time is still `Partilös`, per [ADR-0001](0001-partilos-button.md). Treating Partilös as a 9th stratum would make vildar appear in 11% of rounds despite being 1–3 people — wildly distorting.
