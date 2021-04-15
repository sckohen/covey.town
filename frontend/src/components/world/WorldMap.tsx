import React, { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import assert from 'assert';
import Phaser from 'phaser';
import Player, { UserLocation } from '../../classes/Player';
import Video from '../../classes/Video/Video';
import useCoveyAppState from '../../hooks/useCoveyAppState';
import SpacesServiceClient from '../../classes/SpacesServiceClient';

// https://medium.com/@michaelwesthadley/modular-game-worlds-in-phaser-3-tilemaps-1-958fc7e6bbd6
class CoveyGameScene extends Phaser.Scene {
  private player?: {
    sprite: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody, label: Phaser.GameObjects.Text
  };

  private id?: string;

  private players: Player[] = [];

  private cursors: Phaser.Types.Input.Keyboard.CursorKeys[] = [];

  /*
   * A "captured" key doesn't send events to the browser - they are trapped by Phaser
   * When pausing the game, we uncapture all keys, and when resuming, we re-capture them.
   * This is the list of keys that are currently captured by Phaser.
   */
  private previouslyCapturedKeys: number[] = [];

  private lastLocation?: UserLocation;

  private ready = false;

  private paused = false;

  private video: Video;

  private emitMovement: (loc: UserLocation) => void;

  private spaceCreateInfo: SpaceCreationInfo;

  private inSpace: string;

  private allSpaces: Phaser.GameObjects.Zone[];

  private spawnPoint: Phaser.GameObjects.Components.Transform | undefined;

  /**
   * Constructs the map taking in required arguments needed to 'play the game'
   * 
   * @param video 
   * @param emitMovement the location of the user, or void
   * @param spaceCreateInfo the information needed to create a space
   */
  constructor(video: Video, emitMovement: (loc: UserLocation) => void, spaceCreateInfo: SpaceCreationInfo) {
    super('PlayGame');
    this.video = video;
    this.emitMovement = emitMovement;
    this.spaceCreateInfo = spaceCreateInfo;
    this.inSpace = "World";
    this.allSpaces = [];
    this.spawnPoint = undefined;
  }

  preload() {
    // this.load.image("logo", logoImg);
    this.load.image('tiles', '/assets/tilesets/tuxmon-sample-32px-extruded.png');
    this.load.tilemapTiledJSON('map', '/assets/tilemaps/tuxemon-town.json');
    this.load.atlas('atlas', '/assets/atlas/atlas.png', '/assets/atlas/atlas.json');
  }

  
  /**
   * Gets space for the specific playerID
   * @param playerID ID for the player we want the space for
   * @returns  the space info
   */
  async getSpaceForPlayer(playerID: string) {
    const { spaceApiClient } = this.spaceCreateInfo;
    const playerSpace = await spaceApiClient.getSpaceForPlayer({ playerID });
    return playerSpace.space;
  }

  /**
   * EXISTING FUNCTION
   * updates the location of a group of given players that are moving. 
   * Also removes players from the space that have disconnedcted by detroying their sprite and label
   * 
   * @param players the list of players that are to be updated
   * @returns 
   */
  updatePlayersLocations(players: Player[]) {
    if (!this.ready) {
      this.players = players;
      return;
    }

    // Hide the sprite and label of player that do not share the same space as the player
    players.forEach((p) => {
      this.updatePlayerLocation(p);
      if (p.location){
        if (p.location.space !== this.inSpace) {
          p.sprite?.setAlpha(0);
          p.label?.setAlpha(0);
        } else {
          p.sprite?.setAlpha(100);
          p.label?.setAlpha(100);
        }
      }
    });

    // Remove disconnected players from board
    const disconnectedPlayers = this.players.filter(
      (player) => !players.find((p) => p.id === player.id),
    );
    disconnectedPlayers.forEach((disconnectedPlayer) => {
      if (disconnectedPlayer.sprite) {
        disconnectedPlayer.sprite.destroy();
        disconnectedPlayer.label?.destroy();
      }
    });
    // Remove disconnected players from list
    if (disconnectedPlayers.length) {
      this.players = this.players.filter(
        (player) => !disconnectedPlayers.find(
          (p) => p.id === player.id,
        ),
      );
    }
  }

  /**
   * EXISTING FUNCTION
   * Updates the location of a single player. Moves the location of their sprite based on how, or if, they move
   * @param player the player in question
   * @returns void
   */
  updatePlayerLocation(player: Player) {
    let myPlayer = this.players.find((p) => p.id === player.id);
    if (!myPlayer) {
      let { location } = player;
      if (!location) {
        location = {
          rotation: 'back',
          moving: false,
          x: 0,
          y: 0,
          space: 'World',
        };
      }
      myPlayer = new Player(player.id, player.userName, location);
      this.players.push(myPlayer);
    }

    if (this.id !== myPlayer.id && this.physics && player.location) {
      let { sprite } = myPlayer;

      if (!sprite) {
        sprite = this.physics.add
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore - JB todo
          .sprite(0, 0, 'atlas', 'misa-front')
          .setSize(30, 40)
          .setOffset(0, 24);
        const label = this.add.text(0, 0, myPlayer.userName, {
          font: '18px monospace',
          color: '#000000',
          backgroundColor: '#ffffff',
        });
        
        myPlayer.label = label;
        myPlayer.sprite = sprite;
      }
      if (!sprite.anims) return;
      sprite.setX(player.location.x);
      sprite.setY(player.location.y);
      myPlayer.label?.setX(player.location.x);
      myPlayer.label?.setY(player.location.y - 20);
      if (player.location.moving) {
        sprite.anims.play(`misa-${player.location.rotation}-walk`, true);
      } else {
        sprite.anims.stop();
        sprite.setTexture('atlas', `misa-${player.location.rotation}`);
      }
    }
  }

  /**
   * Finds the direction the player is moving in based on the key they pressed
   * @returns the direction to move in as a string or undefined
   */
  getNewMovementDirection() {
    if (this.cursors.find(keySet => keySet.left?.isDown)) {
      return 'left';
    }
    if (this.cursors.find(keySet => keySet.right?.isDown)) {
      return 'right';
    }
    if (this.cursors.find(keySet => keySet.down?.isDown)) {
      return 'front';
    }
    if (this.cursors.find(keySet => keySet.up?.isDown)) {
      return 'back';
    }
    return undefined;
  }

  /**
   * Creates a Phaser zone for the defined spaces (in the tilemap)
   * @param spaceID the space id given as the name of the object
   * @param map map object for the current world
   * @param sprite sprite object for collision detection
   * @param [debug] optional param to enable rendering of the zone
   * @returns  a zone object that detects players inside it
   */
  createZoneForSpace(spaceID: string, map: Phaser.Tilemaps.Tilemap, sprite: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody, debug?: boolean): Phaser.GameObjects.Zone {
    const { currentTownID } = this.spaceCreateInfo;

    // Get the location of the private space drawed on the map as an object
    const location = map.findObject('Objects',
    (obj) => obj.name === `Private Space ${spaceID}`) as unknown as
    Phaser.GameObjects.Components.Transform;

    // Get the dimensions for the private space drawed on the map
    const size = map.findObject('Objects',
    (obj) => obj.name === `Private Space ${spaceID}`) as unknown as
    Phaser.GameObjects.Components.Size;

    // Make a zone (hitbox) - origin is top left so correct by adding half the size
    const privateZone = this.add.zone(
      location.x + (size.width/2),
      location.y + (size.height/2),
      size.width, 
      size.height
      );
  
    privateZone.setName(`${currentTownID}_${spaceID}`);

    // Adds a collider to check colision with the player
    this.physics.add.collider(sprite, privateZone);

    if (debug === true) {
      // Draw graphics for debugging reasons
      const debugGraphics = this.add.graphics();
      debugGraphics.lineStyle(2, 0xffff00);
      debugGraphics.strokeRect(location.x, 
        location.y, 
        size.width, 
        size.height);
    }
    
    // Add the created space to allSpaces to keep track and return the created space
    this.allSpaces.push(privateZone);
    return privateZone;
  }

  
   /**
    * Initializes all spaces defined in the map
    * @param map the map for the game world
    */
   initializeSpaces(map: Phaser.Tilemaps.Tilemap) {
    // Create zone for all Private Spaces using the createZoneForPrivateSpace function
    if (this.player !== undefined) {
      const spriteForPlayer = this.player.sprite;
      // Get the a list of private space drawn on the map and create zones for all of them
      const privateSpaces = map.filterObjects('Objects', (obj) => obj.name.includes('Private Space'));
      privateSpaces.forEach(space => this.createZoneForSpace(space.name.slice(-1), map, spriteForPlayer, true));
    }
  }

  /**
   * Checks overlap between the sprite of the player and the different spaces
   * @param zone the zone to check if the player is in
   * @returns if these two objects overlap
   */
  checkOverlap(zone: Phaser.GameObjects.Zone) {
    const player = this.player?.sprite;
    
    if (player === undefined) {
      return false;
    }
    
    const boundsA = player.getBounds();
    const boundsB = zone.getBounds();

    return Phaser.Geom.Intersects.RectangleToRectangle(boundsA, boundsB);
  }

  /**
   * Helper function to join a space
   * @param space the space to join
   */
  async joinSpace(spaceID: string) {    
    const { spaceApiClient, myPlayerID } = this.spaceCreateInfo;
    const space = this.allSpaces.find(zone => zone.name === spaceID);
    
    if (space !== undefined){
      // Try to join a space (returns boolean for success or failure)
      try {
        await spaceApiClient.joinSpace({ coveySpaceID: space.name, playerID: myPlayerID });
        this.inSpace = space.name;
        console.log('Was able to join');
      } catch (error) {
        // If join space attempt fails, kick player out of space
        if(this.spawnPoint && this.player && this.lastLocation){
          // Move the player to their last location (outside the space)
          const locationForSpawn = {
            x: this.spawnPoint.x,
            y: this.spawnPoint.x,
            rotation: this.lastLocation.rotation,
            moving: false,
            space: 'World',
          }
          this.player.sprite.x = this.spawnPoint.x;
          this.player.sprite.y = this.spawnPoint.y;
          // this.lastLocation.space = this.inSpace;
          this.emitMovement(locationForSpawn);
          console.log('Not able to join');
        }
      }
    }
  }

  /**
   * Helper function to leave a space
   * @param space the space to leave
   */
  async leaveSpace(space: Phaser.GameObjects.Zone) {
    const { spaceApiClient, myPlayerID } = this.spaceCreateInfo;
    try {
      await spaceApiClient.leaveSpace({ coveySpaceID: space.name, playerID: myPlayerID });
      this.inSpace = "World";
    } catch (error) {
      this.inSpace = space.name;
    }
  }

  create() {
    const map = this.make.tilemap({ key: 'map' });

    /* Parameters are the name you gave the tileset in Tiled and then the key of the
     tileset image in Phaser's cache (i.e. the name you used in preload)
     */
    const tileset = map.addTilesetImage('tuxmon-sample-32px-extruded', 'tiles');

    // Parameters: layer name (or index) from Tiled, tileset, x, y
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const belowLayer = map.createLayer('Below Player', tileset, 0, 0);
    const worldLayer = map.createLayer('World', tileset, 0, 0);
    worldLayer.setCollisionByProperty({ collides: true });
    const aboveLayer = map.createLayer('Above Player', tileset, 0, 0);
    /* By default, everything gets depth sorted on the screen in the order we created things.
     Here, we want the "Above Player" layer to sit on top of the player, so we explicitly give
     it a depth. Higher depths will sit on top of lower depth objects.
     */
    aboveLayer.setDepth(10);

    // Object layers in Tiled let you embed extra info into a map - like a spawn point or custom
    // collision shapes. In the tmx file, there's an object layer with a point named "Spawn Point"
    this.spawnPoint = map.findObject('Objects',
      (obj) => obj.name === 'Spawn Point') as unknown as
      Phaser.GameObjects.Components.Transform;


    // Find all of the transporters, add them to the physics engine
    const transporters = map.createFromObjects('Objects',
      { name: 'transporter' })
    this.physics.world.enable(transporters);

    // For each of the transporters (rectangle objects), we need to tweak their location on the scene
    // for reasons that are not obvious to me, but this seems to work. We also set them to be invisible
    // but for debugging, you can comment out that line.
    transporters.forEach(transporter => {
        const sprite = transporter as Phaser.GameObjects.Sprite;
        sprite.y += 2 * sprite.height; // Phaser and Tiled seem to disagree on which corner is y
        sprite.setVisible(false); // Comment this out to see the transporter rectangles drawn on
                                  // the map
      }
    );

    const labels = map.filterObjects('Objects',(obj)=>obj.name==='label');
    labels.forEach(label => {
      if(label.x && label.y){
        this.add.text(label.x, label.y, label.text.text, {
          color: '#FFFFFF',
          backgroundColor: '#000000',
        })
      }
    });

    /**
     * allows the 'wasd' keys and 'hjkl' keys to be viable movement keys
     */
    const cursorKeys = this.input.keyboard.createCursorKeys();
    this.cursors.push(cursorKeys);
    this.cursors.push(this.input.keyboard.addKeys({
      'up': Phaser.Input.Keyboard.KeyCodes.W,
      'down': Phaser.Input.Keyboard.KeyCodes.S,
      'left': Phaser.Input.Keyboard.KeyCodes.A,
      'right': Phaser.Input.Keyboard.KeyCodes.D
    }, false) as Phaser.Types.Input.Keyboard.CursorKeys);
    this.cursors.push(this.input.keyboard.addKeys({
      'up': Phaser.Input.Keyboard.KeyCodes.H,
      'down': Phaser.Input.Keyboard.KeyCodes.J,
      'left': Phaser.Input.Keyboard.KeyCodes.K,
      'right': Phaser.Input.Keyboard.KeyCodes.L
    }, false) as Phaser.Types.Input.Keyboard.CursorKeys);


    // Create a sprite with physics enabled via the physics system. The image used for the sprite
    // has a bit of whitespace, so I'm using setSize & setOffset to control the size of the
    // player's body.
    const sprite = this.physics.add
      .sprite(this.spawnPoint.x, this.spawnPoint.y, 'atlas', 'misa-front')
      .setSize(30, 40)
      .setOffset(0, 24);
    const label = this.add.text(this.spawnPoint.x, this.spawnPoint.y - 20, '(You)', {
      font: '18px monospace',
      color: '#000000',
      // padding: {x: 20, y: 10},
      backgroundColor: '#ffffff',
    });
    this.player = {
      sprite,
      label
    };

    /* Configure physics overlap behavior for when the player steps into
    a transporter area. If you enter a transporter and press 'space', you'll
    transport to the location on the map that is referenced by the 'target' property
    of the transporter.
     */
    this.physics.add.overlap(sprite, transporters,
      (overlappingObject, transporter)=>{
      if(cursorKeys.space.isDown && this.player){
        // In the tiled editor, set the 'target' to be an *object* pointer
        // Here, we'll see just the ID, then find the object by ID
        const transportTargetID = transporter.getData('target') as number;
        const target = map.findObject('Objects', obj => (obj as unknown as Phaser.Types.Tilemaps.TiledObject).id === transportTargetID);
        if(target && target.x && target.y && this.lastLocation){
          // Move the player to the target, update lastLocation and send it to other players
          this.player.sprite.x = target.x;
          this.player.sprite.y = target.y;
          this.lastLocation.x = target.x;
          this.lastLocation.y = target.y;
          this.lastLocation.space = this.inSpace;
          this.emitMovement(this.lastLocation);
        }
        else{
          throw new Error(`Unable to find target object ${target}`);
        }
      }
    })

    this.emitMovement({
      rotation: 'front',
      moving: false,
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore - JB todo
      x: this.spawnPoint.x,
      y: this.spawnPoint.y,
      space: 'World'
    });

    // Watch the player and worldLayer for collisions, for the duration of the scene:
    this.physics.add.collider(sprite, worldLayer);

    // Create a zone for all Private Spaces using the createZoneForPrivateSpace function
    this.initializeSpaces(map);

    // Create the player's walking animations from the texture atlas. These are stored in the global
    // animation manager so any sprite can access them.
    const { anims } = this;
    anims.create({
      key: 'misa-left-walk',
      frames: anims.generateFrameNames('atlas', {
        prefix: 'misa-left-walk.',
        start: 0,
        end: 3,
        zeroPad: 3,
      }),
      frameRate: 10,
      repeat: -1,
    });
    anims.create({
      key: 'misa-right-walk',
      frames: anims.generateFrameNames('atlas', {
        prefix: 'misa-right-walk.',
        start: 0,
        end: 3,
        zeroPad: 3,
      }),
      frameRate: 10,
      repeat: -1,
    });
    anims.create({
      key: 'misa-front-walk',
      frames: anims.generateFrameNames('atlas', {
        prefix: 'misa-front-walk.',
        start: 0,
        end: 3,
        zeroPad: 3,
      }),
      frameRate: 10,
      repeat: -1,
    });
    anims.create({
      key: 'misa-back-walk',
      frames: anims.generateFrameNames('atlas', {
        prefix: 'misa-back-walk.',
        start: 0,
        end: 3,
        zeroPad: 3,
      }),
      frameRate: 10,
      repeat: -1,
    });

    const camera = this.cameras.main;
    camera.startFollow(this.player.sprite);
    camera.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

    // Help text that has a "fixed" position on the screen
    this.add
      .text(16, 16, `Arrow keys to move, space to transport\nCurrent town: ${this.video.townFriendlyName} (${this.video.coveyTownID})`, {
        font: '18px monospace',
        color: '#000000',
        padding: {
          x: 20,
          y: 10
        },
        backgroundColor: '#ffffff',
      })
      .setScrollFactor(0)
      .setDepth(30);

    this.ready = true;
    if (this.players.length) {
      // Some players got added to the queue before we were ready, make sure that they have
      // sprites....
      this.players.forEach((p) => this.updatePlayerLocation(p));
    }
  }

  /**
   * updates the visuals based on the direction the sprite moves in. shows an animation of the sprite walking in the direction.
   * @returns 
   */
  update() {
    if (this.paused) {
      return;
    }
    if (this.player && this.cursors) {
      const speed = 175;
      const prevVelocity = this.player.sprite.body.velocity.clone();
      const body = this.player.sprite.body as Phaser.Physics.Arcade.Body;

      // Stop any previous movement from the last frame
      body.setVelocity(0);

      const primaryDirection = this.getNewMovementDirection();
      switch (primaryDirection) {
        case 'left':
          body.setVelocityX(-speed);
          this.player.sprite.anims.play('misa-left-walk', true);
          break;
        case 'right':
          body.setVelocityX(speed);
          this.player.sprite.anims.play('misa-right-walk', true);
          break;
        case 'front':
          body.setVelocityY(speed);
          this.player.sprite.anims.play('misa-front-walk', true);
          break;
        case 'back':
          body.setVelocityY(-speed);
          this.player.sprite.anims.play('misa-back-walk', true);
          break;
        default:
          // Not moving
          this.player.sprite.anims.stop();
          // If we were moving, pick and idle frame to use
          if (prevVelocity.x < 0) {
            this.player.sprite.setTexture('atlas', 'misa-left');
          } else if (prevVelocity.x > 0) {
            this.player.sprite.setTexture('atlas', 'misa-right');
          } else if (prevVelocity.y < 0) {
            this.player.sprite.setTexture('atlas', 'misa-back');
          } else if (prevVelocity.y > 0) this.player.sprite.setTexture('atlas', 'misa-front');
          break;
      }

      // Normalize and scale the velocity so that player can't move faster along a diagonal
      this.player.sprite.body.velocity.normalize()
        .scale(speed);

      const isMoving = primaryDirection !== undefined;
      this.player.label.setX(body.x);
      this.player.label.setY(body.y - 20);
      if (!this.lastLocation
        || this.lastLocation.x !== body.x
        || this.lastLocation.y !== body.y || this.lastLocation.rotation !== primaryDirection
        || this.lastLocation.moving !== isMoving) {
        if (!this.lastLocation) {
          this.lastLocation = {
            x: body.x,
            y: body.y,
            rotation: primaryDirection || 'front',
            moving: isMoving,
            space: this.inSpace,
          };
        }
        this.lastLocation.x = body.x;
        this.lastLocation.y = body.y;
        this.lastLocation.rotation = primaryDirection || 'front';
        this.lastLocation.moving = isMoving;
        this.lastLocation.space = this.inSpace;
        this.emitMovement(this.lastLocation);
      }
    }

    // Handles which space the player is in
    this.allSpaces.forEach(space => {
      if(this.checkOverlap(space) && this.inSpace === 'World') {
        this.joinSpace(space.name);
      }

      if(!this.checkOverlap(space) && this.inSpace === space.name) {
        this.leaveSpace(space);
      }
    });
  }

  pause() {
    this.paused = true;
    this.previouslyCapturedKeys = this.input.keyboard.getCaptures();
    this.input.keyboard.clearCaptures();
  }

  resume() {
    this.paused = false;
    this.input.keyboard.addCapture(this.previouslyCapturedKeys);
    this.previouslyCapturedKeys = [];
  }
  
}
// the info needed to create a space 
// API client, the player Id, and the current town Id
type SpaceCreationInfo = {
  spaceApiClient: SpacesServiceClient,
  myPlayerID: string,
  currentTownID: string,
}

// exports the default world map function to connect the hitbox in the map with the backend of a private space
export default function WorldMap(): JSX.Element {
  const video = Video.instance();
  const url = process.env.REACT_APP_TOWNS_SERVICE_URL;
  assert(url);
  const {
    emitMovement, 
    players,
    spaceApiClient,
    myPlayerID,
    currentTownID,
    currentLocation,
    sessionToken
  } = useCoveyAppState();
  const [gameScene, setGameScene] = useState<CoveyGameScene>();
  useEffect(() => {
    const config = {
      type: Phaser.AUTO,
      parent: 'map-container',
      minWidth: 800,
      minHeight: 600,
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { y: 0 }, // Top down game, so no gravity
        },
      },
    };

    // gets info needed to create a space
    const spaceCreateInfo = { spaceApiClient, myPlayerID, currentTownID };

    const game = new Phaser.Game(config);
    if (video) {
      const newGameScene = new CoveyGameScene(video, emitMovement, spaceCreateInfo);
      setGameScene(newGameScene);
      game.scene.add('coveyBoard', newGameScene, true);
      video.pauseGame = () => {
        newGameScene.pause();
      }
      video.unPauseGame = () => {
        newGameScene.resume();
      }
    }
    return () => {
      game.destroy(true);
    };
  }, [video, emitMovement, spaceApiClient, myPlayerID, currentTownID]);

  const deepPlayers = JSON.stringify(players);
  useEffect(() => {
    gameScene?.updatePlayersLocations(players);
  }, [players, deepPlayers, gameScene, currentLocation.space]);

  useEffect(() => {
    const socket = io(url, { auth: { token: sessionToken, coveyTownID: currentTownID } });
    socket.on('spaceClaimed', () => {
      gameScene?.joinSpace(currentLocation.space);
      console.log('I am called');
    });
    socket.on('playerDisconnect', () => {
      socket.disconnect();
    });
    socket.on('disconnect', () => {
      socket.disconnect();
    });
  }, []);

  return <div id="map-container"/>;
}