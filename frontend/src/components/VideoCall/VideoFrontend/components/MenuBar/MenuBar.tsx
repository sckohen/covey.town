import React, { useEffect, useState } from 'react';
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';

import Button from '@material-ui/core/Button';
import { Typography, Grid, Hidden } from '@material-ui/core';
import EndCallButton from '../Buttons/EndCallButton/EndCallButton';
import FlipCameraButton from './FlipCameraButton/FlipCameraButton';
import Menu from './Menu/Menu';

import useRoomState from '../../hooks/useRoomState/useRoomState';
import useVideoContext from '../../hooks/useVideoContext/useVideoContext';
import ToggleAudioButton from '../Buttons/ToggleAudioButton/ToggleAudioButton';
import ToggleVideoButton from '../Buttons/ToggleVideoButton/ToggleVideoButton';
import ToggleScreenShareButton from '../Buttons/ToogleScreenShareButton/ToggleScreenShareButton';
import TownSettings from '../../../../Login/TownSettings';
import SpaceControls from './Menu/SpaceControls';
import MenuContainer from '@material-ui/core/Menu';
import useCoveyAppState from '../../../../../hooks/useCoveyAppState';
import { useToast } from '@chakra-ui/toast';
import { CoveySpaceInfo } from '../../../../../classes/SpacesServiceClient';

const useStyles = makeStyles((theme: Theme) => createStyles({
  container: {
    backgroundColor: theme.palette.background.default,
    bottom: 20,
    left: 0,
    right: 0,
    // height: `${theme.footerHeight}px`,
    position: 'absolute',
    display: 'flex',
    padding: '0 1.43em',
    zIndex: 10,
    [theme.breakpoints.down('sm')]: {
      height: `${theme.mobileFooterHeight}px`,
      padding: 0,
    },
  },
  screenShareBanner: {
    position: 'absolute',
    zIndex: 10,
    bottom: `${theme.footerHeight}px`,
    left: 0,
    right: 0,
    height: '104px',
    background: 'rgba(0, 0, 0, 0.5)',
    '& h6': {
      color: 'white',
    },
    '& button': {
      background: 'white',
      color: theme.brand,
      border: `2px solid ${theme.brand}`,
      margin: '0 2em',
      '&:hover': {
        color: '#600101',
        border: '2px solid #600101',
        background: '#FFE9E7',
      },
    },
  },
  hideMobile: {
    display: 'initial',
    [theme.breakpoints.down('sm')]: {
      display: 'none',
    },
  },
}));


export default function MenuBar(props: { setMediaError?(error: Error): void }) {
  const classes = useStyles();
  const { isSharingScreen, toggleScreenShare } = useVideoContext();
  const roomState = useRoomState();
  const isReconnecting = roomState === 'reconnecting';
  const { spaceApiClient, myPlayerID, currentLocation } = useCoveyAppState();
  const [showClaimButton, setShowClaimButton] = useState<boolean>(false);
  const [showControls, setShowControls] = useState<boolean>(false);
  const [spaceInfo, setSpaceInfo] = useState<CoveySpaceInfo>({coveySpaceID: "World", currentPlayers: [], whitelist: [], hostID: null, presenterID: null});
  const toast = useToast();

  // Get the info on the current space (whitelist, hostID, presenterID)
  const getSpaceInfo = async () => {
    const currentSpaceInfo = await spaceApiClient.getSpaceForPlayer({ playerID: myPlayerID });
    setSpaceInfo(currentSpaceInfo.space);
  }
  
  const claimSpace = async () => {
    if (currentLocation.space !== 'World') { 
      try {
        await spaceApiClient.claimSpace({ coveySpaceID: currentLocation.space, playerID: myPlayerID, hostID: myPlayerID });
        setShowClaimButton(false);
        setShowControls(true);
        toast({
          title: 'You are now the host of this space',
          description: 'You can use the space controls in the menu bar',
          status: 'success',
          isClosable: true,
        });
      } catch (error) {
        setShowClaimButton(false);
        toast({
          title: 'Unable to claim space.',
          description: 'Space may already be claimed. Try walking in again.',
          status: 'error',
        });
      }
    } 
  }

  const handleClaimButton = async () => {
    if (currentLocation.space === 'World') {
      setShowClaimButton(false);
    } else if(spaceInfo.hostID === null) {
      setShowClaimButton(true);
    }
  }

  const handleSpaceControls = async () => {
    if (currentLocation.space !== 'World' && spaceInfo.hostID === myPlayerID) {
      setShowControls(true);
    } else {
      setShowControls(false);
    }
  }

  useEffect(() => {
    getSpaceInfo();
    handleClaimButton();
    handleSpaceControls();
  }, [currentLocation.space, spaceInfo.coveySpaceID]);

  return (
    <>
      {isSharingScreen && (
        <Grid container justify="center" alignItems="center" className={classes.screenShareBanner}>
          <Typography variant="h6">You are sharing your screen</Typography>
          <Button onClick={() => toggleScreenShare()}>Stop Sharing</Button>
        </Grid>
      )}
      <footer className={classes.container}>
        <Grid container justify="space-around" alignItems="center">
          <Grid item>
            <Grid container justify="center">
              <ToggleAudioButton disabled={isReconnecting} setMediaError={props.setMediaError} />
              <ToggleVideoButton disabled={isReconnecting} setMediaError={props.setMediaError} />
              <Hidden smDown>
                {!isSharingScreen && <ToggleScreenShareButton disabled={isReconnecting} />}
              </Hidden>
              <FlipCameraButton />
            </Grid>
          </Grid>
          <Hidden smDown>
            <Grid style={{ flex: 1 }}>
              <Grid container justify="flex-end">
                <TownSettings />
                {showClaimButton? <Button onClick= { claimSpace } > Claim Space </Button> : null}
                {showControls? <SpaceControls /> : null}
                <Menu />
                <EndCallButton />
              </Grid>
            </Grid>
          </Hidden>
        </Grid>
      </footer>
    </>
  );
}
