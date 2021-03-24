import Player from './Player';

/**
 * A listener for player-related events in each town
 */
export default interface CoveySpaceListener {
  /**
   * Called when a player walkes into the private space
   * @param newPlayer the new player
   */
  onPlayerWalkedIn(newPlayer: Player): void;

  /**
   * Called when a player walks out of the private space
   * @param removedPlayer the player that disconnected
   */
  onPlayerWalkedOut(removedPlayer: Player): void;

  /**
   * Called when the private space is no longer authoritative
   */
  onSpaceDisbanded(): void;
}
