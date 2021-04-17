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

const mockGetTokenForSpace = jest.fn();
// eslint-disable-next-line
// @ts-ignore it's a mock
TwilioVideo.getInstance = () => ({
  getTokenForSpace: mockGetTokenForSpace,
});

describe('CoveySpaceController', () => {
  beforeEach(() => {
    mockGetTokenForSpace.mockClear();
  });
  it('constructor should set the CoveySpaceID and the CoveyTownController', () => { // Included in handout
    const spaceID = `SpaceIDTest-${nanoid()}`;
    const spaceController = new CoveySpaceController(spaceID);
    expect(spaceController.coveySpaceID).toBe(spaceID);

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
      const player1 = new Player('1');
      const player2 = new Player('2');
      const spaceController = new CoveySpaceController(spaceID);
      await spaceController.addPlayer(player1);
      expect(mockGetTokenForSpace()).toBeCalledTimes(1);
      await spaceController.addPlayer(player2);
      expect(mockGetTokenForSpace()).toBeCalledTimes(2);
    });
  });
// tests removing a player from a space
describe('removePlayer', () => { // Included in handout
  it('should check if the player is on the whitelist before removed',
    async () => {
      const spaceID = `SpaceIDTest-${nanoid()}`;
      const townName = `FriendlyNameTest-${nanoid()}`;
      const townController = new CoveyTownController(townName, false);
      const player1 = new Player('1');
      const player2 = new Player('2');
      await townController.addPlayer(player1);
      await townController.addPlayer(player2);
      const spaceController = townController.spaces[0];

      await spaceController.addPlayer(player1);
      expect(mockGetTokenForSpace).toBeCalledTimes(1);
      await spaceController.addPlayer(player2);
      expect(mockGetTokenForSpace).toBeCalledTimes(2);

      spaceController.removePlayer(player1);
      expect(mockGetTokenForSpace).toBeCalledTimes(3);
      await spaceController.removePlayer(player2);
      expect(mockGetTokenForSpace).toBeCalledTimes(4);
    });
  });

// tests making a player the host
describe('claimSpace', () => { // Included in handout
  it('should check if a player can claim a space and be host',
    async () => {
      const spaceID = `SpaceIDTest-${nanoid()}`;
      const townName = `FriendlyNameTest-${nanoid()}`;
      const townController = new CoveyTownController(townName, false);
      const player1 = new Player('1');
      const player2 = new Player('2');
      await townController.addPlayer(player1);
      await townController.addPlayer(player2);
      const spaceController = townController.spaces[0];
      expect(spaceController.claimSpace(player1)).toBe(true);
  });
});
// tests removing a player from a whitelist
describe('unclaimSpace', () => { // Included in handout
  it('should check if a player can unclaim a space and stop being host',
    async () => {
      const spaceID = `SpaceIDTest-${nanoid()}`;
      const townName = `FriendlyNameTest-${nanoid()}`;
      const townController = new CoveyTownController(townName, false);
      const player1 = new Player('1');
      const player2 = new Player('2');
      await townController.addPlayer(player1);
      await townController.addPlayer(player2);
      const spaceController = townController.spaces[0];
      expect(spaceController.claimSpace(player1)).toBe(true);
      expect(spaceController.unclaimSpace()).toBeCalledTimes(1);
  });
});
  // tests updating the presenter of a space
  describe('updatePresenter', () => { // Included in handout
    it('should check if the player is on the whitelist before they are made host',
      async () => {
        const spaceID = `SpaceIDTest-${nanoid()}`;
        const townName = `FriendlyNameTest-${nanoid()}`;
        const townController = new CoveyTownController(townName, false);
        const player1 = new Player('1');
        const player2 = new Player('2');
        await townController.addPlayer(player1);
        await townController.addPlayer(player2);
        const spaceController = townController.spaces[0]
        spaceController.updatePresenter(player1);
        expect(spaceController.updatePresenter(player2)).toBeCalledTimes(2);
      });
  }); 
  // tests updating the whitelist of a space
  describe('updateWhitelist', () => { // Included in handout
    it('should check if the player is on the whitelist before they are made host',
      async () => {
        const spaceID = `SpaceIDTest-${nanoid()}`;
        const townName = `FriendlyNameTest-${nanoid()}`;
        const townController = new CoveyTownController(townName, false);
        const player1 = new Player('1');
        const player2 = new Player('2');
        await townController.addPlayer(player1);
        await townController.addPlayer(player2);
        const spaceController = townController.spaces[0];
        const newWhitelist = [player1];
        spaceController.updateWhitelist(newWhitelist);
        expect(spaceController.whitelist).toBe(['1']);
      });
  });

    // tests adding a player to a space
  describe('getSpaceInfo', () => { // Included in handout
    it('should check if the information from the space can be recieved',
      async () => {
        //const townName = `FriendlyNameTest-${nanoid()}`;
        //const townController = new CoveySpaceController(townName, false);
        //const newPlayerSession = await townController.addPlayer(new Player(nanoid()));
        //expect(mockGetTokenForTown).toBeCalledTimes(1);
        //expect(mockGetTokenForTown).toBeCalledWith(townController.coveyTownID, newPlayerSession.player.id);

        const spaceID = `SpaceIDTest-${nanoid()}`;
        const townName = `FriendlyNameTest-${nanoid()}`;
        const townController = new CoveyTownController(townName, false);
        const player1 = new Player('1');
        await townController.addPlayer(player1);
        await townController.addPlayer(new Player('2'));
        const spaceController = townController.spaces[0];
        await spaceController.addPlayer(player1);
        expect(spaceController.getSpaceInfo()).toBeCalledTimes(1);
      });
    });

    // tests adding a player to a space
  describe('isPlayerInSpace', () => { // Included in handout
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
        const player1 = new Player('1');
        const player2 = new Player('2');
        await townController.addPlayer(player1);
        await townController.addPlayer(player2);
        const spaceController = townController.spaces[0];
        await spaceController.addPlayer(player1);
        expect(spaceController.isPlayerInSpace('1')).toBe(true);
        expect(spaceController.isPlayerInSpace('2')).toBe(false);
      });
    });