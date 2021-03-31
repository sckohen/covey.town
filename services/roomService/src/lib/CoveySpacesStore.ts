import { CoveySpaceList } from '../CoveyTypes';
import Player from '../types/Player';
import CoveySpaceController  from './CoveySpaceController';


export default class CoveySpacesStore {
  private static _instance: CoveySpacesStore;

  private _spaces: CoveySpaceController[] = [];

  static getInstance(): CoveySpacesStore {
    if (CoveySpacesStore._instance === undefined) {
      CoveySpacesStore._instance = new CoveySpacesStore();
    }
    return CoveySpacesStore._instance;
  }

  /**
  * gets a specific private space controller from a given covey space ID
  * @param coveySpaceID The ID number for a covey space
  */
  getControllerForSpace(coveySpaceID: string): CoveySpaceController | undefined {
      return this._spaces.find(space => space.coveySpaceID == coveySpaceID); 

    }

  /**
   * Gets the list of all private spaces
   * TODO: revisit what should be returned in the CoveySpaceList
   */
   getSpaces(): CoveySpaceList {
    return this._spaces.map(spaceController => ({
      coveySpaceID: spaceController.coveySpaceID, 
      currentPlayers: spaceController.players}));
  }


  /**
   * Creates a new space
   * @param newSpaceID the ID for the new space
   * @returns the space with the given ID
   */
  createSpace(newSpaceID: string): CoveySpaceController {
    const newSpace = new CoveySpaceController(newSpaceID);
    this._spaces.push(newSpace);
    return newSpace;
  }

  /**
   * Updates a private space based on the host's request
   * @param coveySpaceId the ID number for a covey space
   * @param spaceHost the desired host of a space that may or maynot be updated
   * @param whitelist the desired whitelist of a space that may or maynot be updated
   */
  updateSpace(coveySpaceID: string, spaceHost: Player, spacePresenter: Player, whitelist: Player[]): void {
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
  * Removes all players from the space in means to disband the space (returns back to original state)
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
