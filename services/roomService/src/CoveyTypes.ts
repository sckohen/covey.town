export type Direction = 'front' | 'back' | 'left' | 'right';
export type UserLocation = {
  x: number;
  y: number;
  rotation: Direction;
  moving: boolean;
};
export type CoveyTownList = { friendlyName: string; coveyTownID: string; currentOccupancy: number; maximumOccupancy: number }[];
export type CoveySpace = { coveySpaceID: string; currentPlayers: string[]; whiteList: string[]; hostID: string | null; presenterID: string | null};

