import React, { useEffect, useState } from 'react';
import { makeStyles, Theme, createStyles } from '@material-ui/core/styles';
import Grid from '@material-ui/core/Grid';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import Checkbox from '@material-ui/core/Checkbox';
import Button from '@material-ui/core/Button';
import Paper from '@material-ui/core/Paper';

import useCoveyAppState from '../../../../../../hooks/useCoveyAppState';
import Player from '../../../../../../classes/Player';
import { useDisclosure } from '@chakra-ui/hooks';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      margin: 'auto',
    },
    paper: {
      width: 200,
      height: 230,
      overflow: 'auto',
    },
    button: {
      margin: theme.spacing(0.5, 0),
    },
  }),
);

function not(a: Player[], b: Player[]) {
  return a.filter((value) => b.indexOf(value) === -1);
}

function intersection(a: Player[], b: Player[]) {
  return a.filter((value) => b.indexOf(value) !== -1);
}

type TransferListProps = {
  whitelistOfPlayers : Player[];
  onWhitelistChange: React.Dispatch<React.SetStateAction<string[]>>;
}

export default function TransferList({whitelistOfPlayers, onWhitelistChange}: TransferListProps) {
  const {onClose} = useDisclosure(); // If we want to do action based on opening or closing of the element
  const { players } = useCoveyAppState();
  const classes = useStyles();
  const [checked, setChecked] = useState<Player[]>([]);
  const [notSelected, setNotSelected] = useState<Player[]>(players.filter((p) => !whitelistOfPlayers.includes(p)));
  const [newWhitelist, setNewWhitelist] = useState<Player[]>(whitelistOfPlayers);

  const leftChecked = intersection(checked, notSelected);
  const rightChecked = intersection(checked, newWhitelist);

  const handleToggle = (value: Player) => () => {
    const currentIndex = checked.indexOf(value);
    const newChecked = [...checked];

    if (currentIndex === -1) {
      newChecked.push(value);
    } else {
      newChecked.splice(currentIndex, 1);
    }

    setChecked(newChecked);
  };

  const handleAllRight = () => {
    setNewWhitelist(newWhitelist.concat(notSelected));
    setNotSelected([]);
  };

  const handleCheckedRight = () => {
    setNewWhitelist(newWhitelist.concat(leftChecked));
    setNotSelected(not(notSelected, leftChecked));
    setChecked(not(checked, leftChecked));
  };

  const handleCheckedLeft = () => {
    setNotSelected(notSelected.concat(rightChecked));
    setNewWhitelist(not(newWhitelist, rightChecked));
    setChecked(not(checked, rightChecked));
  };

  const handleAllLeft = () => {
    setNotSelected(notSelected.concat(newWhitelist));
    setNewWhitelist([]);
  };

  const handleChange = () => {
    const newWhitelistOfIDs = newWhitelist.map(p => p.id);
    onWhitelistChange(newWhitelistOfIDs);
  }

  useEffect(() => {
    handleChange();
  }, [newWhitelist])

  const customList = (items: Player[]) => (
    <Paper className={classes.paper}>
      <List dense component="div" role="list">
        {items.map((value: Player) => {
          const labelId = `user-${value.id}`;

          return (
            <ListItem key={value.id} role="listitem" button onClick={handleToggle(value)}>
              <ListItemIcon>
                <Checkbox
                  checked={checked.indexOf(value) !== -1}
                  tabIndex={-1}
                  disableRipple
                  inputProps={{ 'aria-labelledby': labelId }}
                />
              </ListItemIcon>
              <ListItemText id={labelId} primary={`${value.userName} (${value.id.slice(0, 5)})`} />
            </ListItem>
          );
        })}
        <ListItem />
      </List>
    </Paper>
  );

  return (
    <Grid container spacing={2} justify="center" alignItems="center" className={classes.root}>
      <Grid item>{customList(notSelected)}</Grid>
      <Grid item>
        <Grid container direction="column" alignItems="center">
          <Button
            variant="outlined"
            size="small"
            className={classes.button}
            onClick={handleAllRight}
            disabled={notSelected.length === 0}
            aria-label="move all right"
          >
            ≫
          </Button>
          <Button
            variant="outlined"
            size="small"
            className={classes.button}
            onClick={handleCheckedRight}
            disabled={leftChecked.length === 0}
            aria-label="move selected right"
          >
            &gt;
          </Button>
          <Button
            variant="outlined"
            size="small"
            className={classes.button}
            onClick={handleCheckedLeft}
            disabled={rightChecked.length === 0}
            aria-label="move selected left"
          >
            &lt;
          </Button>
          <Button
            variant="outlined"
            size="small"
            className={classes.button}
            onClick={handleAllLeft}
            disabled={newWhitelist.length === 0}
            aria-label="move all left"
          >
            ≪
          </Button>
        </Grid>
      </Grid>
      <Grid item>{customList(newWhitelist)}</Grid>
    </Grid>
  );
}