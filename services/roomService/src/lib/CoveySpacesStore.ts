import { CoveySpaceList } from '../CoveyTypes';
import Player from '../types/Player';
import CoveySpaceController  from './CoveySpaceController';
import CoveyTownsStore from './CoveyTownsStore';


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
   * @param townController ID for the town this space belongs to
   * @returns the space with the given ID
   */
  createSpace(newSpaceID: string, townControllerID: string): CoveySpaceController {
    const townsStore = CoveyTownsStore.getInstance();
    const townController = townsStore.getControllerForTown(townControllerID);

    if (townController === undefined) {
      throw new Error('Town not found.');
    }

    const newSpace = new CoveySpaceController(newSpaceID, townController);
    this._spaces.push(newSpace);
    return newSpace;
  }

  /**
   * Updates a private space based on the host's request
   * @param coveySpaceId the ID number for a covey space
   * @param spaceHost the desired host of a space that may or maynot be updated
   * @param whitelist the desired whitelist of a space that may or maynot be updated
   */
  updateSpace(coveySpaceID: string, spaceHost?: Player, spacePresenter?: Player, whitelist?: Player[]): void {
    const hostedSpace = this.getControllerForSpace(coveySpaceID);
    if (hostedSpace){
      if (spaceHost !== undefined) {
        hostedSpace.updateSpaceHost(spaceHost.id);
      }
      if (spacePresenter !== undefined) {
        hostedSpace.updatePresenter(spacePresenter.id);
      }
      if (whitelist !== undefined) {
        hostedSpace.updateWhitelist(whitelist);
      }
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
