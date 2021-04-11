import React, { useCallback, useEffect, useState } from 'react';

import {
  Button,
  FormControl,
  FormLabel,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  useDisclosure,
  useToast
} from '@chakra-ui/react';
import MenuItem from '@material-ui/core/MenuItem';
import Typography from '@material-ui/core/Typography';

import useCoveyAppState from '../../../../../../hooks/useCoveyAppState';
import useMaybeVideo from '../../../../../../hooks/useMaybeVideo';
import Player from '../../../../../../classes/Player';
import { CoveySpaceInfo } from '../../../../../../classes/SpacesServiceClient';
import TransferList from '../Menu/TransferList';

type SpaceControlProps = {
  initialSpaceInfo: CoveySpaceInfo;
}

export default function SpaceControls ({initialSpaceInfo} : SpaceControlProps) {
  const {isOpen, onOpen, onClose} = useDisclosure();
  const video = useMaybeVideo();
  const { spaceApiClient, myPlayerID, players, currentLocation } = useCoveyAppState();
  const [whitelist, setWhitelist] = useState<string[]>(initialSpaceInfo.whitelist);
  const [presenter, setPresenter] = useState<string | null>(initialSpaceInfo.presenterID);

  // Gets the current whitelist from the space
  const getCurrentWhitelist = async () => {
    const currentSpaceInfo = await spaceApiClient.getSpaceForPlayer({ playerID: myPlayerID });
    const spaceInfo = currentSpaceInfo.space;
    console.log(`While setting whitelist: ${spaceInfo.whitelist}`);
    setWhitelist(spaceInfo.whitelist);
    console.log(`After setWhitelist: ${whitelist}`);
  }

  // Gets the names of the players in the whitelist by matching the IDs
  function idListToPlayerList (idList: string[]): Player[] {
    const playerList: Player[] = [];

    idList.forEach(id => {
      const playerWithID = players.find(player => player.id === id);
      if (playerWithID !== undefined){
        playerList.push(playerWithID);
      }
    });

    return playerList;
  }

  // useEffect(() => {
  //   console.log(`Before calling getCurrentWhitelist: ${whitelist}`);
  //   getCurrentWhitelist();
  //   console.log(`After calling getCurrentWhitelist: ${whitelist}`);
  // }, [isOpen])

  const openControls = useCallback(()=>{
    onOpen();

    console.log(`Before calling getCurrentWhitelist onOpen: ${whitelist}`);
    getCurrentWhitelist();
    console.log(`After calling getCurrentWhitelist onOpen: ${whitelist}`);

    video?.pauseGame();
  }, [onOpen, video]);

  const closeControls = useCallback(()=>{
    onClose();

    video?.unPauseGame();
  }, [onClose, video]);

  const toast = useToast()
  const processUpdates = async (action: string) => {
    if (action === 'disband') {
      try {
        await spaceApiClient.disbandSpace({ coveySpaceID: currentLocation.space, hostID: null });
        toast({
          title: 'Space disbanded',
          status: 'success'
        })
        closeControls();
      } catch (err) {
        toast({
          title: 'Unable to disband space',
          description: err.toString(),
          status: 'error'
        });
      }
    } 
    
    if (action === 'edit') {
      try {
        console.log(`Edit: ${currentLocation.space}, ${myPlayerID}, ${presenter}, [${whitelist}]`);
        await spaceApiClient.updateSpace({
          coveySpaceID: currentLocation.space,
          newHostID: myPlayerID,
          newPresenterID: presenter,
          newWhitelist: whitelist,
        });
        toast({
          title: 'Space updated',
          status: 'success'
        })
        closeControls();
      }catch(err){
        toast({
          title: 'Unable to update space',
          description: err.toString(),
          status: 'error'
        });
      }
    }
  };

  return <>
    <MenuItem data-testid='openMenuButton' onClick={openControls}>
      <Typography variant="body1">Space Controls</Typography>
    </MenuItem>
    <Modal isOpen={isOpen} onClose={closeControls} size='xl'>
      <ModalOverlay/>
      <ModalContent>
        <ModalHeader> Space Controls </ModalHeader>
        <ModalCloseButton/>
        <form onSubmit={(ev)=>{ev.preventDefault(); processUpdates('edit')}}>
          <ModalBody pb={6}>
            <FormControl>
              <FormLabel htmlFor='whitelist'>Whitelist</FormLabel>
              <TransferList whitelistOfPlayers={idListToPlayerList(whitelist)} onWhitelistChange={e => setWhitelist(e)}/>
            </FormControl>

            <FormControl mt={4}>
              <FormLabel htmlFor='presenter'>Presenter</FormLabel>
              {/* <Checkbox id="isPubliclyListed" name="isPubliclyListed"  isChecked={isPubliclyListed} onChange={(e)=>setIsPubliclyListed(e.target.checked)} /> */}
            </FormControl>
          </ModalBody>

          <ModalFooter>
            <Button data-testid='disbandbutton' colorScheme="red" mr={3} value="disband" name='action1' onClick={()=>processUpdates('disband')}>
              Disband Space
            </Button>
            <Button data-testid='updatebutton' colorScheme="blue" mr={3} value="update" name='action2' onClick={()=>processUpdates('edit')}>
              Update Space
            </Button>
            <Button onClick={closeControls}>Cancel</Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  </>
}