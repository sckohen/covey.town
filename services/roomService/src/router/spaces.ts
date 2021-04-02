import { Express } from 'express';
import BodyParser from 'body-parser';
import io from 'socket.io';
import { Server } from 'http';
import { StatusCodes } from 'http-status-codes';
import { spaceJoinHandler, spaceDisbandHandler, spaceListHandler, spaceSubscriptionHandler, spaceUpdateHandler, spaceCreateHandler } from '../requestHandlers/CoveySpaceRequestHandlers';
import { logError } from '../Utils';

export default function addSpaceRoutes(http: Server, app: Express): io.Server {
  /**
   * Create a new space
   */
  app.post('/spaces/:townID/:spaceID', BodyParser.json(), async (req, res) => {
    try {
      const result = await spaceCreateHandler({
        coveyTownID: req.params.townID,
        coveySpaceID: req.params.spaceID,
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
   * List all Spaces
   */
  app.get('/spaces/', BodyParser.json(), async (_req, res) => {
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
   * Join a space
   */
  app.post('/spaces/:spaceID/:playerID', BodyParser.json(), async (req, res) => {
    try {
      const result = await spaceJoinHandler({
        playerID: req.params.playerID,
        coveySpaceID: req.params.spaceID,
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
   * Disband a private space (go back to being a normal space)
   */
     app.delete('/spaces/:spaceID', BodyParser.json(), async (req, res) => {
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
   * Update a space (also used to claim space)
   */
  app.patch('/spaces/:spaceID', BodyParser.json(), async (req, res) => {
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

  const socketServer = new io.Server(http, { cors: { origin: '*' } });
  socketServer.on('connection', spaceSubscriptionHandler);
  return socketServer;
}
