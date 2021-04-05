import Player from '../types/Player';
import { CoveySpaceList } from '../CoveyTypes';
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
  newHostPlayerID: string;
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
  spaces: CoveySpaceList;
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
  newHost: Player;
  newPresenter: Player;
  newWhitelist: Player[];
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
 * A handler to process the frontend's request to create a private space. 
 * @param requestData an object representing the frontend's request
 */

// john
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

// john
export async function spaceJoinHandler(requestData: SpaceJoinRequest): Promise<ResponseEnvelope<Record<string, null>>> {
  const spacesStore = CoveySpacesStore.getInstance();
  const { playerID, coveySpaceID } = requestData;
  const coveySpaceController = spacesStore.getControllerForSpace(coveySpaceID);
  
  if (!coveySpaceController) {
    return {
      isOK: false,
      message: 'Error: No such space',
      response: {}
    };
  }  
  
  coveySpaceController.addPlayer(playerID);
  
  return {
    isOK: true,
    message: `Player ID${playerID} has joined space ${coveySpaceID}`,
    response: {}
  };
}

// john
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
    response: {}
  };
}

// john
export async function spaceListHandler(): Promise<ResponseEnvelope<SpaceListResponse>> {
  const spacesStore = CoveySpacesStore.getInstance();

  return {
    isOK: true,
    response: { 
      spaces: spacesStore.getSpaces(), 
    },
  };
}

// john
export async function spaceClaimHandler(requestData: SpaceClaimRequest): Promise<ResponseEnvelope<Record<string, null>>> {
  const spacesStore = CoveySpacesStore.getInstance();

  const coveySpaceController = spacesStore.getControllerForSpace(requestData.coveySpaceID);
  if (!coveySpaceController) {
    return {
      isOK: false,
      message: 'Error: No such space',
      response: {}
    };
  }

  coveySpaceController.updateSpaceHost(requestData.newHostPlayerID);
  return {
    isOK: true,
    message: `The host was update to be player with ID ${requestData.newHostPlayerID} and the space is now private`,
    response: {}
  };
}

// Curtis
export async function spaceDisbandHandler(requestData: SpaceDisbandRequest): Promise<ResponseEnvelope<Record<string, null>>> {
  const spacesStore = CoveySpacesStore.getInstance();

  spacesStore.disbandSpace(requestData.coveySpaceID);

  return {
    isOK: true,
    message: `The space ${requestData.coveySpaceID} was disbanded.`,
    response: {}
  };
}

// anne
export async function spaceUpdateHandler(requestData: SpaceUpdateRequest): Promise<ResponseEnvelope<Record<string, null>>> {
  const spacesStore = CoveySpacesStore.getInstance();

  spacesStore.updateSpace(
    requestData.coveySpaceID, 
    requestData.newHost, 
    requestData.newPresenter, 
    requestData.newWhitelist);

  return {
    isOK: true,
    response: {},
    message: `The space ${requestData.coveySpaceID} was updated.`,
  };
}
