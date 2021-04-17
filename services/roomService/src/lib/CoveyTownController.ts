import { customAlphabet,nanoid } from 'nanoid';
import { CoveySpaceInfo,UserLocation } from '../CoveyTypes';
import CoveyTownListener from '../types/CoveyTownListener';
import Player from '../types/Player';
import PlayerSession from '../types/PlayerSession';
import CoveySpaceController from './CoveySpaceController';
import IVideoClient from './IVideoClient';
import TwilioVideo from './TwilioVideo';

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

  get spaces(): CoveySpaceController[] {
    return this._spaces;
  }

  /** The list of players currently in the town * */
  private _players: Player[] = [];

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

  private _spaces: CoveySpaceController[];

  constructor(friendlyName: string, isPubliclyListed: boolean) {
    this._coveyTownID = (process.env.DEMO_TOWN_ID === friendlyName ? friendlyName : friendlyNanoID());
    this._capacity = 50;
    this._townUpdatePassword = nanoid(24);
    this._isPubliclyListed = isPubliclyListed;
    this._friendlyName = friendlyName;
    
    // add two new spaces (future modifactions of the code would load the spaces dynamically from the map
    // fut for now spaces are hard coded since we can gurantee there will only be two)
    this._spaces = [];
    this._spaces.push(new CoveySpaceController(`${this.coveyTownID}_1`));
    this._spaces.push(new CoveySpaceController(`${this.coveyTownID}_2`));
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

  // TODO
  claimSpace(spaceID: string, hostID: string): boolean {
    const maybeSpace = this._spaces.find((space) => space.coveySpaceID === spaceID);
    const host = this.getPlayerFromID(hostID);

    if (host === undefined) {
      return false;
    }

    if (maybeSpace !== undefined && maybeSpace.claimSpace(host)) {
      this._listeners.forEach(listener => listener.onSpaceUpdate(maybeSpace.getSpaceInfo()));
      return true;
    }

    return false;
  }

  /**
   * List all spaces
   */
  listSpaces(): CoveySpaceInfo[] {
    const spacesList = this._spaces.map((spaceController) => spaceController.getSpaceInfo());
    return spacesList;
  }

  /**
   * Get the space controller for the given spaceID
   */
  getSpace(spaceID: string): CoveySpaceController | undefined {
    const space = this._spaces.find(p => p.coveySpaceID === spaceID);
    return space;
  }

  /**
   * Gets space where the given player is in
   */
  getSpaceForPlayer(playerID: string): CoveySpaceInfo {
    const spaceForPlayer = this._spaces.find((space) => space.isPlayerInSpace(playerID));

    if (spaceForPlayer !== undefined) {
      return spaceForPlayer.getSpaceInfo();
    }
    
    return {
      coveySpaceID: 'World',
      currentPlayers: [],
      whitelist: [],
      hostID: null,
      presenterID: null,
    };
  }
  
  /**
   * Updates a private space based on the host's request
   * @param coveySpaceId the ID number for a covey space
   * @param playerID the ID for the player who sent the request
   * @param spaceHost the desired host of a space that may or maynot be updated
   * @param spacePresenterID the ID for the player who is the presenter
   * @param whitelist the desired whitelist of a space that may or maynot be updated
   */
  updateSpace(coveySpaceID: string, spacePresenterID?: string | null, whitelist?: string[]): boolean {
    const spaceToUpdate = this.getSpace(coveySpaceID);

    if (spaceToUpdate !== undefined && spaceToUpdate.host !== null) {
      // if a whitelist was provided
      if (whitelist !== undefined) {
        const playerWhiteList = whitelist.map(playerID => this.getPlayerFromID(playerID));
        spaceToUpdate.updateWhitelist(playerWhiteList);
      }

      // if a presenter was provided
      if (spacePresenterID !== undefined) {
        let presenter;

        if (spacePresenterID !== null) {
          presenter = this.getPlayerFromID(spacePresenterID);
        } else {
          presenter = null;
        }

        spaceToUpdate.updatePresenter(presenter);
      }

      this._listeners.forEach(listener => listener.onSpaceUpdate(spaceToUpdate.getSpaceInfo()));
      return true;
    }

    return false;
  }

  /**
  * Removes all players from the space in means to disband the space (returns back to original state)
  * @param spaceID the spaceID for the space they would like to leave
  * @returns success as a boolean
  */
  unclaimSpace(spaceID: string, playerID: string): boolean {
    const spaceController = this.getSpace(spaceID);

    if (spaceController !== undefined && spaceController.host?.id === playerID) {
      spaceController.unclaimSpace();
      return true;
    }
    return false;
  }

  getPlayerFromID(playerID: string): Player {
    const playerFromID = this._players.find((player) => player.id === playerID);

    if (playerFromID === undefined) {
      throw new Error('Player not found.');
    }
    return playerFromID;
  }

  /**
   * Add a player to a given space
   * @param playerID the ID of the player to add
   * @param spaceID the ID of the space to add
   */
  addPlayerToSpace(playerID: string, spaceID: string): boolean {
    const playerFromID = this.getPlayerFromID(playerID);
    const spaceToAddPlayerTo = this._spaces.find((space) => space.coveySpaceID === spaceID);

    if (playerFromID !== undefined && spaceToAddPlayerTo !== undefined) {
      return spaceToAddPlayerTo.addPlayer(playerFromID);
    }

    return false;
  }

  removePlayerFromSpace(playerID: string, spaceID: string): void {
    const playerFromID = this.getPlayerFromID(playerID);
    const spaceToRemovePlayerFrom = this._spaces.find((space) => space.coveySpaceID === spaceID);

    if (playerFromID !== undefined && spaceToRemovePlayerFrom !== undefined) {
      spaceToRemovePlayerFrom.removePlayer(playerFromID);
    }
  }
}