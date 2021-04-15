import { nanoid } from 'nanoid';
import CoveyTownsStore from './CoveyTownsStore';
import CoveyTownListener from '../types/CoveyTownListener';
import Player from '../types/Player';
import CoveySpacesStore from './CoveySpacesStore';


function createTownForTesting(friendlyNameToUse?: string, isPublic = false) {
    const friendlyName = friendlyNameToUse !== undefined ? friendlyNameToUse :
      `${isPublic ? 'Public' : 'Private'}TestingTown=${nanoid()}`;
    return CoveyTownsStore.getInstance()
      .createTown(friendlyName, isPublic);
  }

function createSpaceForTesting(spaceID: string, townControllerID: string) {
    return CoveySpacesStore.getInstance()
      .createSpace(spaceID, townControllerID);
  }


 describe('CoveySpacesStore', () => {
   beforeEach(() => {
   });
   it('should be a singleton', () => {
     //const town = createTownForTesting();
     //const space = createSpaceForTesting('1', town.coveyTownID);
     const store1 = CoveySpacesStore.getInstance();
     const store2 = CoveySpacesStore.getInstance();
     expect(store1)
       .toBe(store2);
   });

   describe('createSpace', () => {
     it('Should check if the town exist or not before creating the space', () => {
       const firstTown = createTownForTesting();
       const firstSpace = createSpaceForTesting('1','1');
       const secondSpace = createSpaceForTesting('2', firstTown.coveyTownID);
       expect(firstSpace).toThrowError();
       expect(secondSpace.coveySpaceID).toBe(`${firstTown.coveyTownID}_${secondSpace.coveySpaceID}`)
     });
   });

   describe('getControllerForSpace', () => {
     it('Should return the same controller on repeated calls', async () => {
       const firstTown = createTownForTesting();
       const firstSpace = createSpaceForTesting('1', firstTown.coveyTownID);
       expect(firstSpace)
         .toBe(CoveySpacesStore.getInstance()
           .getControllerForSpace(firstSpace.coveySpaceID));
       expect(firstSpace)
         .toBe(CoveySpacesStore.getInstance()
           .getControllerForSpace(firstSpace.coveySpaceID));
     });
   });

   describe('updateSpace', () => {
     it('Should check if the space controller exists before updating', () => {
       const town = createTownForTesting();
       const space = createSpaceForTesting('1', town.coveyTownID);
       const { friendlyName } = town;
       const res = CoveySpacesStore.getInstance()
         .updateSpace('1', 'abcd', 'newName');
       CoveySpacesStore.getInstance()
         .updateSpace(space.coveySpaceID, 'abcd', 'newName');
       expect(res)
         .toBe(false);
       expect(space.spaceHostID)
        .toBe('abcd');
      expect(space.presenterID)
        .toBe('newName');
     });
   });

  describe('disband space', () => {
    it('Should fail if the spaceID does not exist', async () => {
      const res = CoveySpacesStore.getInstance()
        .disbandSpace('abcdef');
      expect(res)
        .toBe(false);
    });
   });

  describe('getSpaceForPlayer', () => {
    it('Should check if the space exists before getting the space', async () => {
      const town = createTownForTesting(undefined, true);
      const space = createSpaceForTesting('1', town.coveyTownID)
      const player1 = new Player('p1');
      const player2 = new Player('p2');
      space.addPlayer(player1.id);
      const res1 = CoveySpacesStore.getInstance().getSpaceForPlayer(player1.id);
      const res2 = CoveySpacesStore.getInstance().getSpaceForPlayer(player2.id);
      const spaces = CoveySpacesStore.getInstance()
        .listSpaces();
      expect(res1.coveySpaceID)
        .toBe(space.coveySpaceID);
      expect(res2.coveySpaceID)
        .toBe('World');

    });
  });
  describe('listSpaces', () => {
    it('Should include all spaces', async () => {
      const town = createTownForTesting(undefined, true);
      createSpaceForTesting('1', town.coveyTownID);
      createSpaceForTesting('2', town.coveyTownID);
      const spaces = CoveySpacesStore.getInstance()
        .listSpaces();
      expect(spaces.length)
        .toBe(2);
    });
  });
});
