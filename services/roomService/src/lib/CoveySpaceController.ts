import CoveySpaceListener from '../types/CoveySpaceListener';
import Player from '../types/Player';
import CoveyTownController from './CoveyTownController';

/**
 * The CoveyTownController implements the logic for each town: managing the various events that
 * can occur (e.g. joining a town, moving, leaving a town)
 */
export default class CoveySpaceController {
  get spaceHostID(): string | undefined {
    return this._spaceHostID;
  }

  get presenterID(): string | undefined {
    return this._presenterID;
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


  /** The covey town controller of this covey space controller   */
  private _coveyTownController: CoveyTownController;

  /** The list of players currently in the space * */
  private _players: Player[] = [];

  /** The list of CoveyTownListeners that are subscribed to events in this town * */
  private _listeners: CoveySpaceListener[] = [];

  /** The ID given to this space (based on it's declaration on the map) * */
  private readonly _coveySpaceID: string;

  /** The id for the player who is the designated host for this space * */
  private _spaceHostID: string | undefined;

  /** The id for the player who is the designated by the host to be the presenter * */
  private _presenterID: string | undefined;

  /** The list of players that are allowed to join this private space * */
  private _whiteList: Player[] = [];

  /** Whether the space is private or not (starts as not private) */
  private _isPrivate = false;

  constructor(coveySpaceID: string, townController: CoveyTownController) {
    this._coveySpaceID = coveySpaceID;
    this._coveyTownController = townController;
    this._spaceHostID = undefined; // start off as no player until first player enters space
    this._presenterID = undefined; // start off as no player until host chooses the presenter
  }

  
  /**
   * Finds and returns the player object from the ID
   * @param playerID the ID for the player wanted
   * @returns player object with the given ID
   */
  playerFromID(playerID: string): Player | undefined {
    const player = this._coveyTownController.players.find(p => p.id === playerID);

    return player;
  }

  /**
   * Adds a player to this space
   *
   * @param newPlayerID ID for the new player to add to the space
   */
  addPlayer(newPlayerID: string): void {
    const newPlayer = this.playerFromID(newPlayerID);

    if (newPlayer !== undefined) {
      if (this._players.includes(newPlayer)) {
        return;
      }
      if (this._isPrivate === false) {
        this._players.push(newPlayer);
      } else if (this._whiteList.includes(newPlayer)) {
        this._players.push(newPlayer);
      } 
    }
  }

  /**
   * Remove the player specified from the space
   *
   * @param playerID ID of the player to be removed from the space
   */
  removePlayer(playerID: string): void {
    const player = this.playerFromID(playerID);

    if (player !== undefined) {
      this._players = this._players.filter((p) => p.id !== player.id);
      this._listeners.forEach((listener) => listener.onPlayerWalkedOut(player));
    }
  }

  /**
   * Adds a player to the whitelist (list of players allowed to join the private space)
   *
   * @param newPlayer The new player to be add to the whitelist
   */
  addPlayerToWhiteList(newPlayerID: string): Player[] {
    const newPlayer = this.playerFromID(newPlayerID);

    if (newPlayer !== undefined) {
      // If the whitespace already includes the newPlayer, don't add the player, else add the player
      if (this._whiteList.includes(newPlayer)){
        return this._whiteList;
      } 
      this._whiteList.push(newPlayer);
      return this._whiteList;
    }
    return this._whiteList;
  }

  /**
   * Removes a player from the whitelist (list of players allowed to join the private space)
   *
   * @param playerID IF of the player to be removed from the whitelist
   */
  removePlayerFromWhiteList(playerID: string): void {
    const player = this.playerFromID(playerID);

    if (player !== undefined) {
      this._whiteList = this._whiteList.filter((p) => p.id !== player.id);
    }
  }

  /**
    * Changes the host for this space
    * @param newHost ID of the player that is the new host
    */
  updateSpaceHost(newHostID: string | undefined): void {
    // Updates the spacehost
    this._spaceHostID = newHostID;

    // If the new host is not undefined space is set to private, else it is not private
    if (newHostID !== undefined) {
      this._isPrivate = true;
    } else {
      this._isPrivate = false;
    }
  }
  
  /**
      * Changes the presenter for this space
      * @param newPresenter the player that is the new presenter
      */
  updatePresenter(newPresenter: string | undefined): void {
    this._presenterID = newPresenter;
  }

  /**
   * Changes the whitelist to the desired list given by the host
   * @param newWhitelist the list of players that are allowed to enter a given space
   */
  updateWhitelist(newWhitelist: Player[]): void {
    this._whiteList = newWhitelist;
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
