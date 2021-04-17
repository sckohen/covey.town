import { CoveySpaceInfo } from '../CoveyTypes';
import Player from '../types/Player';

/**
 * The CoveySpaceController implements  the logic for each space: managing the various events that
 * can occur (e.g. joining a space, moving, leaving a space, becoming host etc.)
 */
export default class CoveySpaceController {
  get host(): Player | null {
    return this._host;
  }

  // gets the current presenter
  get presenter(): Player | null {
    return this._presenter;
  }

  // gets the current players in a space
  get players(): Player[] {
    return this._players;
  }

  // gets the ID of the current space
  get coveySpaceID(): string {
    return this._coveySpaceID;
  }

  // gets the list of players that are allowed to enter the private space (whitelist)
  get whitelist(): Player[] {
    return this._whitelist;
  }

  /** The list of players currently in the space * */
  private _players: Player[];

  /** The ID given to this space (based on it's declaration on the map) * */
  private readonly _coveySpaceID: string;

  /** The id for the player who is the designated host for this space * */
  private _host: Player | null;

  /** The id for the player who is the designated by the host to be the presenter * */
  private _presenter: Player | null;

  /** The list of players that are allowed to join this private space * */
  private _whitelist: Player[];

  constructor(coveySpaceID: string) {
    this._coveySpaceID = coveySpaceID;
    this._host = null; // start off as no player until first player enters space
    this._presenter = null; // start off as no player until host chooses the presenter
    this._players = [];
    this._whitelist = [];
  }

  /**
   * Adds a player to this space
   *
   * @param newPlayerID ID for the new player to add to the space
   * @returns boolean for success or failure
   */
  addPlayer(playerToAdd: Player): boolean {
    // if the player is in the whitelist
    if (this._whitelist.includes(playerToAdd)) {
      this.addPlayerToPlayerList(playerToAdd);
      return true;
    }

    // there is no whitelist
    if (this._whitelist.length === 0) {
      this.addPlayerToPlayerList(playerToAdd);
      return true;
    }

    return false;
  }

  /**
   * Remove the player specified from the space
   *
   * @param playerID ID of the player to be removed from the space
   */
  removePlayer(playerToRemove: Player): void {
    this._players = this._players.filter(p => p.id !== playerToRemove.id);
  }

  /**
   * Only add a player to the player list if they are not already in there
   *
   * @param player
   */
  private addPlayerToPlayerList(playerToAdd: Player): void {
    if (this._players.indexOf(playerToAdd) === -1) {
      this._players.push(playerToAdd);
    }
  }

  claimSpace(newHost: Player): boolean {
    if (this._host !== undefined) {
      this._host = newHost;
      this._whitelist = [newHost];
      return true;
    }

    return false;
  }

  /**
   * Publicize the space (reset everything to how a public space would be)
   */
  unclaimSpace(): void {
    this._host = null; // start off as no player until first player enters space
    this._presenter = null; // start off as no player until host chooses the presenter
    this._whitelist = [];
  }

  /**
   * Changes the presenter for this space
   *
   * @param newPresenter the player that is the new presenter
   */
  updatePresenter(newPresenter: Player | null): void {
    this._presenter = newPresenter;
  }

  /**
   * Changes the whitelist to the desired list given by the host
   *
   * @param newWhitelist the list of players that are allowed to enter a given space
   */
  updateWhitelist(newWhiteList: Player[]): void {
    this._whitelist = newWhiteList;
  }

  /**
   * Gets the space info
   * @returns space info in the type CoveySpaceInfo
   */
  getSpaceInfo(): CoveySpaceInfo {
    const currentPlayers = this._players.map(p => p.id);
    const whitelist = this._whitelist.map(p => p.id);
    let hostID: string | null = null;
    let presenterID: string | null = null;

    if (this._host !== null) {
      hostID = this._host.id;
    }

    if (this._presenter !== null) {
      presenterID = this._presenter.id;
    }

    return {
      coveySpaceID: this._coveySpaceID,
      currentPlayers,
      whitelist,
      hostID,
      presenterID,
    };
  }

  /**
   * Is the given player in the space.
   * @param playerID the ID of the player to check
   */
  isPlayerInSpace(playerID: string): boolean {
    const maybePlayers = this._players.filter((player) => player.id === playerID);
    return maybePlayers.length > 0;
  }
}