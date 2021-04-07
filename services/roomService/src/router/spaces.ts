import { Express } from 'express';
import BodyParser from 'body-parser';
import io from 'socket.io';
import { Server } from 'http';
import { StatusCodes } from 'http-status-codes';
import { spaceClaimHandler, spaceCreateHandler, spaceDisbandHandler, spaceListHandler, spaceSubscriptionHandler, spaceUpdateHandler } from '../requestHandlers/CoveySpaceRequestHandlers';
import { logError } from '../Utils';
import { townDeleteHandler, townJoinHandler, townSubscriptionHandler } from '../requestHandlers/CoveyTownRequestHandlers';

export default function addTownRoutes(http: Server, app: Express): io.Server {
  /*
    * Create a new Space (aka join a Space)
    */
  app.post('/spaces/:townID/:spaceID', BodyParser.json(), async (req, res) => {
    try {
      const result = await spaceCreateHandler({
        coveyTownID: req.body.townID,
        coveySpaceID: req.body.spaceID,
      });
      res.status(StatusCodes.OK)
        .json(result);
    } catch (err) {
      logError(err);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({
          message: 'Internal server error, please see log in server for more details',
        });
    }
  });

  /**
 * Disband a space
 */
  app.delete('/spaces/:townID/:spaceID', BodyParser.json(), async (req, res) => {
    try {
      const result = await spaceDisbandHandler({
        coveySpaceID: req.params.spaceID,
      });
      res.status(200)
        .json(result);
    } catch (err) {
      logError(err);
      res.status(500)
        .json({
          message: 'Internal server error, please see log in server for details',
        });
    }
  });

  /**
 * List all Spaces
 */
  app.get('/spaces/:townID', BodyParser.json(), async (_req, res) => {
    try {
      const result = await spaceListHandler();
      res.status(StatusCodes.OK)
        .json(result);
    } catch (err) {
      logError(err);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({
          message: 'Internal server error, please see log in server for more details',
        });
    }
  });

  /**
 * Claim a space
 */
  app.post('/spaces/:townID/:spaceID', BodyParser.json(), async (req, res) => {
    try {
      const result = await spaceClaimHandler({
        coveySpaceID: req.params.spaceID,
        newHostPlayerID: req.body.hostID,
      });
      res.status(StatusCodes.OK)
        .json(result);
    } catch (err) {
      logError(err);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({
          message: 'Internal server error, please see log in server for more details',
        });
    }
  });
  /**
 * Update a space
 */
  app.patch('/spaces/:townID/:spaceID', BodyParser.json(), async (req, res) => {
    try {
      const result = await spaceUpdateHandler({
        coveySpaceID: req.params.spaceID,
        newHost: req.body.host,
        newPresenter: req.body.presenters,
        newWhitelist: req.body.players,
      });
      res.status(StatusCodes.OK)
        .json(result);
    } catch (err) {
      logError(err);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({
          message: 'Internal server error, please see log in server for more details',
        });
    }
  });

  /**
* List the spaces in a town
*/
  app.get('/space/:townID/', BodyParser.json(), async (_req, res) => {
    try {
      const result = await spaceListHandler();
      res.status(200)
        .json(result);
    } catch (err) {
      logError(err);
      res.status(500)
        .json({
          message: 'Internal server error, please see log in server for details',
        });
    }
  });

  const socketServer = new io.Server(http, { cors: { origin: '*' } });
  socketServer.on('connection', spaceSubscriptionHandler);
  return socketServer;
}
