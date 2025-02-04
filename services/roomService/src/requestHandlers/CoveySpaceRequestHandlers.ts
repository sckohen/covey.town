import { CoveySpaceInfo } from '../CoveyTypes';
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
  /** The id for the player sending the request* */
  playerID: string;
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
  hostID: null;
}

/**
 * Payload sent by the client to update a space.
 */
export interface SpaceUpdateRequest {
  coveySpaceID: string;
  playerID: string;
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
  // checks if there is no coveySpaceId provided
  if (coveySpaceID.length === 0) {
    return {
      isOK: false,
      message: 'Space ID must be specified',
    };
  }
  // creates the private space and sends message saying the new space was created
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
  // if we cant get the controller for a specific space send an error that the space doesnt exist
  if (!coveySpaceController) {
    return {
      isOK: false,
      message: 'Error: No such space',
      response: {},
    };
  }  
  // if there is said space successfully add a player to it
  const success = coveySpaceController.addPlayer(playerID);
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
  const spacesStore = CoveySpacesStore.getInstance();
  const { playerID, coveySpaceID } = requestData;
  const coveySpaceController = spacesStore.getControllerForSpace(coveySpaceID);
  // if we cant get the controller for a specific space send an error that the space doesnt exist
  if (!coveySpaceController) {
    return {
      isOK: false,
      message: 'Error: No such space',
    };
  }
  // if there is said space successfully remove a player from it
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
  // responds with a list of all the spaces
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

  const spaceResponse = spacesStore.getSpaceForPlayer(requestData.playerID);

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
  // if we cant get the controller for a specific space send an error that the space doesnt exist
  const coveySpaceController = spacesStore.getControllerForSpace(requestData.coveySpaceID);
  if (!coveySpaceController) {
    return {
      isOK: false,
      message: 'Error: No such space',
      response: {},
    };
  }
  // if there is said space successfully update the host of the space
  const success = coveySpaceController.updateSpaceHost(requestData.hostID);
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
  const spacesStore = CoveySpacesStore.getInstance();
  const { coveySpaceID, playerID, hostID, presenterID, whitelist } = requestData;
  let success = false;
  // if statement determines what parts of the space need to be updated if the space does not have empty default settings
  if (hostID === null) {
    spacesStore.disbandSpace(coveySpaceID, playerID);
    success = true;
  } else if (whitelist === undefined && presenterID === undefined) { // when claim space is called
    success = spacesStore.updateSpace(
      coveySpaceID,
      playerID, 
      hostID, 
      null, 
      [hostID],
    );
  } else {
    success = spacesStore.updateSpace(
      coveySpaceID,
      playerID, 
      hostID,
      presenterID, 
      whitelist,
    );
  }

  return {
    isOK: success,
    response: {},
    message: success? 'Could not update space.' : undefined,
    
  };
}
