
import CoveySpaceListener from '../types/CoveySpaceListener';
import Player from '../types/Player';

/**
 * The CoveyTownController implements the logic for each town: managing the various events that
 * can occur (e.g. joining a town, moving, leaving a town)
 */
export default class CoveySpaceController {
  get capacity(): number {
    return this._capacity;
  }

  get spaceHost(): Player | null {
    return this._spaceHost;
  }

  get presenter(): Player | null {
    return this._presenter;
  }

  get players(): Player[] {
    return this._players;
  }

  get occupancy(): number {
    return this._listeners.length;
  }

  get coveySpaceID(): string {
    return this._coveySpaceID;
  }

  get whiteList(): Player[] {
    return this._whiteList;
  }

  set whiteList(playerList: Player[]) {
    this._whiteList = playerList;
  }

  /** The list of players currently in the space * */
  private _players: Player[] = [];

  /** The list of CoveyTownListeners that are subscribed to events in this town * */
  private _listeners: CoveySpaceListener[] = [];

   /** The ID given to this space (based on it's declaration on the map) * */
  private readonly _coveySpaceID: string;

   /** The player who is the designated host for this space * */
  private _spaceHost: Player | null;

   /** The player who is the designated by the host to be the presenter * */
  private _presenter: Player | null;

  /** The max number of players allowed into a space at a time * */
  private _capacity: number;

  /** The list of players that are allowed to join this private space * */
  private _whiteList: Player[] = [];

  constructor(coveySpaceID: string) {
    this._coveySpaceID = coveySpaceID;
    this._capacity = 50; // not sure if necessary
    this._spaceHost = null; // start off as no player until first player enters space
    this._presenter = null; // start off as no player until host chooses the presenter
  }

  /**
   * Adds a player to this space
   *
   * @param newPlayer The new player to add to the space
   */
  addPlayer(newPlayer: Player): Player[] {
    this._players.push(newPlayer);

    // Notify other players that this player has joined
    this._listeners.forEach((listener) => listener.onPlayerWalkedIn(newPlayer));

    return this._players;
  }

  /**
   * Remove the player specified from the space
   *
   * @param player the player to be removed from the space
   */
  removePlayer(player: Player): void {
    this._players = this._players.filter((p) => p.id !== player.id);
    this._listeners.forEach((listener) => listener.onPlayerWalkedOut(player)); 
  }

  /**
   * Adds a player to the whitelist (list of players allowed to join the private space)
   *
   * @param newPlayer The new player to be add to the whitelist
   */
  addPlayerToWhiteList(newPlayer: Player): Player[] {
    this._whiteList.push(newPlayer);
    
    return this._whiteList;
  }

  /**
   * Removes a player from the whitelist (list of players allowed to join the private space)
   *
   * @param player the player to be removed from the whitelist
   */
  removePlayerFromWhiteList(player: Player): void {
    this._whiteList = this._whiteList.filter((p) => p.id !== player.id);
  }

   /**
    * Changes the host for this space
    * @param newHost the player that is the new host
    */
  updateSpaceHost(newHost: Player | null): void {
    this._spaceHost = newHost;
  }

  /**
    * Changes the presenter for this space
    * @param newPresenter the player that is the new presenter
    */
  updatePresenter(newPresenter: Player | null): void {
    this._presenter = newPresenter;
  }

  /**
   * Subscribe to events from this space. Callers should make sure to
   * unsubscribe when they no longer want those events by calling removeSpaceListener
   *
   * @param listener New listener
   */
  addSpaceListener(listener: CoveySpaceListener): void {
    this._listeners.push(listener);
  }

  /**
   * Unsubscribe from events in this space.
   *
   * @param listener The listener to unsubscribe, must be a listener that was registered
   * with addSpaceListener, or otherwise will be a no-op
   */
  removeSpaceListener(listener: CoveySpaceListener): void {
    this._listeners = this._listeners.filter((v) => v !== listener);
  }

  /**
   * Disconnects all players that are listen
   */
  disconnectAllPlayers(): void {
    this._players = [];
    this._listeners.forEach((listener) => listener.onSpaceDisbanded());
  }
}
