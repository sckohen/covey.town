import Player from '../types/Player';
import { CoveySpace } from '../CoveyTypes';
import CoveySpacesStore from '../lib/CoveySpacesStore';

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
  /** The id for the new host (player) for the private space* */
  hostID: string;
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
  spaces: CoveySpace[];
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
}

/**
 * Payload sent by the client to update a space.
 */
export interface SpaceUpdateRequest {
  coveySpaceID: string;
  hostID: string | null;
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
 * Handler for creating spaces
 * @param requestData the townID and the spaceID for space to create
 * @returns success or failure message
 */
export async function spaceCreateHandler(requestData: SpaceCreateRequest): Promise<ResponseEnvelope<Record<string, null>>> {
  const spacesStore = CoveySpacesStore.getInstance();

  const { coveySpaceID, coveyTownID } = requestData;

  if (coveySpaceID.length === 0) {
    return {
      isOK: false,
      message: 'Space ID must be specified',
    };
  }

  spacesStore.createSpace(coveySpaceID, coveyTownID);
  return {
    isOK: true,
    message: `Private Space ${coveySpaceID} was created`,
  };
}

/**
 * Handler for joining a space
 * @param requestData the playerID for the player and spaceID they want to join
 * @returns success or failure message
 */
export async function spaceJoinHandler(requestData: SpaceJoinRequest): Promise<ResponseEnvelope<Record<string, null>>> {
  const spacesStore = CoveySpacesStore.getInstance();
  const { playerID, coveySpaceID } = requestData;
  const coveySpaceController = spacesStore.getControllerForSpace(coveySpaceID);
  
  if (!coveySpaceController) {
    return {
      isOK: false,
      message: 'Error: No such space',
      response: {},
    };
  }  
  
  coveySpaceController.addPlayer(playerID);
  
  return {
    isOK: true,
    message: `Player ID${playerID} has joined space ${coveySpaceID}`,
    response: {},
  };
}

/**
 * Handler for leaving a space
 * @param requestData the playerID for the player and which space they want to leave
 * @returns success or failure message
 */
export async function spaceLeaveHandler(requestData: SpaceLeaveRequest): Promise<ResponseEnvelope<Record<string, null>>> {
  const spacesStore = CoveySpacesStore.getInstance();
  const { playerID, coveySpaceID } = requestData;
  const coveySpaceController = spacesStore.getControllerForSpace(coveySpaceID);

  if (!coveySpaceController) {
    return {
      isOK: false,
      message: 'Error: No such space',
    };
  }

  coveySpaceController.removePlayer(playerID);

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
  const spacesStore = CoveySpacesStore.getInstance();

  return {
    isOK: true,
    response: { 
      spaces: spacesStore.listSpaces(), 
    },
  };
}

/**
 * Handler for getting a specific space
 * @returns listing of the specific space (spaceID, currentPlayers, Whitelist, Host, Presenter)
 */
 export async function spaceGetForPlayerHandler(requestData: SpaceGetForPlayerRequest): Promise<ResponseEnvelope<SpaceInfoResponse>> {
  const spacesStore = CoveySpacesStore.getInstance();

   let spaceResponse = spacesStore.getSpaceForPlayer(requestData.playerID)

   if (spaceResponse === undefined) {
     return {
       isOK: true,
       response: {
         space: { 
           coveySpaceID: "World"
        },
       },
     };
   }

  return {
    isOK: true,
    response: { 
      space: spaceResponse,
    },
  };
}

/**
 * Handler for claiming a space
 * @param requestData spaceID for the space to be claimed and the playerID for the new host
 * @returns success or failure message
 */
export async function spaceClaimHandler(requestData: SpaceClaimRequest): Promise<ResponseEnvelope<Record<string, null>>> {
  const spacesStore = CoveySpacesStore.getInstance();

  const coveySpaceController = spacesStore.getControllerForSpace(requestData.coveySpaceID);
  if (!coveySpaceController) {
    return {
      isOK: false,
      message: 'Error: No such space',
      response: {},
    };
  }

  coveySpaceController.updateSpaceHost(requestData.hostID);
  return {
    isOK: true,
    message: `The host was update to be player with ID ${requestData.hostID} and the space is now private`,
    response: {},
  };
}

/**
 * Handler for updating spaces (also for disbanding private space)
 * @param requestData spaceID to update, playerID of the new host for the space, playerID of the presenter for the space, new whitelist
 * @returns success or failure message
 */
export async function spaceUpdateHandler(requestData: SpaceUpdateRequest): Promise<ResponseEnvelope<Record<string, null>>> {
  const spacesStore = CoveySpacesStore.getInstance();
  const { coveySpaceID, hostID, presenterID, whitelist } = requestData;

  if (hostID === null) {
    spacesStore.disbandSpace(coveySpaceID);
  }

  spacesStore.updateSpace(
    coveySpaceID, 
    hostID, 
    presenterID, 
    whitelist);

  return {
    isOK: true,
    message: `The space ${requestData.coveySpaceID} was updated.`,
    response: {},
  };
}
