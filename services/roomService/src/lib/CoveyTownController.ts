import { customAlphabet, nanoid } from 'nanoid';
import { CoveySpaceList, UserLocation } from '../CoveyTypes';
import CoveyTownListener from '../types/CoveyTownListener';
import Player from '../types/Player';
import PlayerSession from '../types/PlayerSession';
import TwilioVideo from './TwilioVideo';
import IVideoClient from './IVideoClient';
import CoveySpaceController  from './CoveySpaceController';


const friendlyNanoID = customAlphabet('1234567890ABCDEF', 8);

/**
 * The CoveyTownController implements the logic for each town: managing the various events that
 * can occur (e.g. joining a town, moving, leaving a town)
 */
export default class CoveyTownController {
  get capacity(): number {
    return this._capacity;
  }
  set isPubliclyListed(value: boolean) {
    this._isPubliclyListed = value;
  }

  get isPubliclyListed(): boolean {
    return this._isPubliclyListed;
  }

  get townUpdatePassword(): string {
    return this._townUpdatePassword;
  }

  get players(): Player[] {
    return this._players;
  }

  get occupancy(): number {
    return this._listeners.length;
  }

  get friendlyName(): string {
    return this._friendlyName;
  }

  set friendlyName(value: string) {
    this._friendlyName = value;
  }

  get coveyTownID(): string {
    return this._coveyTownID;
  }

  get privateSpaces(): CoveySpaceController[] {
    return this._privateSpaces;
  }

  /** The list of players currently in the town * */
  private _players: Player[] = [];
  
  /** The list of spaces in the town * */
  private _privateSpaces: CoveySpaceController[] = [];

  /** The list of valid sessions for this town * */
  private _sessions: PlayerSession[] = [];

  /** The videoClient that this CoveyTown will use to provision video resources * */
  private _videoClient: IVideoClient = TwilioVideo.getInstance();

  /** The list of CoveyTownListeners that are subscribed to events in this town * */
  private _listeners: CoveyTownListener[] = [];

  private readonly _coveyTownID: string;

  private _friendlyName: string;

  private readonly _townUpdatePassword: string;

  private _isPubliclyListed: boolean;

  private _capacity: number;

  constructor(friendlyName: string, isPubliclyListed: boolean) {
    this._coveyTownID = (process.env.DEMO_TOWN_ID === friendlyName ? friendlyName : friendlyNanoID());
    this._capacity = 50;
    this._townUpdatePassword = nanoid(24);
    this._isPubliclyListed = isPubliclyListed;
    this._friendlyName = friendlyName;
    this._privateSpaces = []; // Initialize with no spaces
  }


  /**
   * Adds a player to this Covey Town, provisioning the necessary credentials for the
   * player, and returning them
   *
   * @param newPlayer The new player to add to the town
   */
  async addPlayer(newPlayer: Player): Promise<PlayerSession> {
    const theSession = new PlayerSession(newPlayer);

    this._sessions.push(theSession);
    this._players.push(newPlayer);

    // Create a video token for this user to join this town
    theSession.videoToken = await this._videoClient.getTokenForTown(this._coveyTownID, newPlayer.id);

    // Notify other players that this player has joined
    this._listeners.forEach((listener) => listener.onPlayerJoined(newPlayer));

    return theSession;
  }

  /**
   * Destroys all data related to a player in this town.
   *
   * @param session PlayerSession to destroy
   */
  destroySession(session: PlayerSession): void {
    this._players = this._players.filter((p) => p.id !== session.player.id);
    this._sessions = this._sessions.filter((s) => s.sessionToken !== session.sessionToken);
    this._listeners.forEach((listener) => listener.onPlayerDisconnected(session.player));
  }

  /**
   * Updates the location of a player within the town
   * @param player Player to update location for
   * @param location New location for this player
   */
  updatePlayerLocation(player: Player, location: UserLocation): void {
    player.updateLocation(location);
    this._listeners.forEach((listener) => listener.onPlayerMoved(player));
  }


  /**
   * Subscribe to events from this town. Callers should make sure to
   * unsubscribe when they no longer want those events by calling removeTownListener
   *
   * @param listener New listener
   */
  addTownListener(listener: CoveyTownListener): void {
    this._listeners.push(listener);
  }

  /**
   * Unsubscribe from events in this town.
   *
   * @param listener The listener to unsubscribe, must be a listener that was registered
   * with addTownListener, or otherwise will be a no-op
   */
  removeTownListener(listener: CoveyTownListener): void {
    this._listeners = this._listeners.filter((v) => v !== listener);
  }

  /**
   * Fetch a player's session based on the provided session token. Returns undefined if the
   * session token is not valid.
   *
   * @param token
   */
  getSessionByToken(token: string): PlayerSession | undefined {
    return this._sessions.find((p) => p.sessionToken === token);
  }

  disconnectAllPlayers(): void {
    this._listeners.forEach((listener) => listener.onTownDestroyed());
  }

  // This is where the private space storing begins !!!

  /**
   * Create a new private space 
   * @param newSpaceID  the ID for the new space
   */
  addPrivateSpace(newSpaceID: string): CoveySpaceController {
    const newSpace = new CoveySpaceController(newSpaceID); 
    this._privateSpaces.push(newSpace);
    return newSpace;
  }

  /**
   * gets a specific private space controller from a given covey space ID
   * @param coveySpaceID The ID number for a covey space
   */
      getControllerForSpace(coveySpaceID: string): CoveySpaceController | undefined {
      return this._privateSpaces.find((v) => v.coveySpaceID == coveySpaceID); 

    }

  /**
   * Updates a private space based on the host's request
   * @param coveySpaceId the ID number for a covey space
   * @param spaceHost the desired host of a space that may or maynot be updated
   * @param whitelist the desired whitelist of a space that may or maynot be updated
   */
  updateCoveySpace(coveySpaceID: string, spaceHost: Player, spacePresenter: Player, whitelist: Player[]): void {
    const hostedSpace = this.getControllerForSpace(coveySpaceID);
    if ( spaceHost.id !== hostedSpace?.spaceHostID) {
      hostedSpace?.updateSpaceHost(spaceHost.id);
    }
    if ( spacePresenter.id !== hostedSpace?.presenterID) {
      hostedSpace?.updatePresenter(spacePresenter.id);
    }
    if (whitelist !== hostedSpace?.whiteList) {
      hostedSpace?.updateWhitelist(whitelist);
    }
  }

  /**
   * Gets the list of all private spaces
   */
  getSpaces(): CoveySpaceList {
    return this._privateSpaces.map(spaceController => ({
      coveySpaceID: spaceController.coveySpaceID, 
      currentPlayers: spaceController.players}));
  }

  /**
   * Adds the player to the space they requested to join
   * @param newPlayerID the ID for the player that would like to join the space
   * @param spaceID the spaceID for the space they would like to join
   * @returns the controller for the space the player joined
   */
  joinSpace(newPlayerID: string, spaceID: string): CoveySpaceController {
    const spaceController = this.getControllerForSpace(spaceID);
    const newPlayerFromID = this.players.find(p => p.id === newPlayerID);
    
    if (!spaceController || !newPlayerFromID) {
      throw new Error("Space controller or newPlayer not found");
    }

    spaceController.addPlayer(newPlayerFromID);
    return spaceController;
  }

  /**
   * Removes the player from the space they requested to leave
   * @param playerID the the ID for the player that would like to leave the space
   * @param spaceID the spaceID for the space they would like to leave
   */
   leaveSpace(playerID: string, spaceID: string): void {
    const spaceController = this.getControllerForSpace(spaceID);
    const playerFromID = this.players.find(p => p.id === playerID);
    
    if (!spaceController || !playerFromID) {
      throw new Error("Space controller or player not found");
    }

    spaceController.removePlayer(playerFromID);
  }

   /**
   * Removes all players from the space in means to disband the space
   * @param spaceID the spaceID for the space they would like to leave
   */
    disbandSpace(spaceID: string): boolean {
      const spaceController = this.getControllerForSpace(spaceID);

      if (spaceController) {
        spaceController.disconnectAllPlayers();
        spaceController.updateSpaceHost(null);
        spaceController.updatePresenter(null);
        spaceController.updateWhitelist([]);
        return true;
      }
      return false;
    }
}
