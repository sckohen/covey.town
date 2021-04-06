import axios, { AxiosInstance, AxiosResponse } from 'axios';
import assert from 'assert';
import { ServerPlayer } from './Player';

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
 * The format of a response to join a Town in Covey.Town, as returned by the handler to the server
 * middleware
 */
export interface SpaceJoinResponse {
  /** current players in a space */
  currentPlayers: ServerPlayer[];
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
  spaces: CoveySpaceInfo;
}

/**
 * Payload sent by the client to delete a Town
 */
export interface SpaceDisbandRequest {
  coveySpaceID: string;
  newHost: undefined;
}

/**
 * Payload sent by the client to update a space.
 */
export interface SpaceUpdateRequest {
  coveySpaceID: string;
  newHost: ServerPlayer;
  newPresenter: ServerPlayer;
  newWhitelist: ServerPlayer[];
}

/**
 * Envelope that wraps any response from the server
 */
export interface ResponseEnvelope<T> {
  isOK: boolean;
  message?: string;
  response?: T;
}

export type CoveySpaceInfo = {
  coveySpaceID: string; 
  currentPlayers: ServerPlayer[]; 
  whiteList: ServerPlayer[]; 
  hostID: string | undefined; 
  presenterID: string | undefined[];
};

export default class SpacesServiceClient {
  private _axios: AxiosInstance;

  /**
   * Construct a new Spaces Service API client. Specify a serviceURL for testing, or otherwise
   * defaults to the URL at the environmental variable REACT_APP_ROOMS_SERVICE_URL
   * @param serviceURL
   */
  constructor(serviceURL?: string) {
    const baseURL = serviceURL || process.env.REACT_APP_TOWNS_SERVICE_URL;
    assert(baseURL);
    this._axios = axios.create({ baseURL });
  }

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

  async createSpace(requestData: SpaceCreateRequest): Promise<void> {
    const { coveyTownID, coveySpaceID } = requestData;
    const responseWrapper = await this._axios.post<ResponseEnvelope<void>>(`/spaces/${coveyTownID}/${coveySpaceID}`, requestData);
    return SpacesServiceClient.unwrapOrThrowError(responseWrapper);
  }

  async updateSpace(requestData: SpaceUpdateRequest): Promise<void> {
    const { coveySpaceID } = requestData;
    const responseWrapper = await this._axios.patch<ResponseEnvelope<void>>(`/spaces/${coveySpaceID}`, requestData);
    return SpacesServiceClient.unwrapOrThrowError(responseWrapper, true);
  }

  async deleteSpace(requestData: SpaceDisbandRequest): Promise<void> {
    const { coveySpaceID } = requestData;
    const responseWrapper = await this._axios.delete<ResponseEnvelope<void>>(`/spaces/${coveySpaceID}`);
    return SpacesServiceClient.unwrapOrThrowError(responseWrapper, true);
  }

  async listSpaces(): Promise<SpaceListResponse> {
    const responseWrapper = await this._axios.get<ResponseEnvelope<SpaceListResponse>>('/spaces');
    return SpacesServiceClient.unwrapOrThrowError(responseWrapper);
  }

  async joinSpace(requestData: SpaceJoinRequest): Promise<void> {
    const { coveySpaceID, playerID } = requestData;
    const responseWrapper = await this._axios.put(`/spaces/${coveySpaceID}/${playerID}`);
    return SpacesServiceClient.unwrapOrThrowError(responseWrapper);
  }

  async leaveSpace(requestData: SpaceLeaveRequest): Promise<void> {
    const { coveySpaceID, playerID } = requestData;
    const responseWrapper = await this._axios.delete(`/spaces/${coveySpaceID}/${playerID}`);
    return SpacesServiceClient.unwrapOrThrowError(responseWrapper);
  }

  async claimSpace(requestData: SpaceClaimRequest): Promise<void> {
    const { coveySpaceID } = requestData;
    const responseWrapper = await this._axios.patch<ResponseEnvelope<void>>(`/spaces/${coveySpaceID}`, requestData);
    return SpacesServiceClient.unwrapOrThrowError(responseWrapper, true);
  }

  async disbandSpace(requestData: SpaceDisbandRequest): Promise<void> {
    const { coveySpaceID } = requestData;
    const responseWrapper = await this._axios.patch<ResponseEnvelope<void>>(`/spaces/${coveySpaceID}`, requestData);
    return SpacesServiceClient.unwrapOrThrowError(responseWrapper, true);
  } 
}
