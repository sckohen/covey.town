import axios, { AxiosInstance, AxiosResponse } from 'axios';
import assert from 'assert';
import Player from '../types/Player';
import { CoveySpace, UserLocation } from '../CoveyTypes';



export type ServerPlayer = { _id: string, _userName: string, location: UserLocation };

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
 * Response to a SpaceCreateRequest
 */
export interface SpaceCreateResponse {
  // unimplemented
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
* Response from the server for a space claim request
*/
export interface SpaceClaimResponse {
  // might not need to return anything here 
  // we could just send confirmation in the response envelope
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
 * The format of a response to join a Town in Covey.Town, as returned by the handler to the server
 * middleware
 */
export interface SpaceJoinResponse {
  /** current players in a space */
  currentPlayers: Player[];
  /** the id for the player who is the current host of this space * */
  currentHostID: string | undefined;
  /** the id for the player who is the current presenter in this space */
  currentPresenterID: string | undefined;
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

export default class SpacesServiceClient {
  private _axios: AxiosInstance;

  /**
   * Construct a new Towns Service API client. Specify a serviceURL for testing, or otherwise
   * defaults to the URL at the environmental variable REACT_APP_ROOMS_SERVICE_URL
   * @param serviceURL
   */
  constructor(serviceURL?: string) {
    const baseURL = serviceURL || process.env.REACT_APP_TOWNS_SERVICE_URL;
    assert(baseURL);
    this._axios = axios.create({ baseURL });
  }

  /**
   * EXISTING
   * Unwraps the response envelope, If all the data in response is ok then returns the data, otherwise throws a processing request error
   * 
   * @param response 
   * @param ignoreResponse 
   * @returns The response data within the given response envelope
   */
  static unwrapOrThrowError<T>(response: AxiosResponse<ResponseEnvelope<T>>, ignoreResponse = false): T {
    if (response.data.isOK) {
      if (ignoreResponse) {
        return {} as T;
      }
      assert(response.data.response);
      return response.data.response;
    }
    throw new Error(`Error processing request: ${response.data.message}`);
  }

  /**
   * Takes the coveyTownId and coveySpaceId from a given SpaceCreateRequest, wraps it and turns it into a Space create response promise
   * 
   * @param requestData 
   * @returns A SpaceCreateResponse promise made from the wrapped request data that was given
   */
  async createSpace(requestData: SpaceCreateRequest): Promise<SpaceCreateResponse> {
    const { coveyTownID, coveySpaceID } = requestData;
    const responseWrapper = await this._axios.post<ResponseEnvelope<SpaceCreateResponse>>(`/spaces/${coveyTownID}/${coveySpaceID}`, requestData);
    return SpacesServiceClient.unwrapOrThrowError(responseWrapper);
  }

  /**
   * Takes the coveySpaceId from a given SpaceUpdateRequest, wraps it and turns it into a void promise to update the space
   * 
   * @param requestData 
   * @returns A SpaceCreateResponse promise made from the wrapped request data that was given
   */
  async updateSpace(requestData: SpaceUpdateRequest): Promise<void> {
    const { coveySpaceID } = requestData;
    const responseWrapper = await this._axios.patch<ResponseEnvelope<void>>(`/spaces/${coveySpaceID}`, requestData);
    return SpacesServiceClient.unwrapOrThrowError(responseWrapper, true);
  }

  /**
   * Takes the coveySpaceId from a given SpaceDisbandRequest, wraps it and turns it into a void promise to delete the space
   * 
   * @param requestData 
   * @returns A SpaceCreateResponse promise made from the wrapped request data that was given
   */
  async deleteSpace(requestData: SpaceDisbandRequest): Promise<void> {
    const { coveySpaceID } = requestData;
    const responseWrapper = await this._axios.delete<ResponseEnvelope<void>>(`/spaces/${coveySpaceID}`);
    return SpacesServiceClient.unwrapOrThrowError(responseWrapper, true);
  }

  /**
   * gets the response envelope of the space list response and wraps it to create a space list response promise
   * @returns A SpaceListResponse promise 
   */
  async listSpaces(): Promise<SpaceListResponse> {
    const responseWrapper = await this._axios.get<ResponseEnvelope<SpaceListResponse>>('/spaces');
    return SpacesServiceClient.unwrapOrThrowError(responseWrapper);
  }
  
  /**
   * Takes a Space Join Request, wraps the covey space Id and player Id and creates a Space Join Response promise
   * @param requestData 
   * @returns A SpaceJoinResponse promise
   */
  async joinSpace(requestData: SpaceJoinRequest): Promise<SpaceJoinResponse> {
    const { coveySpaceID, playerID } = requestData;
    const responseWrapper = await this._axios.post(`/spaces/${coveySpaceID}/${playerID}`, requestData);
    return SpacesServiceClient.unwrapOrThrowError(responseWrapper);
  }

  /**
   * Takes a SpaceClaimRequest, wraps the covey space Id and player Id and creates a void promise to claim the space
   * @param requestData 
   * @returns A void promise to claim the space
   */
  async claimSpace(requestData: SpaceClaimRequest): Promise<void> {
    const { coveySpaceID } = requestData;
    const responseWrapper = await this._axios.patch<ResponseEnvelope<void>>(`/spaces/${coveySpaceID}`, requestData);
    return SpacesServiceClient.unwrapOrThrowError(responseWrapper, true);
  }
}
