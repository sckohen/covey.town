import { response } from 'express';
import { CoveySpaceInfo } from '../CoveyTypes';
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
    return this._spaces.find(space => space.coveySpaceID === coveySpaceID); 

  }

  /**
   * List all spaces
   */
  listSpaces(): CoveySpaceInfo[] {
    return this._spaces.map(spaceController => ({
      coveySpaceID: spaceController.coveySpaceID, 
      currentPlayers: spaceController.players.map(player => player.id),
      whitelist: spaceController.whitelist.map(player => player.id),
      hostID: spaceController.spaceHostID,
      presenterID: spaceController.presenterID,
    }));
  }

  /**
   * Gets space where the given player is in
   */
   getSpaceForPlayer(playerID: string): CoveySpaceInfo {
    const spaceForPlayer = this._spaces.find((space) => space.isPlayerInSpace(playerID));

    if (spaceForPlayer !== undefined) {
      return {
        coveySpaceID: spaceForPlayer.coveySpaceID,
        currentPlayers: spaceForPlayer.players.map(player => player.id),
        whitelist: spaceForPlayer.whitelist.map(player => player.id),
        hostID: spaceForPlayer.spaceHostID,
        presenterID: spaceForPlayer.presenterID,
      }
    }
    return {
      coveySpaceID: 'World',
      currentPlayers: [],
      whitelist: [],
      hostID: null,
      presenterID: null,
    }
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

    // The uniqueID for the space is combination of townControllerID and the spaceID
    const uniqueID = `${townControllerID}_${newSpaceID}`;

    const newSpace = new CoveySpaceController(uniqueID, townController);
    this._spaces.push(newSpace);
    return newSpace;
  }

  /**
   * Updates a private space based on the host's request
   * @param coveySpaceId the ID number for a covey space
   * @param playerID the ID for the player who sent the request
   * @param spaceHost the desired host of a space that may or maynot be updated
   * @param spacePresenterID the ID for the player who is the presenter
   * @param whitelist the desired whitelist of a space that may or maynot be updated
   */
  updateSpace(coveySpaceID: string, playerID: string, spaceHostID?: string | null, spacePresenterID?: string | null, whitelist?: string[]): boolean {
    const hostedSpace = this.getControllerForSpace(coveySpaceID);
    console.log(`updateSpace is called in SpaceStore: ${coveySpaceID}, ${spaceHostID}, ${spacePresenterID}, ${whitelist}`);
    if (hostedSpace !== undefined){
      if (hostedSpace.spaceHostID === null || playerID === hostedSpace.spaceHostID){
        if (spaceHostID !== undefined) {
          console.log('Updated spaceHostID');
          hostedSpace.updateSpaceHost(spaceHostID);
        }
        if (whitelist !== undefined) {
          console.log('Updated whitelist');
          hostedSpace.updateWhitelist(whitelist);
        }
        if (spacePresenterID !== undefined) {
          console.log('Updated presenterID');
          hostedSpace.updatePresenter(spacePresenterID);
        }
        return true;
      }
    }
    return false;
  }
  
  /**
  * Removes all players from the space in means to disband the space (returns back to original state)
  * @param spaceID the spaceID for the space they would like to leave
  * @returns success as a boolean
  */
  disbandSpace(spaceID: string, playerID: string): boolean {
    const spaceController = this.getControllerForSpace(spaceID);

    if (spaceController !== undefined && spaceController.spaceHostID === playerID) {
      spaceController.publicizeSpace();
      return true;
    }
    return false;
  }

}
