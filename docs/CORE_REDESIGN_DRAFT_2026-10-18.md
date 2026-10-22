# Light's End core combat and progression redesign

October 18, 2026. Complete proposed core for design review. Gameplay implementation remains unchanged.

Light's End is a manual action roguelite about surviving a dangerous desert, shaping a different build each run, and earning permanent weapons worth bringing back. A weapon must strengthen the playstyle its owner actually uses. A melee fighter, an AoE caster, a hybrid Ranger and a future ally buffer should all care about their weapon, for different reasons.

The design below is a coherent recommended replacement for the current combat and progression model. Structural choices already confirmed by the creator are identified separately. All new formulas, caps, numerical targets, cards and effects are prototype recommendations. They are not approved balance requirements or evidence that a build has been balanced in play.

## 1. Confirmed direction and scope

These decisions govern the redesign:

- Weapons support a character's actual build, including ability-heavy builds.
- Level-up choices support basic-attack-focused, ability-focused and hybrid runs within a class. A Pyromancer can develop a rapid Scepter beam in one run and AoE spells in another.
- Classes need not use LMB equally often. A spell build can use it situationally; an attack build can use abilities as support.
- Melee may have stronger damage to account for its range, commitment and risk. Melee coverage is an additional build option.
- Future healer, tank and buff classes must fit the same progression foundation. The buff class specifically empowers another player to become exceptionally strong.
- Ranger weapon eligibility is path-specific, as confirmed in this conversation:

| Ranger path | Legal weapon families |
| --- | --- |
| Archer | Bow, Short Bow, Long Bow, Crossbow, Falconer's Glove |
| Alchemist | Bow, Short Bow, Long Bow, Crossbow, Falconer's Glove |
| Ninja | Shuriken, Kunai, Chakram |
| Gunslinger | Pistols, Shotgun |

This Ranger rule replaces the earlier decision that any Ranger path could equip any Ranger weapon. The creator explicitly clarified that Ninja gets all three thrown families.

Existing foundations carried forward are the seamless desert, manual combat, weapon-only equipment loot, persistent weapon instances and gold, run-reset levels/builds, a fixed forge, deliberate boss mechanics, up to five-player co-op and red-only exceptional weapon signatures. Halberd stays deleted. No weapon mastery XP is introduced.

The following sections recommend how to make these foundations work together. They do not authorize implementation, publication or replacement of the current reference rules.

## 2. What the current game actually does

The live source has three classes, twelve specializations and twenty-one active weapon families: five Warrior, six Mage and ten Ranger. It has shared-level co-op with individual choices and loot, actual boss pits and a timed final boss. Several older summaries in GAME_REFERENCE.md predate later changes; current code and the latest decisions take precedence over those summaries.

| System | Current behavior | Why it matters to the redesign |
| --- | --- | --- |
| Weapon damage | Effective-level scaling, quality and offensive affixes feed basic attacks | Most forging does not strengthen the spells an AoE Mage actually uses |
| Active damage | Separate character-level scaling; ordinary weapon offensive stats excluded | Attacks and abilities advance on different tracks |
| Offensive multipliers | Ordinary Mage spell seeds generally pass through a legacy x2; current Warrior, Blood Mage and Ranger active routes often use absolute values | The visible base numbers are not directly comparable across classes |
| Attack speed | Already increases Scepter tick rate and ordinary attack frequency | Rapid-beam support exists; its progression choices are incomplete |
| Critical cards | Precision and Brutality feed weapon-derived critical stats | Their broad descriptions overstate their effect on ordinary spells |
| Area card | Spell radius plus selected basic impact radii | It does not consistently affect every attack shape advertised by its text |
| Development picks | Develop RMB/Q/E/R; small spell trees with tier prerequisites | No comparable temporary weapon-development route |
| Rage | +4 per eligible basic contact and gain from HP lost | Multi-hit, fast and broad attacks can generate much more resource |
| Momentum | +5 per eligible basic contact | Pellets, piercing and fast shots can distort ability access |
| Mage energy | Regenerates independently of basic hits; current stages are 6/10/15 per second | Spell access does not require a weapon connection |
| Orb | Player-toggled pulses with 20 energy/second drain | An attack-focused Orb competes with spells for the same resource |
| Ranger behaviors | The ordinary family-specific behavior-affix definitions remain concentrated in Warrior/Mage families | Ranger lacks an equivalent permanent behavior pool despite ten weapon families |
| Ranger equipment | Class eligibility, without the newly requested path restrictions | Drops, starters, equip checks and saves all need path-aware handling |
| Party targeting | Bosses select different standing players across attacks | A future tank cannot be assumed to hold every boss attack by default |
| Party scaling | More HP and spawns per additional player | Combined density and HP changes must be evaluated together |

A direct damage calculation demonstrates the original problem. At character level 15, with both Scepters at the same effective level and critical hits disabled, a plain Scepter hit a boss for 94 per beam tick. A quality +5 version with damage and elite-damage affixes hit for 141. The same Fireball hit for 242 with either weapon. This is an isolated hit comparison, not a rotation benchmark.

The exact 10-15 minute point at which attacks feel irrelevant has not been measured across runs. The code explains the direction of the effect: the weapon reward track stops improving a large share of an ability-heavy build's output, while spells gain coverage, interactions and resource support.

## 3. The player loop

Before a run, choose a class, an unlocked specialization and a legal weapon from the collection. Inspect the weapon's contribution to attacks, abilities and support rather than choosing from a single misleading DPS score. Choose Normal, Endless or the existing Modified mode.

Enter at level 1 with LMB, class movement and an immediate first-ability choice. Fight manually, collect ground XP and gold, and decide whether to pursue events, the forge, optional bosses or safer leveling. Each ordinary level strengthens the build through a stat/utility choice. Development milestones change how attacks or abilities work.

A weapon drop can improve the current plan or suggest a different direction. The player can switch weapons without rerolling or deleting previous run investment. Affixes provide persistent identity; temporary developments determine how strongly this run leans into that identity.

At the fixed forge, spend permanent gold to refine a weapon. A good weapon matters to a beam build, a spell build or a future support build because its power and relevant affixes improve that build's actual output.

The main-world clock reaches its final encounter at 30 minutes. Optional isolated fights and paused choices can extend real elapsed play time. Victory, ordinary death, restart or abandonment settles run loot under the equipped-weapon and safe-pocket rules. Character levels, selected cards and temporary developments reset; collected gold and retained weapons survive.

The reward is a stronger collection of build possibilities and bounded numerical advantages. The next run still requires combat decisions and a developing build.

## 4. Six separate pieces of character identity

| Piece | Determines | Does not automatically determine |
| --- | --- | --- |
| Class | Movement, resource identity and broad combat tools | One mandatory damage source |
| Specialization | RMB/Q/E/R kit, interactions and themes | One mandatory weapon family, except explicit Ranger restrictions |
| Weapon family | LMB delivery, rhythm, reach and inherent tradeoffs | Ability power based on basic hit size |
| Weapon instance | Saved power ceiling, roll, quality, affixes and possible signature | Temporary cards earned in a previous run |
| Run choices | Attack/ability emphasis, coverage, sustain, defense and interactions | Permanent alteration of the equipped item |
| Role | Contribution through damage, healing, protection, control or empowerment | A forced party slot or a prohibition on offense |

An attack-focused Mage and an ability-focused Warrior are both valid. A future tank can emphasize attacks or active protection. A healer can trade burst healing for sustained healing or invest in a more offensive hybrid. A buff class can specialize in one empowered ally or, as an alternative development, distribute a smaller benefit across a group.

No universal attack/ability damage-share quota is required. A build is judged by its ability to answer encounter demands and by its cost, risk and contribution.

## 5. Weapon power supports the entire build

Every weapon has a neutral Weapon Power value. It is independent of the damage of one basic hit, attack interval, projectile count and range. Two equally powered weapons supply the same foundation for a given ability before their relevant affixes are applied.

The action itself defines a coefficient and a delivery pattern. A hammer uses a larger coefficient over a longer cycle; a wand uses a smaller coefficient more often. Fireball, a heal and a barrier each use their own coefficients. A slow weapon does not become the best casting weapon merely because its basic hit is large.

Recommended output model:

```text
Direct output = authored action amount
              x character level factor
              x weapon power factor
              x applicable additive modifier group
              x declared conditional modifiers
              x target defenses or healing rules
```

Attack damage, ability damage, healing and barrier amount each have their own authored amounts and applicable tags. Weapon power is applied once. An effect derived from damage already dealt does not apply the parent's weapon power, critical multiplier or damage bonuses a second time.

Percentage mitigation, invulnerability duration, crowd-control duration, cooldown reduction and ally-buff percentages do not scale without limit from weapon power. They use independently capped formulas. A tank's gear can improve its barrier capacity while its maximum damage reduction remains bounded.

Universal damage, attack damage, ability damage and elemental damage are additive when simultaneously applicable. For example, +10% damage, +20% attack damage and +15% fire damage give a fire basic attack +45%, not three multiplying bonuses. A fire spell gets +25% from those same bonuses. Healing does not inherit damage bonuses.

Hybrid actions declare which part is an attack and which part is an ability. A basic hit triggering a void burst does not receive both attack and ability bonuses on the same component. The hit and the burst can use different profiles.

## 6. Character levels and persistent weapon ceilings

Keep effective weapon level equal to min(character level, saved ceiling), starting at 1 each run. Change the numerical curves together instead of layering new spell scaling over every old multiplier.

Recommended first prototype, with level 30 as the normal-run tuning reference:

```text
L = character level
E = min(L, saved weapon ceiling)
F = 0.40 + 0.60 x clamp((L - 1) / 29, 0, 1)

Character factor = 1 + 0.03 x (L - 1)
Weapon power factor = [1 + 0.01 x (E - 1)]
                    x [1 + (stored base roll - 1) x F]
                    x [1 + 0.02 x quality x F]
Numerical affix contribution = saved full roll x F
```

These numbers are seeds. The structural recommendation is one character curve for applicable outputs, a modest shared weapon curve, and run-level normalization of permanent numerical advantages.

At level 1, a quality +5 weapon contributes +4% quality power; at level 30 it contributes +10%. A ceiling-30 weapon's level component reaches +29%, while a ceiling-1 weapon's level component remains at zero. Both still benefit from character progression. Ordinary affixes reach full numerical values at the run reference level, rather than reaching full strength instantly on a ceiling-1 item.

This explicitly changes the current ceiling-relative 40%-to-100% affix normalization and basic-only quality effect. The current scheme's ceiling-1 special case gives full numerical affixes immediately; the proposed run-level curve removes that advantage.

Rarity supplies more affix opportunities and access to signatures, not another invisible universal damage multiplier. A well-rolled lower-rarity item can suit a build better than a higher-rarity item. Base rolls, ceilings, quality and affix rolls remain stored data; normalization never rewrites them.

At levels above 30, ordinary permanent affix normalization stays at 100%. Endless progression requires an explicit post-30 curve and milestone cadence; it cannot keep adding unrestricted percentage defenses or critical chance forever. Character growth and enemy growth use their own documented Endless curves.

## 7. Stats with clear scopes

Use the player-facing term **ability** for RMB/Q/E/R throughout the shared system. Class flavor can still call Mage abilities spells. Physical Warrior techniques and Ranger flasks receive ability bonuses when their profiles declare them eligible.

| Stat | Applies to | Important boundary |
| --- | --- | --- |
| Damage | All outgoing damage | Does not increase healing, barriers or buff percentages |
| Attack damage | LMB and explicitly attack-derived components | Does not also multiply an independent triggered ability component |
| Ability damage | Damaging active-ability components | Does not change LMB merely because it looks magical |
| Fire/void/etc. damage | Actual matching damage type | Cosmetic weapon/path colors do not add an element |
| Attack speed | Weapon cycles and eligible channels | Does not accelerate every DoT or active ability |
| Ability recovery | Ability cooldown recovery | Does not automatically raise cast/channel tick speed |
| Critical chance/damage | Eligible direct attacks and damaging abilities | Default DoTs, heals and barriers do not critically strike |
| Attack reach | Family-specific length/range | Does not silently add beam width or spell radius |
| Attack coverage | The family's declared arc, impact, fan or contact geometry | Does not add extra same-target hits |
| Ability area | Eligible ability radius/width | Says radius or width accurately; +20% radius means +44% geometric area |
| Healing power | Flat healing amounts and declared heal-over-time effects | Overhealing is not effective healing |
| Barrier power | Flat absorb amounts | Does not multiply percentage mitigation |
| Buff strength | The bonus granted by eligible empowerment abilities | Scales the bonus, not the recipient's entire output again |
| Resource efficiency | Eligible costs and limited refunds | Does not create net-positive recursive casts |
| Movement/HP/pickup/gold | Their stated character or economy systems | They remain visible separately from offensive power |

Recommended cap seeds:

- Ordinary total attack-speed multiplier: 2.5x. A declared ultimate window can raise the total to at most 3.5x. Effects that reach the cap show their actual remaining gain.
- Ordinary critical chance: 60%; short declared burst cap: 75%. Ordinary critical damage multiplier: 2.5x maximum.
- Ability cooldown reduction: 40% ordinary and 50% during a declared burst window. Resource costs remain relevant.
- Cost reduction: 40%. Cast refunds return at most 30% of that cast's actual cost in aggregate, unless a specifically budgeted mechanic replaces this rule.
- Permanent numerical movement bonuses: +40% before explicitly declared mobility skills. Attack reach/coverage bounds are authored per family, not shared unlimited multipliers.
- Multiplicative damage-reduction sources combine through remaining damage, with a sustained total reduction ceiling of 65%. Specific short defensive ultimates may reach 80%; their uptime and party coverage are budgeted separately.

These are proposed limits, including changes to current caps. They are not values to paste into code before measuring their effects on existing ultimates and encounters.

DoTs keep a declared damage-per-second budget when tick presentation changes. The Scepter is an attack channel: more attack speed means more damage ticks. Blood Drain is an active ability channel: it follows its own declared tick/cast rules. The two beams are not interchangeable systems.

## 8. Balance damage, coverage and uptime separately

A useful attack can gain damage, coverage, reliability, mobility, stagger or resource efficiency. It should not gain all of them freely from one choice.

Melee can have higher committed damage. A starting comparison might give a melee attack 120 units of stationary damage for every 100 units of a safer ranged attack. With 65% versus 80% attacking uptime, those become 78 versus 80 units of realized output. Those illustrative uptimes are assumptions, not measured game results.

Coverage does not need to multiply single-target output. A wider sword swing catches more enemies while dealing the same hit to a boss. A piercing ray hits enemies behind the first rather than hitting the boss repeatedly. Additional chain targets require distinct targets. Larger pools improve placement tolerance and enemy coverage without increasing their overlapping same-target tick rate.

Some coverage also raises boss damage: extra hammer aftershocks, additional overlapping projectiles and longer damaging durations. Those effects are charged against the single-target budget. Calling something AoE does not exempt it from boss balancing.

Default contact rules:

- One melee hit window cannot hit the same target again just because its arc is wider. Twin Blades keep their two intentionally authored contacts, with each contact allocated part of the cycle's output.
- Piercing hits one target once per outbound flight. A declared returning attack can hit once again on return, at its declared coefficient.
- A fan or multishot has a per-action same-target limit and per-projectile coefficients. More projectiles do not automatically increase that limit.
- Chain jumps and secondary forks select distinct targets. They cannot repeatedly bounce between one boss and its own hitboxes.
- Echoes are secondary effects with declared damage and cannot create more echoes or full resource gains.
- Multiple body hitboxes locate contact; a long boss is still one target.
- Pool overlap from the same ability and owner uses a stated same-target tick budget. Overlap increases coverage and duration flexibility, not unlimited damage.

Separate focused and coverage investments need not make every build equally good at both. A focused build can use an ability to clear space; an AoE build can invest in a boss-damage component. Neither should require one specific rare affix to function.

## 9. Resource systems that respect every weapon family

Keep distinct resources: Rage for Warrior, Arcane Energy for Mage, Momentum for Ranger. Future classes receive resources designed for their jobs instead of inheriting a generic hit requirement.

### Warrior Rage

Keep a 100-point pool, basic-hit generation, limited gain when hurt and decay after combat. Normalize generation by the authored action cycle. A hammer, paired blades and a broad sword should provide similar sustainable ability access at comparable attack uptime.

A prototype can budget about 8 Rage/second of successful basic attacking before resource-specific bonuses. A 1-second action gets roughly 8 Rage across its intended contacts; two contacts split that credit. A cone hitting eight enemies does not award eight complete action grants. A modest capped crowd bonus can be tested separately.

Attack speed can improve resource flow, but its total generation increase is capped, initially at +50%. Damage taken can add a supplemental capped amount; being healed and intentionally standing in lethal attacks cannot become the best resource engine. Blocked, invulnerable or self-inflicted damage does not award full hurt-based Rage.

An ability-heavy Spellblade uses occasional basics, defensive timing and resource-efficiency choices to sustain its abilities. This does not promise an attack-free rotation. A proposed resource development can trade some basic damage for more Rage generation and lower ability cost. A hybrid uses both portions of the kit; an attack build spends Rage on support and burst.

### Ranger Momentum

Keep a 100-point pool, attack generation and out-of-combat decay. Start with a successful-attack budget around 10 Momentum/second, then tune the actual ability costs around a representative rotation.

All pellets of a Shotgun blast share one generation budget. Crossbow pierce does not grant five full budgets. Shuriken fans, Chakram return contacts and the hawk's outbound/return/catch attacks have explicit shares. Clones and other secondary copies generate no normal Momentum.

The slow Crossbow and the hawk must be able to fuel an Alchemist. A rapidly firing Short Bow must not gain several times their active-ability access for free. Ability-focused Rangers can buy efficiency and sustained-resource developments instead of raw attack output. Resource generation is measured against a single boss as well as crowds.

### Mage Arcane Energy

Keep independent staged regeneration and recovery during free basics, movement and Blink. Do not require kills or basic hits for baseline regeneration. Spell-heavy builds can invest in regeneration, capacity or efficiency, but must still budget burst spending and recovery windows.

Keep current 100 base energy and 6/10/15 per-second regeneration stages as initial tuning inputs, not new balance locks. Evaluate cost/cooldown/regen together. Cooldown reduction has little practical value when the player cannot afford a cast; energy regeneration has much more value when one cast damages a large group.

Recommend making the Orb's base toggled attack free like the other Mage basics, replacing the current mandatory drain. An optional overcharge development can spend energy for more attack output if the player chooses that tradeoff. This is a deliberate proposed change to the existing Orb exception, not a claim that the current Orb is free.

Self-sustain and resource refunds have per-action or per-time budgets. Hitting a larger crowd must not indefinitely finance stronger healing, more casts and more crowd hits in a recursive loop.

## 10. Run levels and build developments

Retain the current ability acquisition schedule initially: choices at levels 1, 5 and 10, then R at 15 after the other three. Retain development levels 7, 11, 14, 18, 22, 26 and 30. All other levels offer stat/utility cards. The actual XP curve must be tuned to the desired timing of those levels.

Suggested main-world timing targets are a second ability around minutes 2-3, three abilities around minutes 5-6, and R around minutes 9-12. These are new pacing targets to test, not descriptions of current leveling. Optional fights can accelerate builds; they must not be required for a functional core kit.

### Ordinary cards

Three options, rarity variants, existing reroll/banish helpers and Heal Instead remain. The offered pool understands the class, path, owned abilities, family and declared scopes. It excludes unusable or capped bonuses.

Prototype common-card comparisons can begin with +4% all damage, +8% attack damage or +8% ability damage. Universal flexibility has a smaller amount than specialization. All applicable damage cards add in the same group, so a hybrid does not get a hidden double multiplier. Healing, barriers and buff strength use their own tuned card values.

Offer an offense/resource option often enough for an emerging build to develop. Do not require the player to roll one rare card to make the selected weapon work. Every offer should have at least one useful choice, including when the player is building support.

### Development milestones

Replace spell-only development with a selectable catalog covering Attack, Abilities, Resource/Hybrid and Defense/Support. Keep the current deliberate selection of eligible nodes rather than hiding all essential choices in a tiny random pool. The player spends one development opportunity on one eligible effect.

Attack development starts with six run traits: two focused-output choices, two coverage choices and two rhythm/resource choices. Each second-tier choice needs its first-tier choice. Their family-specific expression is authored: Coverage can mean a wider sword arc, extra ray pierce, a broader pulse or a controlled ricochet. These examples are a content brief, not six approved named cards.

Keep the existing four development nodes per ability as the starting inventory, but review their descriptions and effects against the new budgets. An ability's upper-tier node still needs an earlier node in that ability. Numeric filler can become a normal card; development choices should visibly affect play.

Resource/Hybrid developments should connect systems deliberately, with limits. For example: spending Rage empowers the next basic action, or a short attack sequence discounts one ability. A hybrid gets a meaningful interaction instead of automatic bonuses to everything.

Boss Spell Insight becomes Build Insight: up to five additional development choices per run. The other personal boss-reward options remain gold and a temporary blessing; after the insight cap, keep the survival alternative. Update the name and tooltip together so an attack player does not think the reward is irrelevant.

### Switching weapons

Temporary attack investment belongs to the run character. Each legal family has an authored mapping for the six attack traits. Switching previews that mapping; a reach development never becomes a dead melee-only bonus on a beam. No free reroll or refund occurs on switching. The weapon's permanent affixes remain item-specific.

Changing a weapon can alter tactical priorities but cannot erase half a run's selected improvements. A development that cannot map safely must state its restriction before purchase and receive a defined conversion rule in the content data before release.

## 11. Warrior specializations

All five active Warrior families remain legal for all four Warrior paths. Family animation and LMB identity remain recognizable. Each specialization can lean toward attacks or abilities, with differing strengths.

| Path | Combat identity and current kit to retain | Attack route | Ability route | Main balance risks |
| --- | --- | --- | --- | --- |
| Berserker | Savage Rush, Bloodletting, Carnage, Unchained Wrath | Fast pressure, blood interactions and strong committed melee | Rush/Carnage bursts and managed blood-stack payoff | Life steal scaling with crowd size; stacks from every contact; near-permanent Wrath |
| Vanguard | Sundering Cleave, Perfect Guard, Seismic Stomp, Bastion Dome | Heavy punish hits after defensive timing | Counters, stagger, controlled shockwaves and protection | Full boss lockdown; excessive mitigation uptime; counters paying for themselves |
| Spellblade | Void Waves, Void Barrier, Dark Matter, Void Ascension | Basics trigger limited void follow-ups | Waves/orbs/barrier bursts carry more output | Basic hit frequency multiplying chains; overlapping returning waves; barrier refunds |
| Warlord | Brutal Charge, War Cry, Earthquake, Bladestorm | Weapon finishers, positioning and suppression | Fissures, spinning control and large committed bursts | Pulls plus permanent stagger; per-enemy Rage refunds; storm ticks triggering repeated procs |

Berserker can be a strong boss attacker without being the safest fighter. Vanguard can be safer without also leading sustained damage and crowd clear. Spellblade may clear at range, so its ranged abilities do not inherit a blanket Warrior melee premium. Warlord's group control counts as power even when its damage number is smaller.

The existing Vanguard is a defensive Warrior path. It does not by itself define every mechanic of the future tank class. Future tank design must choose its team-protection identity separately.

## 12. Mage specializations

All six Mage families remain available to all four Mage paths. The recommended default is no compulsory caster-only family: a casting Scepter and an attack-focused Staff are both legitimate items. Family choice changes the fallback or primary attack; affixes and run choices provide the lean.

| Path | Combat identity and current kit to retain | Attack route | Ability route | Main balance risks |
| --- | --- | --- | --- | --- |
| Pyromancer | Fireball, Flame Ward, Flame Surge, Meteor | Beam/bolt pressure with selected burn interactions | Ignition, ground zones, spreading fire and detonation | Overlapping blast chains; burn double scaling; density financing endless casts |
| Cryomancer | Ice Road, Frost Nova, Glacial Burst, Blizzard | Precise attacks into controlled enemies | Positioning, chilling zones and timed shatter bursts | Near-permanent enemy inactivity; boss freeze replacing mechanics |
| Stormcaller | Chain Lightning, Static Guard, Storm Rod, Tempest | Fast attacks with limited shock interactions | Rod placement, links and overcharge windows | Rod/link overlap; each tick becoming a proc; permanent overcharge |
| Blood Mage | Sanguine Drain, Crimson Veil, Crimson Bloom, Blood Eclipse | Attacks supported by blood marks and survival tools | Drain/Bloom/Eclipse rotations and capped self-sustain | Healing growing with every AoE target; repeated Bleed amplification; low-risk infinite sustain |

Preserve Pyromancer's decided interaction: Fireball always explodes, but spreads ignition/bounces only after a lit contact or while carrying fire from one. Do not silently turn every basic hit into fire damage because its visuals are orange. An elemental basic effect requires a named, budgeted trait or affix.

A beam Pyromancer chooses attack developments and speed while using Ward/Surge/Meteor tactically. An AoE Pyromancer buys spell coverage and resource support, then uses LMB when it helps. Both benefit from improved weapon power.

Cryomancer trades some peak damage for control; bosses convert hard freeze into bounded chill or stagger contribution. Stormcaller rewards placement and maintaining useful geometry rather than the largest number of stacked rods. Blood Mage's healing remains capped per action and over time; target count does not multiply the self-heal ceiling.

## 13. Ranger specializations and weapon restrictions

Ranger has the same attack/ability freedom, within the confirmed legal family groups. Weapon restrictions are enforced in the lobby, drops, pickup/equip, forge comparisons, merchant offers, boss rewards, host validation and save restoration.

| Path | Combat identity and current kit to retain | Attack route | Ability route | Main balance risks |
| --- | --- | --- | --- | --- |
| Archer | Power Shot, Arrow Type, Volley, Hunter's Focus | Sustained ranged pressure and target setup | Charged shots, volleys and status choices | Poison stacks tied to fire rate; Focus exceeding speed limits; hawk/projectile interactions |
| Ninja | Cyclone, Smoke Bomb, Shuriken Throw, Shadow Assault | Thrown-weapon rhythm, returns and openings | Ricochets, controlled burst and shadow windows | Clones multiplying full output; repeated Exposed stacking; every copied contact generating procs |
| Alchemist | Catalyst Flask, Reactive Flask, Volatile Mixture, Grand Experiment | Weapon pressure that supports chemical setup | Clouds, reactions and deliberate detonations | Each pool or poison stack multiplying reactions; resource starvation with slow weapons |
| Gunslinger | Fan the Hammer, Quickstep, Piercing Line, Bullet Barrage | Pistols or close-range Shotgun pressure | Marked burst, lanes, movement and Barrage | Pellet/proc multiplication; permanent dodge chains; marking bonuses multiplying each other |

Archer's Arrow Type must explicitly cover all five legal families. For bows/crossbow it applies through projectiles. For the hawk it applies through tagged primary contacts with normalized status credit. Hunter's Focus needs a hawk-specific benefit such as quicker travel/recovery within its single-hawk limit; it must not spawn several simultaneous player hawks. Coverage and target status remain distinguishable from attack frequency.

Ninja descriptions stop referring to bow arrows. Shadow Assault copies the equipped thrown weapon's identity. Recommend a shared secondary-copy budget, initially about 60% of the owner's basic output spread across active clones. Three versus five clones changes distribution, not a free jump from four to six full sets of player attacks. Copy coefficients, independent clone strikes and final explosions must share the ultimate's total budget. Copies cannot produce normal resource gains or recursive copies.

Gunslinger abilities retain their specialization animations and spell identities with either legal weapon. Shotgun LMB does not turn Fan the Hammer into five full copies of every skill bullet. Alchemist abilities remain flasks and mixtures, even while holding a bow or hawk glove.

### Legal starters and existing collections

Archer and Alchemist use Bow as their fallback. Recommend Shuriken for Ninja and Pistols for Gunslinger. When unlocking a path, grant its Common fallback once if the collection has no legal weapon; prevent repeated starter/salvage gold farming. These fallback grants are proposed consequences of the new restrictions, not existing unlock behavior.

Store an equipped preference per Ranger path, because a single Ranger-wide remembered weapon can now be illegal. Preserve existing weapons and their IDs; an incompatible equipped weapon returns to its existing collection location and a legal fallback is selected. Do not delete collected bows or guns because a player changes path. Existing saved family indices remain stable.

## 14. Every weapon family has a job

These are proposed balance identities, not promises that current values already produce these results. Permanent affixes and temporary developments can lean each family without removing its basic identity.

### Warrior weapons

| Family | Inherent strengths | Coverage development | Focused development | Limiter to retain |
| --- | --- | --- | --- | --- |
| Longsword | Balanced combo and reliable openings | Wider finisher or extended sweep | Stronger timed finisher | Requires a real combo sequence; one finisher per sequence |
| Greatsword | Heavy cleave, stagger and strong punish hits | Broader/deeper arcs | Greater committed impact | Longer commitment; broad swing does not hit one boss repeatedly |
| Twin Blades | Fast paired contacts and close pressure | Controlled wider flurries | Focused repeated attacks | Short reach; split cycle damage/resource/proc credit across both contacts |
| Throwing Axe | Medium-range piercing | Wider lane, controlled return or ricochet | Higher first-target impact | Its range removes the full melee-risk premium; outbound/return records stay bounded |
| Warhammer | Close circular impacts and stagger | Larger impact footprint | Concentrated impact | Slower rhythm; leap respects walls; aftershock costs boss-damage budget |

### Mage weapons

| Family | Inherent strengths | Coverage development | Focused development | Limiter to retain |
| --- | --- | --- | --- | --- |
| Staff | Long piercing line | Larger contact or more distinct pierce targets | Stronger first-target lance | Each target once per flight; narrow positioning |
| Wand | Responsive rapid shots | Limited split/ricochet | Accurate sustained pressure | Small hits; proc credit follows time/output budget |
| Grimoire | Two seeking wisps and reliable contact | Additional distinct-target seeking | Converging focus | Two wisps share the total attack budget; seeking trades some peak output for reliability |
| Orb | Close radial coverage around the player | Larger pulse/controlled secondary ring | Smaller harder pulse | Close-range exposure; optional energy overcharge is an explicit choice |
| Spellbook | Broad fan and short-range coverage | More pages or broader spread | Narrower controlled fan | Recommend at most two page contacts per target per volley; extra pages do not raise that cap |
| Scepter | Aimed sustained channel | Pierce or distinct-target forks | Faster ticks/concentrated beam | Aiming and movement commitment; authored total ray damage rather than full-damage duplicates |

Recommend retaining Twin Beam as two rays at reduced per-ray damage, with its total same-target gain explicitly budgeted. The current two rays at 65% each provide a useful first comparison: 130% total if both connect. Distinct-target forks are a separate coverage option and cannot reconverge for extra boss hits. These definitions cannot be combined into several full-damage rays through a naming loophole.

### Ranger weapons

| Family | Inherent strengths | Coverage development | Focused development | Limiter to retain |
| --- | --- | --- | --- | --- |
| Bow | Flexible, dependable ranged rhythm | Limited pierce/fan | Stronger accurate hits | Does not lead every metric |
| Short Bow | Fast close-to-midrange shots | Controlled spread or limited ricochet | Sustained close pressure | Shorter range; normalized status/resource credit |
| Long Bow | Long range, visible draw and heavy hits | Line penetration | Charged priority-target damage | Draw/commitment; low resource access is not an additional hidden penalty |
| Crossbow | Slow heavy piercing bolts | Deeper aligned coverage | Strong first-target impact | Reload rhythm; all pierced targets share resource/proc allowance |
| Falconer's Glove | Outbound/return path and skillful catch | Better distinct-target follow-ups | Stronger controlled hunting passes | One player hawk; catch risk; follow-ups do not all retarget one boss |
| Shuriken | Fast thrown stars and periodic fan | Broader distinct-target fan | More accurate focused pressure | Periodic fan and copied stars have defined same-target limits |
| Kunai | Quick piercing throws | More distinct pierce targets | Precise priority-target attacks | Narrow lane; resource and statuses normalized |
| Chakram | Returning coverage and positioning | Better return path or width | Stronger timed return | Two player blades maximum; one hit per target per pass |
| Pistols | Alternating nearest-target attacks | Distinct-target ricochets | Focus when one valid target remains | Auto-target reliability counts in its damage budget; no full second gun for free |
| Shotgun | Close-range spread and burst | Wider spread/additional distinct targets | Better use of its existing close hits | Preserve five base pellets and at most three contacts on one target per blast; one shared proc/resource budget |

A weapon's long range, seeking, auto-targeting, stagger or wide coverage is real power. Equal dummy DPS for every family would give those advantages away for free. Conversely, a difficult hawk catch should offer a worthwhile reward instead of merely restoring baseline usefulness.

## 15. Permanent affixes and temporary developments

Keep the established rarity structure:

| Rarity | Ordinary slots | Maximum ordinary behaviors | Exceptional signature |
| --- | --- | --- | --- |
| Common | 0-1 | 0 | No |
| Magic | 1-2 | 1 | No |
| Rare | 2-3 | 1 | No |
| Legendary | 3-4 | 2 | No |
| Mythic | 4-5 | 2 | No |
| Ascendant | 5-6 | 2 | Separate red-only signature |

Rarity counts and behavior caps carry forward; numerical pools and weighting are retuned. Behaviors still consume ordinary slots. A red signature is separate. Existing items retain actual saved slot counts and rolls during migration; higher limits do not fill empty slots for free.

Ordinary stat pools include attack, ability, elemental, resource, defense, healing and empowerment stats where applicable. Ordinary behavior affixes primarily shape LMB and remain family-specific. Ordinary casting affixes can improve ability numbers without introducing a unique skill replacement. Exceptional named cross-skill transformations remain red-only.

Add a real ordinary behavior pool for each Ranger family. It must respect the family's hard limits: shotgun same-target cap, hawk count, Chakram count and clone budget. Packs or existing visual effects do not define the mechanics of those new affixes.

Weapon family should not secretly decide all affix rolls. A Scepter can roll casting stats; an Alchemist's bow can improve mixtures. Use broad eligibility and clearly weighted useful pools. Ineligible healing stats do not roll on a class with no healing output, and a cosmetic fire rune does not make fire affixes useful to a physically tagged attack.

Permanent and temporary versions of a similar effect must combine through one cap. A +2 pierce affix and a coverage development do not accidentally bypass a target limit by running in different systems. The comparison UI shows the resolved result and any capped excess.

For named red items, author the complete package: eligible classes/paths, signature, normal coefficients, low-level scaling, resource/proc behavior, trigger rate and same-target limits. A signature should open a build or change a decision. Red rarity alone is not proof an unfinished item has a signature.

## 16. Future healer, tank and buff classes

These are role contracts for future content. Class names, weapon lists, resources and complete RMB/Q/E/R kits remain unconfirmed. Do not present illustrative support effects as already selected class abilities.

### Healer

The weapon improves healing amounts, appropriate damage and relevant barriers through separate coefficients. Builds can favor emergency focused healing, efficient sustained healing, group coverage or an offensive hybrid. Group coverage divides an authored healing budget rather than granting a full focused heal to every party member at no cost.

Measure effective healing, prevented deaths, resource cost, reach and time spent casting. Overhealing does not count as successful output. Repeated small hits cannot create unrestricted life steal or healing procs. Health packs and the rechargeable world pool remain useful to parties without a healer.

Recommend solo viability through a functional damage kit and self-targetable support where appropriate. The healer's direct damage may be lower while investing in healing; the game should not assign an unavoidable solo damage check that only a damage class can pass.

### Tank

The weapon improves meaningful protection and enough offense to participate. Build options can favor timed guard, ally barriers/interception, area control or retaliation. Flat barriers and maximum HP can grow; percentage reduction and invulnerability uptime stay capped.

Current bosses alternate targets. Recommend making team protection useful under that rule through positioning and active defensive choices. Do not silently replace targeting with permanent threat or boss taunts. If a taunt is later chosen, it must respect committed attacks, avoid redirecting a locked telegraph onto someone else and declare which boss mechanics ignore it. Short defensive bursts are assessed by realized uptime: calling an effect an ultimate does not justify keeping its burst-only reduction level active nearly continuously.

A tank does not cancel the group's need to dodge. Boss-wide hazards still threaten everyone, and a tank's crowd control cannot permanently prevent a boss from acting. Retaliation uses a capped rate and incoming-threat budget, not the full damage of hundreds of trivial contacts.

### Buff class

Its central fantasy is making another player exceptionally strong. Weapon power, buff-strength affixes and developments improve that contribution with separate formulas. Recommended choices include focused ally empowerment, shorter powerful windows, sustained smaller buffs and wider but weaker group support.

Scale the bonus rather than the whole recipient. A +30% damage buff with +20% buff strength becomes +36%, not a 1.30 x 1.20 multiplier on all damage. Stronger effects, longer duration, more targets and better uptime share the same budget.

An illustrative two-player comparison: two damage characters each contributing 100 produce 200. A buffer contributing 60 while empowering one teammate from 100 to 140 also produces 200. The recipient feels much stronger; the party's offensive output stays comparable before survival/control benefits. Alternatively, a brief doubling for 25% uptime averages +25% before timing advantages; a buffer contributing 75 then pairs with 125 average ally output for 200. These are arithmetic examples, not final target class values.

For a five-player party, a +20% group buff on four 100-output teammates adds 80, compared with +40% on one adding 40. Group coverage must cost potency, uptime or the buffer's other contribution. The solo case, two-player case and five-player case must all be authored deliberately.

Recommend a documented weaker self-target option and an offensive build route for solo play, rather than a hidden automatic conversion of every ally buff into full-strength self-damage. Exact self-target behavior remains a design choice.

Same-category buffs use the strongest active contribution and refresh duration rather than multiplying across identical buffers. Offensive empowerment, haste, vulnerability and protection have separate declared groups with a combined budget. One buffer cannot amplify another buffer's buff strength recursively. Benefits do not create extra full proc/resource generations on the recipient's copied effects.

### Team value

Recommend parties remain playable without a fixed healer/tank/buffer composition. This is a proposal, because mandatory roles have not been decided by the creator. Support should improve safety, uptime and coordination enough to be desirable, while all-damage groups can succeed through skill.

A support's effective contribution includes damage enabled and damage prevented, but those metrics are not blindly added to the same damage scoreboard. Attribute incremental ally damage to support credit separately, without subtracting the teammate's actual damage or counting the same contribution twice in party totals.

## 17. Status effects and reaction limits

Move to one source-aware status model: owner, ability/action, damage type, potency, duration, stacks, tick interval, snapshot rule and reaction eligibility. A Pyromancer burn, Archer burn and Alchemist poison must not silently overwrite unrelated owners' damage or borrow the last player's critical/weapon stats.

Each player's damage-over-time contribution has its own capped stacks or strongest-instance rule. Visual icons can combine information, but simulation ownership stays explicit. Shared debuffs such as Marked and Exposed have declared beneficiaries. Retain their distinct identities; recommend summing applicable damage-taken bonuses in one capped vulnerability group rather than multiplying many independent amplifiers.

Cross-player statuses can satisfy a reaction condition where declared. That does not give every player a new full-damage reaction on every tick. A reaction has an owner, a per-target/internal trigger interval, an action generation and a maximum chain depth. Secondary reaction effects cannot recursively trigger full-strength reactions. Refreshing a DoT cannot reset an immediate tick to create more damage than its stated rate.

Poison and bleed stacking scale with normalized application credit, not raw pellets or beam ticks. An authored fast-hit status build can invest in faster stacking; that advantage must be paid for in its output budget. Bosses resist hard control through limited stagger or reduced debuffs, with recovery between control windows.

Keep the current within-kit Pyromancer, Cryomancer, Stormcaller, Blood Mage and Alchemist interactions as identities. Rebudget each reaction after the shared power changes. Do not revive obsolete cross-element Mage tree proposals simply because they appear in an earlier PDF.

## 18. Enemies and encounters

Enemy difficulty comes from pressure, durability, composition and readable mechanics. More enemies is one dial, not the only escalation tool. AoE builds benefit disproportionately from density; focused builds need dangerous priority targets worth eliminating.

Keep swarmers, bruisers, casters, chargers, guardians, summoners, elites and bosses. Swarmers create volume; casters/chargers demand movement; guardians reward focus or positioning; summoners reward reaching priority targets. Guardians cannot make the rest of the screen permanently untouchable, and summoners have finite population budgets.

Use main-world time and encounter tier to set enemy base durability and attack pressure. Recommend removing ordinary spawn-time HP dependence on the player's current level: leveling should make the player stronger, not immediately raise all new enemies to partly cancel the gain. This is a proposed change from the current level-based enemy-health function. Do not scale enemies to the equipped weapon, damage cards or party composition.

Snapshot encounter difficulty at engagement. A player leveling or changing equipment mid-fight must not refill or secretly resize a boss's health bar. Player-count scaling is handled by encounter membership and safe join/leave rules, not by healing a boss whenever a teammate disconnects and returns.

Keep off-camera valid spawns, soft ordinary-enemy separation, terrain collision, major body blockers, visible attack commitment and legal movement corridors. Whole-model projectile contact remains; ground collision remains footprint-based. These are different systems.

Retain enemy aging/enrage as anti-infinite-kiting pressure, with clear caps. Do not stack age speed, night speed, multiple curses and modifiers into undodgeable movement without an encounter limit. A spawn cap is an implementation/performance limit, not a promise that every cap-filled scene is balanced.

The current hard cap is 260, while current spawn code also multiplies desired population beyond the stage table. Recommend replacing stacked hidden population/rate multipliers with one documented director budget. When at a cap, increase selected threat quality within readable limits instead of generating more queued spawn debt.

## 19. Run clock and world activities

Retain the current main-world phases: Day 0-12 minutes, Night 12-20, Blood Moon 20-24 and Dusk 24-30. Butcher and Prophet remain optional pit bosses; do not restore their deleted timed arrivals. Colossus remains the timed 22:30 encounter and Crimson Tyrant follows the 30-minute transition.

Four pits contain Ravager, Wyrm, Butcher and Prophet from the start, with their existing respawn structure and main-clock scaling as initial inputs. Solo entry starts the encounter; online entry uses the approved unanimous vote. Leaving resets a failed pit fight. After a kill, personal rewards resolve and all participating players are moved to the entrance under the current rule.

Pits and trials pause outside-world simulation and the main clock. Inside, player actions, cooldowns, resources, healing and relevant buff durations advance with encounter time. Outside enemies, events and their harmful ticks stay frozen. Time spent choosing cards freezes gameplay rather than refreshing cooldowns. No catch-up burst of outside spawns occurs on return.

Freeze different clocks explicitly. A reward's respawn timer can use main-world time; a player's combat buff uses active combat time. UI/network countdowns use real time. These choices prevent indefinite buff preservation or resource refill through menu toggles.

Keep optional camps, cursed shrines, wandering merchant, accepted rifts and the colosseum. Event rewards remain useful across builds: offense rewards say whether they improve attacks, abilities or both; defensive rewards help the relevant recipient; an insight can develop attacks or support.

Rifts only activate their three anchors after acceptance. Precision trials accept movement/dodge answers so they are not Warrior-parry gates. Future support classes need baseline damage or a declared alternate objective for timed kill trials; content cannot assume every player is a maximum-damage build. At most two optional timed events is a useful retained planning limit, with stricter local overlap constraints where necessary.

Pit rewards and Pit Soul stay exciting without becoming mandatory final-boss prerequisites. The current Soul's damage/HP/regen is a starting checkpoint to retune under the new multiplier groups. Different camp buffs combine through declared groups; repeated copies refresh rather than stack.

Normal-mode wall-clock duration is longer than 30 minutes when taking optional isolated fights. Keep the main clock rule unless the creator separately chooses a hard real-time run limit. Show encounter time or real elapsed time separately in records if useful.

Endless continues beyond the Tyrant with its own bounded progression and increasing danger. Modified runs retain their explicit modifiers and no-extra-reward rule. Their records and economy impact are evaluated separately from Normal balance; easier loot farming through a modifier is an economy concern even when no bonus rewards are granted.

## 20. Boss design and loot chase

A focused build can kill bosses faster, and a coverage build can clear crowds faster. Both must retain a feasible approach to every required boss. Balance the whole rotation, including resources, movement, target availability, recovery and defenses. Do not make an attack so damaging that one safe hit erases a full final-boss phase merely to compensate for low crowd coverage.

Keep the authored mechanics and recent player-approved timings for Ravager, Butcher, Prophet, Wyrm, Colossus and Tyrant. This redesign budgets outputs around them; it does not globally lengthen tells or replace their kits. Every boss needs reachable melee openings and readable target locks. Damage cannot follow a new target after its committed telegraph has locked.

For multi-target mechanics, evaluate cleave, piercing, returning attacks, pets and persistent zones. A boss's clones or pylons must not let a build farm unlimited resource, kill refunds, healing or chained damage back into the boss. A pylon phase cannot be impossible for a focused build or take a support-only player an unreasonable duration without an alternate solution.

Avoid universal hard phase-health gates as the first balancing fix. Strong builds can earn faster fights. Encounter-specific phase protection is reserved for a mechanic that actually needs it and is visible to the player.

Retain the final boss as a difficult victory with a high-rarity personal weapon reward. Current final reward uses Mythic with a provisional 33% red chance; guaranteed red has not been confirmed. Generic drops and merchants do not roll red. An eventual Hollow Sovereign provides its exclusive named-red pool.

The Sovereign remains planned, not implemented: extremely rare abduction, omens, preserved main realm, separate encounter and return after realm defeat rather than ordinary run death. More than a couple of omens guarantees a later abduction if the player survives, under the creator annotation. Exact omen count/chance, safe return health and online party handling still need explicit design. Do not quietly ship a party split or change an ongoing boss fight to satisfy this draft.

Best-in-slot means best for a particular build and use. A focused beam weapon, burn-casting weapon, guardian weapon and ally-empowerment weapon can all be exceptional without one universal item replacing the collection.

## 21. Loot, retention and economy

Preserve personal gold and personal weapon rewards in co-op, independent of last hit or personal damage. Healing and buff players receive the same eligibility as damage players. Shared XP is awarded once for the party; each player spends their own choices.

Recommend filtering ordinary personal weapon drops to the current class and legal Ranger path. Shared Archer/Alchemist families remain shared collection assets. Boss and merchant eligibility uses the same filter. Named items with intentional broader collection eligibility state that explicitly instead of accidentally dropping unusable gear.

Current random seeds remain inputs for an economy pass: ordinary enemies roughly 0.15% weapon chance, elite leaders 5%, with scripted boss/event rules evaluated separately. Current generic rarity distribution is Common 55%, Magic 30%, Rare 13.75%, Legendary 1%, Mythic 0.25%, excluding red. Do not substitute the older PDF's much more generous probabilities by accident.

Evaluate expected retained upgrades per run rather than drop chance in isolation. Thousands of kills make small percentages substantial. More co-op spawns also create more XP/gold/drop opportunities; party difficulty and reward scaling must be considered together. Do not multiply every personal payout by player count on top of extra rewarded enemies.

Weapons picked up during the run use the 12-slot run bag. Only the equipped weapon and one safe-pocket weapon are retained from that bag when the run ends. Previously banked armory weapons remain safe. The permanent armory has its existing capacity/overflow handling. Overflow never silently deletes an earned retained item.

The pocket must be emptied through the existing between-run inventory flow. It cannot duplicate an item, rescue several weapons through repeated swapping at settlement, or preserve an illegal held weapon through a path change. Restart, abandon, ordinary death and victory all settle using the same transactional rules. Realm-defeat return is not ordinary settlement.

Gold remains permanent. Keep existing path unlocks, helper charges, bounded movement upgrades and cosmetic runes. New classes and roles should not require a hidden armor or jewelry economy. Existing movement upgrades are real power and must be included in veteran-versus-fresh balance comparisons.

Recommend a common item-power ceiling target for Normal runs, initially 30, while preserving any stored higher ceiling without destructive conversion. Whether later content meaningfully uses those higher ceilings is separate from rerolling or deleting them. Better rolls, useful affixes and named signatures provide the longer-term chase; endlessly larger ceilings must not invalidate every earlier item.

## 22. Forge and collection decisions

Keep the fixed forge, gold transactions, typed stat/behavior reforge, Rare+ stat-to-behavior conversion, one ordinary affix lock, quality up to +5 and salvage. Reforge retains the paid old/new choice until resolved. No repeated save/load can reroll the paid candidate or refund a consumed choice.

Preserve flat reforge prices by rarity and operation, replacing neither with the obsolete escalating-repeated-reforge rule. Current stat/behavior prices are 50/- for Common, 75/150 for Magic, 100/200 for Rare, 150/300 for Legendary, 200/400 for Mythic and 300/600 for Ascendant. Conversion 400 and locking 250 are existing seeds. Quality price escalation is a different operation and can retain its current curve pending economy testing.

Quality improves shared weapon power under this proposal, so it benefits attacks, abilities and eligible support amounts. Reprice only after measuring that broader value. Do not charge a healer for a quality upgrade that only changes its damage attack.

Show reforge eligibility and exclusions before spending. A legal family must have enough useful stat/behavior choices to support the advertised operation. Reforging never raises rarity, saved ceiling, ordinary slot count or creates a red signature. No currency for class-specific crafting is introduced.

Retain equipped/favorite salvage protection and the existing reduced away-from-forge salvage payout. Granting new path starters and migration fallbacks must not create a repeatable purchase/salvage profit loop. A corrupt or incompatible save should produce a recoverable choice, not silently regenerate the collection.

## 23. Co-op balance and support value

Keep host-authoritative world simulation, per-player class/build state, personal loot/gold and shared XP with separate picks. Up to five players and duplicate classes remain supported. Everyone down ends the run; standing players can revive a downed teammate through the current proximity interaction.

Retain the latest level-up rule: the shared world pauses while choices are pending; once one participant finishes, remaining players have the existing 20-second auto-pick countdown. Do not revive the superseded no-pause-online-level-up default. Ordinary menus and forge interaction use their separate protection rules; the original proposed general 15/30-second menu bubble is not equivalent to the current forge-only shield and still needs reconciliation before implementation.

Recommend initially retaining boss HP scaling near the current 1 + 0.6 x additional players as a co-op seed, while measuring every party size. Ordinary HP and spawn scaling must share one workload budget: multiplying normal HP by 2.4 and spawn rate by 2 at five players already approaches 4.8 times ordinary health throughput before composition effects. Avoid adding an unseen player-count damage multiplier on top.

Boss projectiles/hazards continue to threaten the appropriate individual targets and everyone physically in an area. A tank or healer does not cause automatic stronger enemy hits. Support strength is a player advantage to tune, not an excuse for the game to inspect the composition and secretly counter-scale it.

Balance a buffer by comparing a duo to another duo, then five-player compositions to other five-player compositions. A support may produce an exciting short burst, but sustained support plus empowered ally cannot vastly exceed an equally invested damage composition in every situation while also being safer and easier. Multiple buffers of the same category must not multiply without limit.

Healing and protection create more damage uptime. Include that in evaluations: a tank's damage cannot be set as though the team receives no protection, and a healer's personal damage cannot be evaluated as though its teammates still lose the same time to healing or deaths.

Late join, reconnect and disconnect preserve authoritative choices and effect ownership. Support effects expire or transfer according to their definitions, not because a player ID was reused. New buff/heal/proc events require bounded, source-aware network data; rendering can reduce cosmetic density without dropping gameplay effects or personal rewards.

## 24. UI and feedback

Weapon inspection shows family, legal paths, shared weapon power, attack profile, relevant ability/support effects, effective level versus saved ceiling, normalized affixes, quality, behavior caps and signature. Compare at the same current character level and show a full-power preview separately.

Use separate attack/ability/healing/protection/empowerment summaries. A single DPS arrow cannot describe the value of a healer's staff, a tank weapon or a buff weapon. Displaying +10% spell damage should correspond to a real increase in the affected spell amount in the preview.

Cards state their scope explicitly. Attack coverage names its family expression. Buff strength shows the actual granted percentage. New learned behaviors appear in the existing ability hover cards and build view. Missing prerequisites, caps and conflicting effects are visible before selection or forging.

Keep the established live 3D heroes, equipped weapon models, per-family animations, attack origins, rarity colors, path palettes and readable damage feedback. No new asset or VFX pack selection is part of this design rewrite. Visual size does not silently change hitboxes. Every future attack/development needs readable geometry and a performance budget alongside its mechanic.

Support feedback should show who is empowered, remaining duration and major burst windows to both players. Healing and protection should be readable without covering boss tells. A large buff can feel dramatic through feedback and timing without requiring a permanent several-fold multiplier.

## 25. Worked build examples

### Rapid-beam Pyromancer

Equip a Scepter with useful attack stats. Choose Haste, attack damage and a focused or piercing attack development. Weapon power improves both the beam and tactical spells. Ward creates a safer channel opening; Surge sets up a burn interaction only if the player selected one. The beam has credible boss output. Choosing forks improves distinct-target clearing rather than creating several full boss hits. The cost is less investment in spell coverage/resource efficiency and the need to keep aiming.

### AoE Pyromancer

Equip any legal Mage family with casting/burn/resource stats. Develop Fireball spread, Surge ground and selected Meteor behavior. Weapon forging improves the spell outputs. LMB remains useful for conserving energy and finishing targets, without needing to lead the build's damage. A focused spell/DoT investment supplies boss damage. Pool overlap, detonation and death explosions follow their caps.

### Greatsword Berserker

Equip a heavy weapon and invest in basic damage or a wider finisher. Rage generation is comparable to other families at similar successful uptime. Rush establishes position; Carnage handles a surrounding group; Wrath rewards committed attacks. It may have stronger boss punish damage than a ranged AoE build, but must survive close positioning. Crowd healing and blood stacks have bounded payoff.

### Ability-heavy Spellblade

Equip a Warrior weapon with ability/Rage support. Develop returning waves, orbit control or barrier bursts. Basics help finance the rotation rather than becoming the only damage source. Higher weapon power strengthens the void abilities. Selecting the Throwing Axe offers safer resource building, but does not inherit every close-melee damage premium. Ascension chains follow a normalized activation budget rather than multiplying with every pierced target.

### Alchemist with a Crossbow

A slow heavy bolt can generate enough Momentum through its normalized action credit to support mixtures. The player invests in resource efficiency and chemical interactions rather than being forced to use Short Bow for five times the hits. Pools prepare enemies; Catalyst and Grand Experiment provide payoff. Crossbow remains a useful line attack; its five pierced targets do not finance five free casts.

### Ninja with Chakram

Use returning paths and Smoke openings. Attack traits improve the blade's route or focused return, while Shuriken/Cyclone investments support a more active burst route. Shadow copies preserve the thrown-weapon theme within a shared budget. The boss can receive the deliberately authored outbound/return contacts, not unlimited repeated contacts while the blade overlaps its long body.

### Gunslinger with Shotgun

Close positioning lets up to three of five pellets connect on one enemy. That declared close-range package is balanced against Pistols' safer reliable stream. Momentum credit is per blast budget, and one pellet spread cannot trigger several full Quickstep resets or ability copies. Coverage investment reaches more enemies; it does not raise the same-target pellet cap.

### Future buffer and beam partner

The buffer chooses focused empowerment and times a major window with the Mage's attack opportunity. Its weapon improves the granted bonus within a capped formula. The Mage feels exceptional during that window. The duo's average output, survival and effort are compared with other duos. More beam ticks do not create recursive buff scaling or copy the buffer's resource economy.

## 26. Balance targets and how to verify them

Balance the total build under equal item quality/rarity, run investment, unlock tier, player count and encounter stage. Do not compare an optimized red item to a fresh Common starter and attribute the difference to class design.

| Test situation | What it measures | Failure signal |
| --- | --- | --- |
| Single moving boss, 60 seconds | Sustained realized damage, resource access, close-range uptime | A family cannot fund its basic rotation, or one overlap bypasses the encounter |
| Dense horde with mixed approach angles | Clear rate, threat escape, coverage and safety | Focused builds cannot make space, or AoE is permanently self-financing |
| Moving elite with supports | Priority damage, range, control and movement | A broad attack is best at every task, or melee gets no usable opening |
| Early, mid and late run | Growth and item-ceiling relevance | Weapon value vanishes after abilities develop, or saved gear erases early pressure |
| Two-player and five-player party | Buff value, effective healing, protection, workload and rewards | Support is mandatory, irrelevant or recursively multiplies output |
| Weak/normal/strong equipment | Fresh-run viability and reward significance | A basic mechanic requires one rare affix, or upgrades make no visible difference |

For comparable damage builds, use a provisional alert threshold around 15% difference in realized sustained boss output, then interpret the cost in safety, control, range and horde performance. This is a diagnostic, not a requirement that every archetype have identical damage. A deliberately committed melee specialist can exceed it if its broader tradeoffs are clear and tested.

As a starting build target, a coverage specialist might retain roughly 80-90% of a focused build's boss output while clearing ordinary groups substantially better. A defensive or support build is compared through total encounter contribution instead. The actual acceptable gap depends on resources and survivability, not just the damage meter.

### Initial family damage targets

Use the unmodified Longsword's complete three-hit cycle as 100 normalized single-target output. At the current 100 damage / 0.45-second base profile, that reference is approximately 222 damage/second before hit-window timing, movement, criticals, progression or affixes. The following are proposed starting bands for family coefficients, measured at equal power against one continuously reachable target. They do not describe current live balance and are not twenty-one identical-DPS requirements.

| Family | Normalized sustained single-target target | Reason for the proposed band |
| --- | --- | --- |
| Longsword | 100 | Balance anchor and moderate melee commitment |
| Greatsword | 95-105 | Heavy individual hits plus broad cleave and stagger; recovery remains a cost |
| Twin Blades | 100-110 | Short reach; paired contacts share output and proc budgets |
| Throwing Axe | 80-90 | Medium range and piercing reduce exposure |
| Warhammer | 95-105 | Close commitment balanced against radial impact and strong stagger |
| Staff | 70-80 | Long-range line coverage through multiple enemies |
| Wand | 80-90 | Responsive focused ranged attack |
| Grimoire | 70-80 | Seeking reliability and two wisps sharing one budget |
| Orb | 90-100 | Close exposure with inherent radial coverage; assumes free base pulse proposal |
| Spellbook | 75-85 | Short fan coverage; measure the permitted two-contact close case |
| Scepter | 85-95 | Sustained aim and channel movement penalty, with limited base coverage |
| Bow | 80-90 | Flexible ranged reference |
| Short Bow | 85-95 | Shorter effective range and sustained pressure |
| Long Bow | 75-85 | Exceptional range, aimed draw and large individual hits |
| Crossbow | 70-80 | Long-range heavy piercing and reload rhythm |
| Falconer's Glove | 80-90 before catch payoff; 110-125 with consistent successful catches | Catch success is skillful and risky; measure entire trips, never the 0.15-second request interval |
| Shuriken | 80-90 | Fast throws with periodic distinct-target fan |
| Kunai | 75-85 | Fast ranged piercing |
| Chakram | 75-85 across outbound and return passes | Returning coverage and two-blade limit are included in the cycle |
| Pistols | 75-85 | Auto-target reliability and alternating targets |
| Shotgun | 100-110 when three pellets connect | Very short range; one-pellet contact yields only one third of that package |

These bands allocate a close-range premium without treating every Warrior action as melee. Several reliable or broad ranged families deliberately start below the focused ranged reference. Their whole-build performance can still be strong through coverage, resource access and ability synergy. When measuring real boss fights, use actual attacking uptime rather than assuming the continuously reachable-target case.

Do not multiply a weapon's basic family target into its active skills. The same Fireball coefficient works with Wand or Staff at equal Weapon Power; their relevant item affixes and run choices create the difference. Likewise, all Alchemist legal weapons can fund the same reference mixture rotation at comparable successful attacking uptime.

### Build and encounter targets

The initial compatibility matrix contains 59 legal path/family combinations: 20 Warrior, 24 Mage and 15 Ranger. Compare representative attack-focused, ability-focused and hybrid investments across that matrix during tuning. This is the eventual balance coverage, not a demand to run 177 playthroughs or repeat broad tests after each batch. Start with each family's budget and each path's rotation, then test risky combinations such as fast attacks plus on-hit ultimates or returning attacks plus reactions.

Keep the approved level-1 Longsword's 100-damage baseline as the first anchor unless the creator separately approves changing it. Rebudget legacy x2/absolute routes around that anchor instead of globally doubling or halving every class. A boss's target HP can be estimated from measured realized party output times intended fight duration, then adjusted around its actual mechanics. If that measured output already includes movement and invulnerable phases, do not discount uptime a second time.

As a first duration hypothesis, compare ordinary pit encounters around 60-120 seconds at their intended progression stage and the final boss around 2-4 minutes for a competent, appropriately invested build. Optional early engagement, specialist burst and exceptional play can change those times. A very difficult final boss should threaten execution and resource decisions throughout those minutes, rather than simply extending a safe fight. These duration hypotheses require creator review and playtesting.

Run one focused integration fixture per implementation batch, including the changed output/resource/ownership paths, plus a brief relevant visual check. Broaden tests only for a concrete failure or major integration risk. Representative playtests are necessary for tuning; the existence of a spreadsheet formula or passing code check does not prove encounter balance.

## 27. Proposed implementation batches after design agreement

1. **Shared output and weapon foundation.** One source-aware modifier pipeline; shared power/quality; normalized progression; truthful stat scopes; resource/proc budgets; preservation of saves and current authored abilities. Include legal Ranger equipment groups and safe fallbacks because they are confirmed and affect every item route.
2. **Build choices and family development.** Attack developments, hybrid/resource choices, Build Insight, usable offers, weapon-switch mappings and complete Ranger behavior pools. Rebudget existing spell developments and same-target contacts together.
3. **Encounter and co-op tuning.** Normalize director workload, time-based enemy progression and boss comparisons; cap reactions, healing and temporary buffs; verify two-player/five-player compositions with current classes. Keep published visuals and existing boss kits intact except for approved balance changes.
4. **Future roles.** Design full healer/tank/buffer kits and weapon families against the shared contracts, then implement them as coherent class batches. Do not add placeholder mandatory roles before they have playable kits and solo/party answers.

Each batch receives the existing focused smoke/visual check, reference/log updates and one publication when implementation is actually requested. The current task is this design rewrite only.

Migration must preserve weapon IDs, family slots, stored ceilings/rolls/quality, forge history, gold, favorites and retained locations. Add explicit schema fields for affix scope, path eligibility and effect ownership. Never reinterpret a saved generic damage roll as a new randomly rolled ability affix. Keep legacy source values and a visible deterministic mapping. Only confirmed legal-equipment enforcement may force a fallback, and it must preserve the displaced item.

## 28. Decisions still needed before implementation

The design is complete enough to review as a whole. These recommended choices remain explicit approval points, rather than hidden assumptions:

| Choice | Recommendation in this draft |
| --- | --- |
| Family casting bias | Any Mage family can support attacks or casting; no mandatory family spell-power penalty |
| Numerical progression | Shared modest weapon power plus one character curve; run-level permanent-affix normalization |
| Critical stats | Direct attacks and damaging abilities share clear critical stats; no default DoT/heal/barrier criticals |
| Orb resource | Free base toggle; optional energy-consuming attack overcharge |
| Build milestones | Existing schedule, expanded from spell-only to attack/ability/hybrid/support development |
| Ordinary enemy HP | Main-world-time/tier scaling, replacing current player-level spawn scaling |
| Solo future roles | Functional offensive routes plus documented self-target rules; no hidden full-strength self conversion |
| Party composition | No mandatory healer/tank/buffer; support remains desirable through contribution |
| Future tank targeting | Protection compatible with current boss target cycling; no automatic permanent boss aggro |
| Red reward tuning | Preserve current provisional final-boss rule until a separate loot decision; author signatures before promising them |
| Sovereign online handling | Design separately before implementation; preserve current solo realm-return intent |
| General online menu safety | Reconcile the annotated 15/30-second proposal with current forge protection and level-up pause |

All numerical seeds in this draft are pending playtest. Individual class ability kits, attack families, boss mechanics and retained items are preserved until an implementation batch explicitly changes their balance behavior.

## 29. Source map

Current implementation and latest decisions were used to separate actual behavior from older proposals. The original PDFs remain source materials; this draft does not overwrite them.

| Area | Primary local sources |
| --- | --- |
| Current rules and authority | [Master reference](../GAME_REFERENCE.md), [decision history](reference/decisions.md), all reference-log topic segments |
| Shared damage, contact and base balance | [combat](../sites/veyrath/dist/combat.js), [balance constants](../sites/veyrath/dist/combat-balance.js), [survival](../sites/veyrath/dist/survival.js) |
| Weapons, scaling, forge and retention | [weapons](../sites/veyrath/dist/weapons.js), [families](../sites/veyrath/dist/weapon-families.js), [affixes](../sites/veyrath/dist/affix-data.js) |
| Levels, cards and behaviors | [cards](../sites/veyrath/dist/level-cards.js), [specializations](../sites/veyrath/dist/specializations.js), [talent data](../sites/veyrath/dist/talent-data.js) |
| Class mechanics | [Warrior](../sites/veyrath/dist/warrior.js), [Mage](../sites/veyrath/dist/mage.js), [Mage abilities](../sites/veyrath/dist/mage-abilities.js), [Blood Mage](../sites/veyrath/dist/blood-mage.js), [Ranger](../sites/veyrath/dist/ranger.js) |
| Director and world | [run director](../sites/veyrath/dist/run-director.js), [pits](../sites/veyrath/dist/pits.js), [world events](../sites/veyrath/dist/world-events.js), [pressure](../sites/veyrath/dist/encounter-pacing.js), [healing](../sites/veyrath/dist/healing.js) |
| Party and implementation limits | [party](../sites/veyrath/dist/party.js), [game integration](../sites/veyrath/dist/game.js), [co-op audit](COOP_AUDIT_2026-10-17.md), latest fx-208 systems notes |
| Permanent unlocks and modes | [meta](../sites/veyrath/dist/meta.js) |
| Original general design | [V0.8 annotated PDF](../Action_Roguelite_Complete_Game_Design_Review_V0_8%20%281%29.pdf), especially pages 4-22 |
| Original affix structure | [Weapon Affix V0.5 PDF](../VEYRATH_Weapon_Affix_System_V0_5_Quick_Reference.pdf), all three pages |
| Mage design and earlier proposals | [Mage V0.2 PDF](../VEYRATH_Mage_Class_Build_Spec_V0_2.pdf), especially pages 3-8 and 10-11 |
| Warrior design and superseding order | [Warrior specializations PDF](../VEYRATH_Warrior_Four_Specializations.pdf), [V0.9.2 change order](../VEYRATH_V0_9_2_COMPLETE_UPDATE_WITH_WARRIOR.pdf); later decisions/source replace old kits, schedules and values where noted |

