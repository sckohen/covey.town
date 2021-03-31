import { CoveySpaceList } from '../CoveyTypes';
import Player from '../types/Player';
import CoveySpaceController  from './CoveySpaceController';


export default class CoveySpacesStore {
  private static _instance: CoveySpacesStore;

  get players(): Player[] {
    return this._players;
  }

  get privateSpaces(): CoveySpaceController[] {
    return this._privateSpaces;
  }

  /** The list of players currently in the town * */
  private _players: Player[] = [];

  /** The list of spaces in the town * */
  private _privateSpaces: CoveySpaceController[] = [];

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
