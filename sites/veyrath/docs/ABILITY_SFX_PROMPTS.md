# VEYRATH ability sound prompts

Prompts for an AI sound-effect generator (ElevenLabs Sound Effects, Stable Audio, etc.). One line per sound. Save each result with the **exact filename** given, in `Sounds/Abilities/`. Claude will then trim, normalize and wire the files into the game.

## How to generate

- **Variations:** make 3–4 of each and keep the best one. If two are both good, save the second with `-2` added (e.g. `pyro-fireball-cast-2.mp3`). The game will alternate between them so repeated casts don't sound identical.
- **Duration:** set it to the value in brackets. Short is better. The game handles the fade-out.
- **Prompt influence:** if the tool has this slider, keep it high (~0.6–0.8) so it follows the prompt.
- **What to keep:** clean one-shots only, with no music, voices or long reverb tails.
- **Shared prompt ending:** most lines end with the same phrase, *"stylized fantasy action game, punchy, clean, dry, no music"*. That keeps every sound in the same style.

**Cast** plays the moment you use the ability. **Impact** plays when it lands or explodes. Skip any impact you don't like; the game will fall back to the existing hit sound.

---

## Mage: shared

| File | Length | Prompt |
|---|---|---|
| `blink-cast.mp3` | 0.4s | Quick magical teleport whoosh, airy shimmer with a soft pop at the end, stylized fantasy action game, punchy, clean, dry, no music |

## Pyromancer

| File | Length | Prompt |
|---|---|---|
| `pyro-fireball-cast.mp3` | 0.6s | Fireball launched from a mage's hand, fast whooshing roar of flame with crackling embers, stylized fantasy action game, punchy, clean, dry, no music |
| `pyro-fireball-impact.mp3` | 0.8s | Fireball exploding on impact, deep fiery burst with crackling embers scattering, stylized fantasy action game, punchy, clean, dry, no music |
| `pyro-nova-cast.mp3` | 1.0s | Protective ring of fire igniting around a mage, rising flame whoosh with a warm crackling hum, stylized fantasy action game, punchy, clean, dry, no music |
| `pyro-chain-cast.mp3` | 1.0s | Wide wave of fire surging forward, roaring flamethrower burst that sweeps outward, stylized fantasy action game, punchy, clean, dry, no music |
| `pyro-meteor-cast.mp3` | 1.0s | Meteor summoned from the sky, descending fiery whistle getting louder and closer, stylized fantasy action game, clean, dry, no music |
| `pyro-meteor-impact.mp3` | 1.8s | Massive meteor crashing into desert ground, huge deep explosion with earth rumble and burning debris, stylized fantasy action game, punchy, clean, no music |

## Cryomancer

| File | Length | Prompt |
|---|---|---|
| `cryo-fireball-cast.mp3` | 0.8s | Road of ice spreading rapidly across the ground, crackling freezing ice forming with crystalline chimes, stylized fantasy action game, punchy, clean, dry, no music |
| `cryo-nova-cast.mp3` | 1.0s | Frost nova bursting outward from a mage, sharp icy blast that freezes everything, shattering crystal shimmer, stylized fantasy action game, punchy, clean, dry, no music |
| `cryo-chain-cast.mp3` | 0.6s | Glacial ice spell launched, cold whoosh with frosty crystalline sparkle, stylized fantasy action game, punchy, clean, dry, no music |
| `cryo-chain-impact.mp3` | 0.9s | Glacial ice explosion, heavy ice shattering burst with crystal shards breaking, stylized fantasy action game, punchy, clean, dry, no music |
| `cryo-meteor-cast.mp3` | 2.5s | Magical blizzard beginning, howling icy wind swelling with hail pelting the ground, stylized fantasy action game, clean, no music |

## Stormcaller

| File | Length | Prompt |
|---|---|---|
| `storm-fireball-cast.mp3` | 0.6s | Chain lightning bolt fired from a mage's hand, sharp electric crack and sizzling zap jumping between targets, stylized fantasy action game, punchy, clean, dry, no music |
| `storm-nova-cast.mp3` | 0.9s | Static electric shield charging up around a mage, buzzing crackle and rising electric hum, stylized fantasy action game, punchy, clean, dry, no music |
| `storm-chain-cast.mp3` | 1.5s | Magical lightning vortex forming, swirling wind and electricity spinning faster with a pulling whoosh, stylized fantasy action game, clean, dry, no music |
| `storm-meteor-cast.mp3` | 2.0s | Tempest storm summoned, rolling thunder with sharp lightning strikes cracking down, stylized fantasy action game, punchy, clean, no music |

## Blood Mage

| File | Length | Prompt |
|---|---|---|
| `blood-fireball-cast.mp3` | 1.2s | Dark blood magic drain beam, eerie low pulsing hum with a wet sucking siphon sound, stylized fantasy action game, clean, dry, no music |
| `blood-nova-cast.mp3` | 0.9s | Crimson blood barrier forming around a mage, thick liquid swirl hardening into a shield with a low magical thrum, stylized fantasy action game, punchy, clean, dry, no music |
| `blood-chain-cast.mp3` | 0.5s | Blood magic spell thrown, quick dark whoosh with a wet splatter tail, stylized fantasy action game, punchy, clean, dry, no music |
| `blood-chain-impact.mp3` | 0.8s | Blood bloom erupting from the ground, wet visceral burst splashing outward with a dark magical pulse, stylized fantasy action game, punchy, clean, dry, no music |
| `blood-meteor-cast.mp3` | 2.0s | Blood eclipse darkening the sky, deep ominous swelling drone with a heartbeat thump and distant whispers of magic, stylized fantasy action game, clean, no music |

---

## Warrior: Berserker

| File | Length | Prompt |
|---|---|---|
| `berserker-RMB-cast.mp3` | 0.6s | Savage warrior dashing forward through enemies, fast heavy whoosh with a blade slashing flesh, stylized fantasy action game, punchy, clean, dry, no music |
| `berserker-Q-cast.mp3` | 0.8s | Berserker entering blood rage, low aggressive growl with a heavy heartbeat thump and a dark magical surge, stylized fantasy action game, punchy, clean, dry, no music |
| `berserker-E-cast.mp3` | 0.8s | Brutal spinning axe slash hitting many enemies around, two fast heavy blade swooshes with meaty impacts, stylized fantasy action game, punchy, clean, dry, no music |
| `berserker-R-cast.mp3` | 1.5s | Warrior unleashing furious rage, loud roaring battle scream with a deep power-up rumble, stylized fantasy action game, punchy, clean, dry, no music |

## Warrior: Vanguard

| File | Length | Prompt |
|---|---|---|
| `vanguard-RMB-cast.mp3` | 1.0s | Massive greatsword cleave splitting the ground, heavy blade swing followed by a deep earth-cracking impact, stylized fantasy action game, punchy, clean, dry, no music |
| `vanguard-Q-cast.mp3` | 0.6s | Perfect shield parry, sharp metallic clang with a bright ringing resonance, stylized fantasy action game, punchy, clean, dry, no music |
| `vanguard-E-cast.mp3` | 1.0s | Armored warrior stomping the ground, heavy seismic thud with rocks cracking and a short shockwave rumble, stylized fantasy action game, punchy, clean, dry, no music |
| `vanguard-R-cast.mp3` | 1.5s | Golden protective magic dome forming, rising holy shimmer with a solid resonant hum, stylized fantasy action game, clean, dry, no music |

## Warrior: Spellblade

| File | Length | Prompt |
|---|---|---|
| `spellblade-RMB-cast.mp3` | 0.6s | Crescent wave of void energy slashed from a sword, swooshing blade with a dark magical whoom, stylized fantasy action game, punchy, clean, dry, no music |
| `spellblade-Q-cast.mp3` | 0.8s | Void magic barrier forming around a warrior, dark energy shell humming with a deep warping pulse, stylized fantasy action game, clean, dry, no music |
| `spellblade-E-cast.mp3` | 1.2s | Dark matter orbs summoned and orbiting, low gravitational hum with warbling sci-fi void energy, stylized fantasy action game, clean, dry, no music |
| `spellblade-R-cast.mp3` | 1.5s | Warrior ascending with void power, rising otherworldly energy swell with crackling dark lightning, stylized fantasy action game, punchy, clean, no music |

## Warrior: Warlord

| File | Length | Prompt |
|---|---|---|
| `warlord-RMB-cast.mp3` | 0.8s | Heavy armored warrior charging forward and smashing into enemies, running whoosh ending in a big body impact, stylized fantasy action game, punchy, clean, dry, no music |
| `warlord-Q-cast.mp3` | 1.2s | Commanding war cry shout from a powerful warlord, loud deep battle yell with a short echo, stylized fantasy action game, punchy, clean, no music |
| `warlord-E-cast.mp3` | 1.8s | Earthquake rolling across desert ground, deep rumbling waves with rocks cracking and splitting, stylized fantasy action game, punchy, clean, no music |
| `warlord-R-cast.mp3` | 2.0s | Bladestorm whirlwind, warrior spinning with swords creating continuous fast blade whooshes and swirling wind, stylized fantasy action game, clean, dry, no music |

---

## Optional extras (nice to have)

| File | Length | Prompt |
|---|---|---|
| `level-up.mp3` | 1.2s | Fantasy level up chime, bright magical ascending sparkle with a warm triumphant tone, stylized game UI, clean, no music |
| `card-pick.mp3` | 0.4s | Magical card selected, soft paper flip with a short sparkle, stylized game UI, clean, dry, no music |
| `heal-pack.mp3` | 0.6s | Health pickup, soft warm magical chime with a gentle heartbeat glow, stylized fantasy game, clean, dry, no music |
| `heal-pool.mp3` | 2.0s | Healing spring water bubbling with soft magical shimmer, loopable, stylized fantasy game, clean, no music |

Total: 36 ability sounds + 4 optional extras.
