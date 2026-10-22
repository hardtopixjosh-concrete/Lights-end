//////////
// INFO //
//////////

Hello! Thank you for downloading the Super Pixel Item Pickups: Fantasy Pack 1 asset pack.
This document contains version history and tips on how to use the asset pack.

Did you know? You can get access to ALL of my assets if you support me on Patreon!
Check it out: patreon.com/untiedgames

MORE LINKS:
Browse my other assets: untiedgames.itch.io
Watch me make pixel art, games, and more: youtube.com/c/unTiedGamesTV
Follow on Mastodon: mastodon.gamedev.place/@untiedgames
Follow on Facebook: facebook.com/untiedgames
Visit my blog: untiedgames.com
Newsletter signup: untiedgames.com/signup

Thanks, and happy game dev!
- Will

/////////////////////
// VERSION HISTORY //
/////////////////////

Version 2.0 (4/9/23)
	- Added the following additional color themes for the item pickups:
		- Coin large red
		- Coin large orange
		- Coin large yellow
		- Coin large green
		- Coin large blue
		- Coin large violet
		- Coin small red
		- Coin small orange
		- Coin small yellow
		- Coin small green
		- Coin small blue
		- Coin small violet
		- Energy orb red
		- Energy orb orange
		- Energy orb green
		- Gem orange
		- Gem yellow
		- Gem violet
		- Heart A large pink
		- Heart A large orange
		- Heart A large yellow
		- Heart A large violet
		- Heart A small pink
		- Heart A small orange
		- Heart A small yellow
		- Heart A small violet
		- Heart B pink
		- Heart B orange
		- Heart B yellow
		- Heart B violet
		- Key red
		- Key orange
		- Key yellow
		- Key green
		- Key blue
		- Key violet
		- Potion orange
		- Potion yellow
		- Potion blue
		- Relic A orange
		- Relic A yellow
		- Relic A green
		- Relic B orange
		- Relic B yellow
		- Relic B blue
		- Soul orange
		- Soul yellow
		- Soul green

Version 1.0 (3/24/23)
	- Initial release. Woohoo!

////////////////////////////////
// HOW TO USE THIS ASSET PACK //
////////////////////////////////

Here are a few pointers to help you navigate and make sense of this zip file.

- In the root folder, you will find folders named PNG and spritesheet.

- The PNG folder contains all the item animations separated into their own folders, with the frames as individual PNG files.

- The spritesheet folder contains all the item animations separated into their own folders, but with the frames packed into a single image. A metadata file is alongside each spritesheet which may be used to parse the image.

- The spritesheets are provided as an alternate method of loading the images into your game.
  Each line of a spritesheet's metadata file will look like the following example:
	
	image.png = 0 32 16 24

  The format is:

	path = x y w h

  ...Where path is the path to the file (with extension). X and Y represent the upper left corner (in pixels) of the image on the sheet. W and H represent the width and height of the image on the sheet (in pixels).
  So in our example above, we could locate image.png on our spritesheet. Its upper left corner would be (0, 32) and it would have a size of 16x24.

- Recommended animation FPS: 15 (66.7 ms/frame)

Any questions?
Email me at contact@untiedgames.com and I'll try to answer as best I can!

-Will