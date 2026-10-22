// UI icons (Oct 16 UI redesign). Placeholder line glyphs until the user's painted icons arrive.
// To use a painted icon: drop a square PNG/WebP in assets/icons/ and map the ability/card name here.
// Everything that shows an icon goes through iconNode(), so swapping art is data-only.
export const ICON_FILES={
 // 'Fireball':'assets/icons/fireball.webp',
};
const SVG_NS='http://www.w3.org/2000/svg';
export const GLYPHS={
 sword:{lmb:'M8 30L26 8M22 6L28 4L30 10M11 23L15 27M6 28L10 32',cleave:'M7 30L29 7M22 7H29V14M4 23L14 33M5 32L10 27',parry:'M18 3L30 8V18Q29 29 18 34Q7 29 6 18V8ZM11 18L16 23L26 12',slam:'M6 5H27V14H6ZM16 14V27M11 32L16 25L21 32M4 31L8 27M25 27L31 32',storm:'M29 10Q12 -1 6 15Q1 30 22 30Q36 24 27 17Q18 9 11 20M10 8L5 16L14 16M26 28L32 21L23 20',dash:'M17 4L25 11L20 19L30 26L27 32L15 29L8 21L13 11M2 14H9M1 22H6'},
 mage:{lmb:'M18 3L21 15L33 18L21 21L18 33L15 21L3 18L15 15Z',cleave:'M18 32Q2 29 9 17Q9 24 14 23Q10 13 23 3Q20 15 27 18Q36 31 18 32Z',parry:'M18 2V34M2 18H34M6 6L30 30M6 30L30 6M13 7L18 12L23 7M7 13L12 18L7 23',slam:'M22 2L10 18H19L13 34L30 14H21Z',storm:'M2 3L19 20M13 1L27 15M2 13L15 27M30 21Q36 33 25 34Q13 35 16 25Q19 16 30 21Z',dash:'M3 4L16 17L3 30M18 4L31 17L18 30'},
 generic:'M18 4L32 18L18 32L4 18Z'
};
// Oct 18 (user: "look more like the pictures", no painted art yet): one glyph per weapon family, matched from
// the weapon name ("Tempered Wand" -> wand), drawn in three layers (soft glow, tinted body, light core).
const FAMILY_GLYPHS=[
 ['greatsword','M7 31L27 9M23 5L31 5L31 13M10 22L16 28M5 29L9 33M18 14L24 20'],['longsword','M8 30L26 8M22 6L28 4L30 10M11 23L15 27M6 28L10 32'],
 ['twin blades','M6 30L20 10M30 30L16 10M8 24L12 28M28 24L24 28'],['throwing axe','M10 32L22 8M18 6Q30 6 30 18Q24 14 20 16Z'],
 ['warhammer','M8 32L20 14M14 8L26 20L30 14L20 4Z'],
 ['staff','M9 34L24 10M24 10L22 4L27 1L32 5L29 11ZM20 14L16 12'],['wand','M8 30L24 14M24 14L28 6L30 12L24 14M27 4L29 2M32 9L34 8'],
 ['grimoire','M6 8H18V30H6ZM18 8H30V30H18ZM12 14V24M24 14V24'],['spellbook','M6 8H18V30H6ZM18 8H30V30H18ZM24 13L25.5 17L29 18L25.5 19L24 23L22.5 19L19 18L22.5 17Z'],
 ['orb','M18 17m-8 0a8 8 0 1 0 16 0a8 8 0 1 0 -16 0M12 30H24M14 26H22M15 14L18 11'],['scepter','M10 32L22 14M22 14L20 8L26 4L30 10L24 14Z'],
 ['long bow','M9 2Q33 18 9 34M9 2V34M4 18H31M27 14L31 18L27 22'],['short bow','M12 8Q28 18 12 28M12 8V28M8 18H28M24 15L28 18L24 21'],['crossbow','M18 6V32M6 12Q18 20 30 12M8 12H28M14 28H22'],['bow','M10 4Q30 18 10 32M10 4V32M6 18H30M26 14L30 18L26 22'],
 ['shuriken','M18 4L21 15L32 18L21 21L18 32L15 21L4 18L15 15Z'],['kunai','M18 4L22 16L18 28L14 16ZM18 28V33M15 33H21'],
 ['pistols','M6 14H28V20H16L14 30H8L10 20H6Z'],['shotgun','M4 14H32V19H14L11 29H6L8 19H4Z'],
 ['chakram','M18 18m-11 0a11 11 0 1 0 22 0a11 11 0 1 0 -22 0M18 18m-6 0a6 6 0 1 0 12 0a6 6 0 1 0 -12 0']];
const familyGlyph=name=>{const n=String(name).toLowerCase();return FAMILY_GLYPHS.find(([k])=>n.includes(k))?.[1];};
// Returns an <img> for a mapped painted icon, otherwise an inline SVG glyph.
export function iconNode(name,classId,slot){
 const file=ICON_FILES[name];
 if(file){const img=document.createElement('img');img.src=file;img.alt='';img.draggable=false;return img;}
 const svg=document.createElementNS(SVG_NS,'svg');svg.setAttribute('viewBox','0 0 36 36');svg.setAttribute('aria-hidden','true');
 const d=(slot==='lmb'&&familyGlyph(name))||GLYPHS[classId==='mage'?'mage':'sword'][slot]||GLYPHS.generic;
 for(const cls of ['ig','ib','ic']){const p=document.createElementNS(SVG_NS,'path');p.setAttribute('d',d);p.setAttribute('class',cls);svg.append(p);}return svg;
}
