import { CoveySpaceInfo } from '../CoveyTypes';
import CoveyTownsStore from '../lib/CoveyTownsStore';

/**
 * Request to create a covey space
 */
export interface SpaceCreateRequest {
  /** The town that this space belongs to */
  coveyTownID: string;
  /** The id for the space that is to be created* */
  coveySpaceID: string;
}

/**
 * Payload sent by client to claim a space within a Town in Covey.Town
 */
export interface SpaceClaimRequest {
  /** The id for the space that is to be claimed* */
  coveySpaceID: string;
  /** The id for the player sending the request* */
  playerID: string;
}

/**
 * The format of a request to join a space within a Town in Covey.Town, as dispatched by the server middleware
 */
export interface SpaceJoinRequest {
  /** the id for the player that would like to join * */
  playerID: string;
  /** ID of the space that the player would like to join * */
  coveySpaceID: string;
}

/**
 * The format of a request to leave a space within a Town in Covey.Town, as dispatched by the server middleware
 */
export interface SpaceLeaveRequest {
  /** the id for the player that would like to join * */
  playerID: string;
  /** ID of the space that the player would like to join * */
  coveySpaceID: string;
}

/**
 * Response from the server for a space list request
 */
export interface SpaceListResponse {
  // might not need this, may remove or use for added functionality
  spaces: CoveySpaceInfo[];
}

/**
 * Response to the server to get info on a space
 */
export interface SpaceGetForPlayerRequest {
  playerID: string;
}

/**
 * Response from the server for a space request
 */
export interface SpaceInfoResponse {
  space: {
    coveySpaceID: string; 
    currentPlayers?: string[]; 
    whiteList?: string[]; 
    hostID?: string | null; 
    presenterID?: string | null;
  };
}

/**
 * Payload sent by the client to delete a Town
 */
export interface SpaceDisbandRequest {
  coveySpaceID: string;
  playerID: string;
}

/**
 * Payload sent by the client to update a space.
 */
export interface SpaceUpdateRequest {
  coveySpaceID: string;
  playerID: string;
  presenterID: string | null;
  whitelist: string[];
}

/**
 * Envelope that wraps any response from the server
 */
export interface ResponseEnvelope<T> {
  isOK: boolean;
  message?: string;
  response?: T;
}

/**
 * Handler for joining a space
 * @param requestData the playerID for the player and spaceID they want to join
 * @returns success or failure message
 */
export async function spaceJoinHandler(requestData: SpaceJoinRequest): Promise<ResponseEnvelope<Record<string, null>>> {
  const townsStore = CoveyTownsStore.getInstance();
  const { playerID, coveySpaceID } = requestData;
  const townController = townsStore.getControllerForTown(coveySpaceID.split('_')[0]);
  
  // if we cant get the controller for a specific space send an error that the space doesnt exist
  if (!townController) {
    return {
      isOK: false,
      message: 'Error: No such town',
      response: {},
    };
  }  

  // if there is said space successfully add a player to it
  const success = townController.addPlayerToSpace(playerID, coveySpaceID);

  return {
    isOK: success,
    response: {},
    message: !success ? `Player ID${playerID} can't join space` : undefined,
  };
}

/**
 * Handler for leaving a space
 * @param requestData the playerID for the player and which space they want to leave
 * @returns success or failure message
 */
export async function spaceLeaveHandler(requestData: SpaceLeaveRequest): Promise<ResponseEnvelope<Record<string, null>>> {
  const townsStore = CoveyTownsStore.getInstance();
  const { playerID, coveySpaceID } = requestData;
  const townController = townsStore.getControllerForTown(coveySpaceID.split('_')[0]);

  // if we cant get the controller for a specific space send an error that the space doesnt exist
  if (!townController) {
    return {
      isOK: false,
      message: 'Error: No such town',
    };
  }
  // if there is said space successfully remove a player from it
  townController.removePlayerFromSpace(playerID, coveySpaceID);

  return {
    isOK: true,
    message: `Player ID${playerID} has left space ${coveySpaceID}`,
    response: {},
  };
}


/**
 * Handler for listing spaces
 * @returns list of all spaces (spaceID, currentPlayers, Whitelist, Host, Presenter)
 */
export async function spaceListHandler(): Promise<ResponseEnvelope<SpaceListResponse>> {
  const townsStore = CoveyTownsStore.getInstance();
  const spacesList = townsStore.listAllSpaces();

  // responds with a list of all the spaces
  return {
    isOK: true,
    response: { 
      spaces: spacesList, 
    },
  };
}

/**
 * Handler for getting a specific space
 * @returns listing of the specific space (spaceID, currentPlayers, Whitelist, Host, Presenter)
 */
export async function spaceGetForPlayerHandler(requestData: SpaceGetForPlayerRequest): Promise<ResponseEnvelope<SpaceInfoResponse>> {
  const townsStore = CoveyTownsStore.getInstance();
  const townController = townsStore.getTownFromPlayerID(requestData.playerID);

  if (!townController) {
    return {
      isOK: false,
      message: 'Error: No such town',
    };
  }

  const spaceResponse = townController.getSpaceForPlayer(requestData.playerID);

  return {
    isOK: true,
    response: { 
      space: spaceResponse,
    },
  };
}

/**
 * Handler for unclaiming a space
 * @param requestData spaceID for the space to be unclaimed and the playerID
 * @returns success or failure message
 */
export async function spaceUnclaimHandler(requestData: SpaceDisbandRequest): Promise<ResponseEnvelope<Record<string, null>>> {
  const townsStore = CoveyTownsStore.getInstance();
  const townController = townsStore.getControllerForTown(requestData.coveySpaceID.split('_')[0]);

  if (!townController) {
    return {
      isOK: false,
      message: 'Error: No such town',
      response: {},
    };
  }
  // if there is said space, successfully update the host of the space
  const success = townController.unclaimSpace(requestData.coveySpaceID, requestData.playerID);
  return {
    isOK: success,
    response: {},
    message: success? 'Could not disband space' : undefined,
  };
}

/**
 * Handler for unclaiming a space
 * @param requestData spaceID for the space to be claimed and the playerID for the new host
 * @returns success or failure message
 */
export async function spaceClaimHandler(requestData: SpaceClaimRequest): Promise<ResponseEnvelope<Record<string, null>>> {
  const townsStore = CoveyTownsStore.getInstance();
  const townController = townsStore.getControllerForTown(requestData.coveySpaceID.split('_')[0]);

  if (!townController) {
    return {
      isOK: false,
      message: 'Error: No such town',
      response: {},
    };
  }
  // if there is said space, successfully update the host of the space
  const success = townController.claimSpace(requestData.coveySpaceID, requestData.playerID);
  return {
    isOK: success,
    response: {},
    message: success? 'Could not claim space' : undefined,
  };
}

/**
 * Handler for updating spaces (also for disbanding private space)
 * @param requestData spaceID to update, playerID of the new host for the space, playerID of the presenter for the space, new whitelist
 * @returns success or failure message
 */
export async function spaceUpdateHandler(requestData: SpaceUpdateRequest): Promise<ResponseEnvelope<Record<string, null>>> {
  const townsStore = CoveyTownsStore.getInstance();
  const { coveySpaceID, playerID, presenterID, whitelist } = requestData;
  const townController = townsStore.getControllerForTown(coveySpaceID.split('_')[0]);
  const spaceToUpdate = townController?.getSpace(coveySpaceID);
  let success = false;

  // TODO playerID to check valid request?
  // if statement determines what parts of the space need to be updated if the space does not have empty default settings
  if (townController !== undefined && playerID === spaceToUpdate?.host?.id) {
    success = townController.updateSpace(coveySpaceID, presenterID, whitelist);
  }

  return {
    isOK: success,
    response: {},
    message: success? 'Could not update space.' : undefined,
  };
}
