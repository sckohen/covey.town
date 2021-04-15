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


 describe('CoveyTownsStore', () => {
   beforeEach(() => {
   });
   it('should be a singleton', () => {
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
//     it('Should fail if the townID does not exist', async () => {
//       const town = createTownForTesting();
//       const { friendlyName } = town;

//       const res = CoveyTownsStore.getInstance()
//         .updateTown('abcdef', town.townUpdatePassword, 'newName', true);
//       expect(res)
//         .toBe(false);
//       expect(town.friendlyName)
//         .toBe(friendlyName);
//       expect(town.isPubliclyListed)
//         .toBe(false);

     });
//     it('Should update the town parameters', async () => {

//       // First try with just a visiblity change
//       const town = createTownForTesting();
//       const { friendlyName } = town;
//       const res = CoveyTownsStore.getInstance()
//         .updateTown(town.coveyTownID, town.townUpdatePassword, undefined, true);
//       expect(res)
//         .toBe(true);
//       expect(town.isPubliclyListed)
//         .toBe(true);
//       expect(town.friendlyName)
//         .toBe(friendlyName);

//       // Now try with just a name change
//       const newFriendlyName = nanoid();
//       const res2 = CoveyTownsStore.getInstance()
//         .updateTown(town.coveyTownID, town.townUpdatePassword, newFriendlyName, undefined);
//       expect(res2)
//         .toBe(true);
//       expect(town.isPubliclyListed)
//         .toBe(true);
//       expect(town.friendlyName)
//         .toBe(newFriendlyName);

//       // Now try to change both
//       const res3 = CoveyTownsStore.getInstance()
//         .updateTown(town.coveyTownID, town.townUpdatePassword, friendlyName, false);
//       expect(res3)
//         .toBe(true);
//       expect(town.isPubliclyListed)
//         .toBe(false);
//       expect(town.friendlyName)
//         .toBe(friendlyName);
//     });
   });

  describe('disband space', () => {
    // it('Should check the password before deleting the town', () => {
    //   const town = createTownForTesting();
    //   const res = CoveyTownsStore.getInstance()
    //     .deleteTown(town.coveyTownID, `${town.townUpdatePassword}*`);
    //   expect(res)
    //     .toBe(false);
    // });
    it('Should fail if the spaceID does not exist', async () => {
      const res = CoveySpacesStore.getInstance()
        .disbandSpace('abcdef', 'player1');
      expect(res)
        .toBe(false);
    });
  //   it('Should publicize the space', async () => {
  //     const town = createTownForTesting();
  //     const space = createSpaceForTesting('1', town.coveyTownID);
  //     const res = CoveySpacesStore.getInstance()
  //       .disbandSpace(space.coveySpaceID);

  //     expect(space.)
  //       .toBe(0);
  //     expect(mockCoveyListenerTownDestroyed.mock.calls.length)
  //       .toBe(4);
  //   });
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
      // expect(entry[0].friendlyName)
      //   .toBe(town.friendlyName);
      // expect(entry[0].coveyTownID)
      //   .toBe(town.coveyTownID);
    });
//     it('Should include each CoveyTownID if there are multiple towns with the same friendlyName', async () => {
//       const town = createTownForTesting(undefined, true);
//       const secondTown = createTownForTesting(town.friendlyName, true);
//       const towns = CoveyTownsStore.getInstance()
//         .getTowns()
//         .filter(townInfo => townInfo.friendlyName === town.friendlyName);
//       expect(towns.length)
//         .toBe(2);
//       expect(towns[0].friendlyName)
//         .toBe(town.friendlyName);
//       expect(towns[1].friendlyName)
//         .toBe(town.friendlyName);

//       if (towns[0].coveyTownID === town.coveyTownID) {
//         expect(towns[1].coveyTownID)
//           .toBe(secondTown.coveyTownID);
//       } else if (towns[1].coveyTownID === town.coveyTownID) {
//         expect(towns[0].coveyTownID)
//           .toBe(town.coveyTownID);
//       } else {
//         fail('Expected the coveyTownIDs to match the towns that were created');
//       }

//     });
//     it('Should not include private towns', async () => {
//       const town = createTownForTesting(undefined, false);
//       const towns = CoveyTownsStore.getInstance()
//         .getTowns()
//         .filter(townInfo => townInfo.friendlyName === town.friendlyName || townInfo.coveyTownID === town.coveyTownID);
//       expect(towns.length)
//         .toBe(0);
//     });
//     it('Should not include private towns, even if there is a public town of same name', async () => {
//       const town = createTownForTesting(undefined, false);
//       const town2 = createTownForTesting(town.friendlyName, true);
//       const towns = CoveyTownsStore.getInstance()
//         .getTowns()
//         .filter(townInfo => townInfo.friendlyName === town.friendlyName || townInfo.coveyTownID === town.coveyTownID);
//       expect(towns.length)
//         .toBe(1);
//       expect(towns[0].coveyTownID)
//         .toBe(town2.coveyTownID);
//       expect(towns[0].friendlyName)
//         .toBe(town2.friendlyName);
//     });
//     it('Should not include deleted towns', async () => {
//       const town = createTownForTesting(undefined, true);
//       const towns = CoveyTownsStore.getInstance()
//         .getTowns()
//         .filter(townInfo => townInfo.friendlyName === town.friendlyName || townInfo.coveyTownID === town.coveyTownID);
//       expect(towns.length)
//         .toBe(1);
//       const res = CoveyTownsStore.getInstance()
//         .deleteTown(town.coveyTownID, town.townUpdatePassword);
//       expect(res)
//         .toBe(true);
//       const townsPostDelete = CoveyTownsStore.getInstance()
//         .getTowns()
//         .filter(townInfo => townInfo.friendlyName === town.friendlyName || townInfo.coveyTownID === town.coveyTownID);
//       expect(townsPostDelete.length)
//         .toBe(0);
//     });
//   });
// });
  });
