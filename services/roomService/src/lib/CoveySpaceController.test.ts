import {nanoid} from 'nanoid';
import {mock, mockReset} from 'jest-mock-extended';
import {Socket} from 'socket.io';
import TwilioVideo from './TwilioVideo';
import Player from '../types/Player';
import CoveyTownController from './CoveyTownController';
import CoveyTownListener from '../types/CoveyTownListener';
import {UserLocation} from '../CoveyTypes';
import PlayerSession from '../types/PlayerSession';
import {townSubscriptionHandler} from '../requestHandlers/CoveyTownRequestHandlers';
import CoveyTownsStore from './CoveyTownsStore';
import * as TestUtils from '../client/TestUtils';
import CoveySpaceController from './CoveySpaceController';

jest.mock('./TwilioVideo');

const mockGetTokenForTown = jest.fn();
// eslint-disable-next-line
// @ts-ignore it's a mock
TwilioVideo.getInstance = () => ({
  getTokenForTown: mockGetTokenForTown,
});

function generateTestLocation(): UserLocation {
  return {
    rotation: 'back',
    moving: Math.random() < 0.5,
    x: Math.floor(Math.random() * 100),
    y: Math.floor(Math.random() * 100),
  };
}

describe('CoveySpaceController', () => {
  beforeEach(() => {
    mockGetTokenForTown.mockClear();
  });
  it('constructor should set the CoveySpaceID and the CoveyTownController', () => { // Included in handout
    const spaceID = `SpaceIDTest-${nanoid()}`;
    const townName = `FriendlyNameTest-${nanoid()}`;
    const townController = new CoveyTownController(townName, false);
    const spaceController = new CoveySpaceController(spaceID, townController);
    expect(spaceController.coveySpaceID)
    .toBe(spaceID);

  });
});
// tests adding a player to a space
describe('addPlayer', () => { // Included in handout
  it('should check if the player is on the whitelist before added',
    async () => {
      //const townName = `FriendlyNameTest-${nanoid()}`;
      //const townController = new CoveySpaceController(townName, false);
      //const newPlayerSession = await townController.addPlayer(new Player(nanoid()));
      //expect(mockGetTokenForTown).toBeCalledTimes(1);
      //expect(mockGetTokenForTown).toBeCalledWith(townController.coveyTownID, newPlayerSession.player.id);

      const spaceID = `SpaceIDTest-${nanoid()}`;
      const townName = `FriendlyNameTest-${nanoid()}`;
      const townController = new CoveyTownController(townName, false);
      await townController.addPlayer(new Player('1'));
      await townController.addPlayer(new Player('2'));
      const spaceController = new CoveySpaceController(spaceID, townController);
      spaceController.addPlayer('1');
      expect(spaceController.players.length)
      .toBe(1);
      spaceController.addPlayer('2');
      expect(spaceController.players.length)
      .toBe(2);
    });
  });
// tests removing a player from a space
describe('removePlayer', () => { // Included in handout
  it('should check if the player is on the whitelist before removed',
    async () => {
      const spaceID = `SpaceIDTest-${nanoid()}`;
      const townName = `FriendlyNameTest-${nanoid()}`;
      const townController = new CoveyTownController(townName, false);
      await townController.addPlayer(new Player('1'));
      await townController.addPlayer(new Player('2'));
      const spaceController = new CoveySpaceController(spaceID, townController);
      spaceController.addPlayer('1');
      expect(spaceController.players.length)
      .toBe(1);
      spaceController.addPlayer('2');
      expect(spaceController.players.length)
      .toBe(2);
      spaceController.removePlayer('1');
      expect(spaceController.players.length)
      .toBe(1);
      spaceController.removePlayer('2');
      expect(spaceController.players.length)
      .toBe(0);
    });
  });
// tests adding a player to a whitelist
describe('addPlayerToWhitelist', () => { // Included in handout
  it('should check if the player is on the whitelist before added',
    async () => {
      const spaceID = `SpaceIDTest-${nanoid()}`;
      const townName = `FriendlyNameTest-${nanoid()}`;
      const townController = new CoveyTownController(townName, false);
      await townController.addPlayer(new Player('1'));
      await townController.addPlayer(new Player('2'));
      const spaceController = new CoveySpaceController(spaceID, townController);
      spaceController.addPlayerToWhiteList('1');
      expect(spaceController.whitelist.length)
      .toBe(1);
      spaceController.addPlayerToWhiteList('2');
      expect(spaceController.whitelist.length)
      .toBe(2);
    });
  });
// tests removing a player from a whitelist
describe('removePlayerFromWhitelist', () => { // Included in handout
  it('should check if the player is on the whitelist before removed',
    async () => {
      const spaceID = `SpaceIDTest-${nanoid()}`;
      const townName = `FriendlyNameTest-${nanoid()}`;
      const townController = new CoveyTownController(townName, false);
      await townController.addPlayer(new Player('1'));
      await townController.addPlayer(new Player('2'));
      const spaceController = new CoveySpaceController(spaceID, townController);
      spaceController.addPlayerToWhiteList('1');
      expect(spaceController.whitelist.length)
      .toBe(1);
      spaceController.addPlayerToWhiteList('2');
      expect(spaceController.whitelist.length)
      .toBe(2);
      spaceController.removePlayerFromWhiteList('1');
      expect(spaceController.whitelist.length)
      .toBe(1);
      spaceController.removePlayerFromWhiteList('2');
      expect(spaceController.whitelist.length)
      .toBe(0);
    });
  });

  

  // describe('space listeners and events', () => {
  //   let testingSpace: CoveySpaceController;
  //   let testingTown: CoveyTownController;
  //   const mockListeners = [mock<CoveySpaceListener>(),
  //     mock<CoveySpaceListener>(),
  //     mock<CoveySpaceListener>()];
  //   beforeEach(() => {
  //     const spaceName = `space listeners and events tests ${nanoid()}`;
  //     const townName = `town listeners and events tests ${nanoid()}`;
  //     testingTown = new CoveyTownController(townName, false);
  //     testingSpace = new CoveySpaceController(spaceName, testingTown);
  //     mockListeners.forEach(mockReset);
  //   });/*
  //   it('should notify added listeners of player movement when updatePlayerLocation is called', async () => {
  //     const player = new Player('test player');
  //     await testingTown.addPlayer(player);
  //     const newLocation = generateTestLocation();
  //     mockListeners.forEach(listener => testingTown.addTownListener(listener));
  //     testingTown.updatePlayerLocation(player, newLocation);
  //     mockListeners.forEach(listener => expect(listener.onPlayerMoved).toBeCalledWith(player));
  //   });
  //   it('should notify added listeners of player disconnections when destroySession is called', async () => {
  //     const player = new Player('test player');
  //     const session = await testingTown.addPlayer(player);

  //     mockListeners.forEach(listener => testingTown.addTownListener(listener));
  //     testingTown.destroySession(session);
  //     mockListeners.forEach(listener => expect(listener.onPlayerDisconnected).toBeCalledWith(player));
  //   });*/
  //   it('should notify added listeners of new players when addPlayer is called', async () => {
  //     mockListeners.forEach(listener => testingSpace.addSpaceListener(listener));
  //     const player = new Player('test player');
  //     testingTown.addPlayer(new Player('1'));
  //     testingSpace.addPlayer('1');
  //     mockListeners.forEach(listener => expect(listener.onPlayerWalkedIn).toBeCalledWith(player));

  //   });
  //   it('should notify added listeners that the town is destroyed when disconnectAllPlayers is called', async () => {
  //     const player = new Player('test player');
  //     await testingTown.addPlayer(player);

  //     mockListeners.forEach(listener => testingTown.addTownListener(listener));
  //     testingTown.disconnectAllPlayers();
  //     mockListeners.forEach(listener => expect(listener.onTownDestroyed).toBeCalled());

  //   });
  //   it('should not notify removed listeners of player movement when updatePlayerLocation is called', async () => {
  //     const player = new Player('test player');
  //     await testingTown.addPlayer(player);

  //     mockListeners.forEach(listener => testingTown.addTownListener(listener));
  //     const newLocation = generateTestLocation();
  //     const listenerRemoved = mockListeners[1];
  //     testingTown.removeTownListener(listenerRemoved);
  //     testingTown.updatePlayerLocation(player, newLocation);
  //     expect(listenerRemoved.onPlayerMoved).not.toBeCalled();
  //   });
  //   it('should not notify removed listeners of player disconnections when destroySession is called', async () => {
  //     const player = new Player('test player');
  //     const session = await testingTown.addPlayer(player);

  //     mockListeners.forEach(listener => testingTown.addTownListener(listener));
  //     const listenerRemoved = mockListeners[1];
  //     testingTown.removeTownListener(listenerRemoved);
  //     testingTown.destroySession(session);
  //     expect(listenerRemoved.onPlayerDisconnected).not.toBeCalled();

  //   });
  //   it('should not notify removed listeners of new players when addPlayer is called', async () => {
  //     const player = new Player('test player');

  //     mockListeners.forEach(listener => testingTown.addTownListener(listener));
  //     const listenerRemoved = mockListeners[1];
  //     testingTown.removeTownListener(listenerRemoved);
  //     const session = await testingTown.addPlayer(player);
  //     testingTown.destroySession(session);
  //     expect(listenerRemoved.onPlayerJoined).not.toBeCalled();
  //   });

  //   it('should not notify removed listeners that the town is destroyed when disconnectAllPlayers is called', async () => {
  //     const player = new Player('test player');
  //     await testingTown.addPlayer(player);

  //     mockListeners.forEach(listener => testingTown.addTownListener(listener));
  //     const listenerRemoved = mockListeners[1];
  //     testingTown.removeTownListener(listenerRemoved);
  //     testingTown.disconnectAllPlayers();
  //     expect(listenerRemoved.onTownDestroyed).not.toBeCalled();

  //   });
  });
  // describe('townSubscriptionHandler', () => {
  //   const mockSocket = mock<Socket>();
  //   let testingTown: CoveyTownController;
  //   let player: Player;
  //   let session: PlayerSession;
  //   beforeEach(async () => {
  //     const townName = `connectPlayerSocket tests ${nanoid()}`;
  //     testingTown = CoveyTownsStore.getInstance().createTown(townName, false);
  //     mockReset(mockSocket);
  //     player = new Player('test player');
  //     session = await testingTown.addPlayer(player);
  //   });
  //   it('should reject connections with invalid town IDs by calling disconnect', async () => {
  //     TestUtils.setSessionTokenAndTownID(nanoid(), session.sessionToken, mockSocket);
  //     townSubscriptionHandler(mockSocket);
  //     expect(mockSocket.disconnect).toBeCalledWith(true);
  //   });
  //   it('should reject connections with invalid session tokens by calling disconnect', async () => {
  //     TestUtils.setSessionTokenAndTownID(testingTown.coveyTownID, nanoid(), mockSocket);
  //     townSubscriptionHandler(mockSocket);
  //     expect(mockSocket.disconnect).toBeCalledWith(true);
  //   });
  //   describe('with a valid session token', () => {
  //     it('should add a town listener, which should emit "newPlayer" to the socket when a player joins', async () => {
  //       TestUtils.setSessionTokenAndTownID(testingTown.coveyTownID, session.sessionToken, mockSocket);
  //       townSubscriptionHandler(mockSocket);
  //       await testingTown.addPlayer(player);
  //       expect(mockSocket.emit).toBeCalledWith('newPlayer', player);
  //     });
  //     it('should add a town listener, which should emit "playerMoved" to the socket when a player moves', async () => {
  //       TestUtils.setSessionTokenAndTownID(testingTown.coveyTownID, session.sessionToken, mockSocket);
  //       townSubscriptionHandler(mockSocket);
  //       testingTown.updatePlayerLocation(player, generateTestLocation());
  //       expect(mockSocket.emit).toBeCalledWith('playerMoved', player);

  //     });
  //     it('should add a town listener, which should emit "playerDisconnect" to the socket when a player disconnects', async () => {
  //       TestUtils.setSessionTokenAndTownID(testingTown.coveyTownID, session.sessionToken, mockSocket);
  //       townSubscriptionHandler(mockSocket);
  //       testingTown.destroySession(session);
  //       expect(mockSocket.emit).toBeCalledWith('playerDisconnect', player);
  //     });
  //     it('should add a town listener, which should emit "townClosing" to the socket and disconnect it when disconnectAllPlayers is called', async () => {
  //       TestUtils.setSessionTokenAndTownID(testingTown.coveyTownID, session.sessionToken, mockSocket);
  //       townSubscriptionHandler(mockSocket);
  //       testingTown.disconnectAllPlayers();
  //       expect(mockSocket.emit).toBeCalledWith('townClosing');
  //       expect(mockSocket.disconnect).toBeCalledWith(true);
  //     });
  //     describe('when a socket disconnect event is fired', () => {
  //       it('should remove the town listener for that socket, and stop sending events to it', async () => {
  //         TestUtils.setSessionTokenAndTownID(testingTown.coveyTownID, session.sessionToken, mockSocket);
  //         townSubscriptionHandler(mockSocket);

  //         // find the 'disconnect' event handler for the socket, which should have been registered after the socket was connected
  //         const disconnectHandler = mockSocket.on.mock.calls.find(call => call[0] === 'disconnect');
  //         if (disconnectHandler && disconnectHandler[1]) {
  //           disconnectHandler[1]();
  //           const newPlayer = new Player('should not be notified');
  //           await testingTown.addPlayer(newPlayer);
  //           expect(mockSocket.emit).not.toHaveBeenCalledWith('newPlayer', newPlayer);
  //         } else {
  //           fail('No disconnect handler registered');
  //         }
  //       });
  //       it('should destroy the session corresponding to that socket', async () => {
  //         TestUtils.setSessionTokenAndTownID(testingTown.coveyTownID, session.sessionToken, mockSocket);
  //         townSubscriptionHandler(mockSocket);

  //         // find the 'disconnect' event handler for the socket, which should have been registered after the socket was connected
  //         const disconnectHandler = mockSocket.on.mock.calls.find(call => call[0] === 'disconnect');
  //         if (disconnectHandler && disconnectHandler[1]) {
  //           disconnectHandler[1]();
  //           mockReset(mockSocket);
  //           TestUtils.setSessionTokenAndTownID(testingTown.coveyTownID, session.sessionToken, mockSocket);
  //           townSubscriptionHandler(mockSocket);
  //           expect(mockSocket.disconnect).toHaveBeenCalledWith(true);
  //         } else {
  //           fail('No disconnect handler registered');
  //         }

  //       });
  //     });
  //     it('should forward playerMovement events from the socket to subscribed listeners', async () => {
  //       TestUtils.setSessionTokenAndTownID(testingTown.coveyTownID, session.sessionToken, mockSocket);
  //       townSubscriptionHandler(mockSocket);
  //       const mockListener = mock<CoveyTownListener>();
  //       testingTown.addTownListener(mockListener);
  //       // find the 'playerMovement' event handler for the socket, which should have been registered after the socket was connected
  //       const playerMovementHandler = mockSocket.on.mock.calls.find(call => call[0] === 'playerMovement');
  //       if (playerMovementHandler && playerMovementHandler[1]) {
  //         const newLocation = generateTestLocation();
  //         player.location = newLocation;
  //         playerMovementHandler[1](newLocation);
  //         expect(mockListener.onPlayerMoved).toHaveBeenCalledWith(player);
  //       } else {
  //         fail('No playerMovement handler registered');
  //       }
  //     });
  //   });
  // });
//});
