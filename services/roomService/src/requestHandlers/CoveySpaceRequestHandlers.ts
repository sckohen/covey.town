import assert from 'assert';
import { Socket } from 'socket.io';
import Player from '../types/Player';
import { CoveySpaceList, UserLocation } from '../CoveyTypes';
import CoveyTownListener from '../types/CoveyTownListener';
import CoveyTownsStore from '../lib/CoveyTownsStore';

/**
 * Payload sent by client to claim a space within a Town in Covey.Town
 */
 export interface SpaceClaimRequest {
  /** The id for the space that is to be claimed* */
  spaceID: string
  /** The host for the private space* */
  newHost: Player
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
  /** the id for the town in which the space resides * */
  coveyTownID: string;
  /** the player that would like to join * */
  player: Player;
  /** ID of the space that the player would like to join * */
  privateSpaceID: string;
}

/**
 * The format of a response to join a Town in Covey.Town, as returned by the handler to the server
 * middleware
 */
export interface SpaceJoinResponse {
  /** current players in a space */
  currentPlayers: Player[];
  /** the player who is the current host of this space * */
  currentHost: Player | null;
  /** the player who is the current presenter in this space */
  currentPresenter: Player | null;
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
  // not sure if needs to send any payload
}

/**
 * Payload sent by the client to update a space.
 */
export interface SpaceUpdateRequest {
  coveySpaceID: string;
  newHost?: Player[];
  newPresenter?: Player[]
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
 * A handler to process a player's request to join a town. The flow is:
 *  1. Client makes a TownJoinRequest, this handler is executed
 *  2. Client uses the sessionToken returned by this handler to make a subscription to the town,
 *  @see townSubscriptionHandler for the code that handles that request.
 *
 * @param requestData an object representing the player's request
 */
export async function spaceJoinHandler(requestData: SpaceJoinRequest): Promise<ResponseEnvelope<SpaceJoinResponse>> {
  const townsStore = CoveyTownsStore.getInstance();

  if (!coveyTownController) {
    return {
      isOK: false,
      message: 'Error: No such town',
    };
  }
  const newPlayer = new Player(requestData.userName);
  const newSession = await coveyTownController.addPlayer(newPlayer);
  assert(newSession.videoToken);
  return {
    isOK: true,
    response: {
      coveyUserID: newPlayer.id,
      coveySessionToken: newSession.sessionToken,
      providerVideoToken: newSession.videoToken,
      currentPlayers: coveyTownController.players,
      friendlyName: coveyTownController.friendlyName,
      isPubliclyListed: coveyTownController.isPubliclyListed,
    },
  };
}

export async function spaceListHandler(): Promise<ResponseEnvelope<SpaceListResponse>> {
  const townsStore = CoveyTownsStore.getInstance();
  const coveyTownController = townsStore.getControllerForTown(requestData.coveyTownID);
  return {
    isOK: true,
    response: { space: townsStore.getTowns() },
  };
}

export async function spaceClaimHandler(requestData: SpaceCreateRequest): Promise<ResponseEnvelope<SpaceCreateResponse>> {
  const townsStore = CoveyTownsStore.getInstance();
  if (requestData.friendlyName.length === 0) {
    return {
      isOK: false,
      message: 'FriendlyName must be specified',
    };
  }
  const newTown = townsStore.createTown(requestData.friendlyName, requestData.isPubliclyListed);
  return {
    isOK: true,
    response: {
      coveyTownID: newTown.coveyTownID,
      coveyTownPassword: newTown.townUpdatePassword,
    },
  };
}

export async function spaceDeleteHandler(requestData: SpaceDeleteRequest): Promise<ResponseEnvelope<Record<string, null>>> {
  const townsStore = CoveyTownsStore.getInstance();
  const success = townsStore.deleteTown(requestData.coveyTownID, requestData.coveyTownPassword);
  return {
    isOK: success,
    response: {},
    message: !success ? 'Invalid password. Please double check your town update password.' : undefined,
  };
}

export async function spaceUpdateHandler(requestData: SpaceUpdateRequest): Promise<ResponseEnvelope<Record<string, null>>> {
  const townsStore = CoveyTownsStore.getInstance();
  const success = townsStore // call update space here?? .updateTown(requestData.coveySpaceID );
  return {
    isOK: success,
    response: {},
    message: !success ? 'Invalid password or update values specified. Please double check your town update password.' : undefined,
  };

}

/**
 * An adapter between CoveyTownController's event interface (CoveyTownListener)
 * and the low-level network communication protocol
 *
 * @param socket the Socket object that we will use to communicate with the player
 */
function spaceSocketAdapter(socket: Socket): CoveySpaceListener {
  return {
    onPlayerMoved(movedPlayer: Player) {
      socket.emit('playerMoved', movedPlayer);
    },
    onPlayerDisconnected(removedPlayer: Player) {
      socket.emit('playerDisconnect', removedPlayer);
    },
    onPlayerJoined(newPlayer: Player) {
      socket.emit('newPlayer', newPlayer);
    },
    onTownDestroyed() {
      socket.emit('townClosing');
      socket.disconnect(true);
    },
  };
}

/**
 * A handler to process a remote player's subscription to updates for a town
 *
 * @param socket the Socket object that we will use to communicate with the player
 */
export function spaceSubscriptionHandler(socket: Socket): void {
  // Parse the client's session token from the connection
  // For each player, the session token should be the same string returned by joinTownHandler
  const { token, coveyTownID } = socket.handshake.auth as { token: string; coveyTownID: string };

  const spaceController = CoveyTownsStore.getInstance()
    .getControllerForTown(coveyTownID);

  // Retrieve our metadata about this player from the TownController
  const s = spaceController?.getSessionByToken(token);
  if (!s || !spaceController) {
    // No valid session exists for this token, hence this client's connection should be terminated
    socket.disconnect(true);
    return;
  }

  // Create an adapter that will translate events from the CoveyTownController into
  // events that the socket protocol knows about
  const listener = spaceSocketAdapter(socket);
  spaceController.addTownListener(listener);

  // Register an event listener for the client socket: if the client disconnects,
  // clean up our listener adapter, and then let the CoveyTownController know that the
  // player's session is disconnected
  socket.on('disconnect', () => {
    spaceController.removeTownListener(listener);
    spaceController.destroySession(s);
  });

  // Register an event listener for the client socket: if the client updates their
  // location, inform the CoveyTownController
  socket.on('playerMovement', (movementData: UserLocation) => {
    spaceController.updatePlayerLocation(s.player, movementData);
  });
}
