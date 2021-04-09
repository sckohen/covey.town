import React, { useCallback, useEffect, useState } from 'react';

import {
  Box,
  Button,
  Checkbox,
  FormControl,
  FormLabel,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Table,
  TableCaption,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  useDisclosure,
  useToast
} from '@chakra-ui/react';
import MenuItem from '@material-ui/core/MenuItem';
import Typography from '@material-ui/core/Typography';

import useCoveyAppState from '../../hooks/useCoveyAppState';
import useMaybeVideo from '../../hooks/useMaybeVideo';
import Player from '../../classes/Player';
import { CoveySpaceInfo } from '../../classes/SpacesServiceClient';

const SpaceControls: React.FunctionComponent = () => {
  const {isOpen, onOpen, onClose} = useDisclosure();
  const video = useMaybeVideo();
  const { spaceApiClient, myPlayerID, players, currentLocation } = useCoveyAppState();
  const [spaceInfo, setSpaceInfo] = useState<CoveySpaceInfo>({coveySpaceID: "World", currentPlayers: [], whitelist: [], hostID: null, presenterID: null});
  const [whitelist, setWhitelist] = useState<string[]>([]);
  const [presenter, setPresenter] = useState<string | null>(null);

  // Get the info on the current space (whitelist, hostID, presenterID)
  const getSpaceInfo = async () => {
    const currentSpaceInfo = await spaceApiClient.getSpaceForPlayer({ playerID: myPlayerID });
    setSpaceInfo(currentSpaceInfo.space);
  }

  // Gets the current whitelist from the space
  const getCurrentWhitelist = async () => {
    getSpaceInfo();
    setWhitelist(spaceInfo.whitelist);
  } 

  // Gets the names of the players in the whitelist by matching the IDs
  const getCurrentWhitelistedPlayers = () => {
    const whitelistOfPlayers: Player[] = [];

    whitelist.forEach(id => {
      const playerWithID = players.find(player => player.id === id);
      if (playerWithID !== undefined){
        whitelistOfPlayers.push(playerWithID);
      }
    });

    return whitelistOfPlayers;
  }

  type PlayerSelected = {
    id: string;
    username: string;
    selected: boolean;
  }

  const WhitelistSelector = () => {
    const [data, setData] = useState<PlayerSelected[]>([])

    const isInInWhitelist = (playerID: string) => {
      const isIn = whitelist.includes(playerID);
      return isIn;
    }

    const handleData = () => {
      const playerIdAndName: PlayerSelected[] = [];
      players.forEach((p) => playerIdAndName.push({id: p.id, username: p.userName, selected: isInInWhitelist(p.id)}));
      setData(playerIdAndName);
    }

    const addToWhitelist = (playerID: string) => {
      const currentList = whitelist;
      currentList.push(playerID);
      setWhitelist(currentList);
    }

    const getValue = (playerID: string) => {
      const playerInfo = data.find(player => player.id === playerID);
      let value = false;
      if (playerInfo !== undefined) {
        value = playerInfo.selected;
      }
      return value;
    }

    useEffect(() => {
      handleData();
    }, [players, handleData])

    return (
      <Box maxH="300px" overflowY="scroll">
           <Table>
               <TableCaption placement="bottom">Players In Town</TableCaption>
               <Thead><Tr><Th>Player Name</Th><Th>Player ID</Th><Th>In Whitelist?</Th></Tr></Thead>
               <Tbody>
                 {data.map((player) => (
                   <Tr key={player.id}><Td role='cell'>{player.username}</Td><Td
                     role='cell'>{player.id}</Td>
                      <Td role='cell'>{true}
                       <Checkbox 
                        id='isInWhitelist' 
                        name='isInWhitelist'
                        isChecked={isInInWhitelist(player.id)}
                        onChange={()=>addToWhitelist(player.id)} />
                      </Td>
                    </Tr>
                   ))}
                 </Tbody>
           </Table>
      </Box>
    );
  }

  const openControls = useCallback(()=>{
    onOpen(); 
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
    } else {
      try {
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
    <Modal isOpen={isOpen} onClose={closeControls}>
      <ModalOverlay/>
      <ModalContent>
        <ModalHeader> Space Controls </ModalHeader>
        <ModalCloseButton/>
        <form onSubmit={(ev)=>{ev.preventDefault(); processUpdates('edit')}}>
          <ModalBody pb={6}>
            <FormControl>
              <FormLabel htmlFor='friendlyName'>Whitelist</FormLabel>
              <WhitelistSelector/>
            </FormControl>

            <FormControl mt={4}>
              <FormLabel htmlFor='isPubliclyListed'>Presenter</FormLabel>
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


export default SpaceControls;
