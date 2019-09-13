import * as mysql from '@mysql/xdevapi';
import * as bodyParser from 'body-parser';
import * as express from 'express';
import * as logger from 'morgan';
import { join } from 'path';
import accountcheck from './api/accountcheck';
import check from './api/check';
import echo from './api/echo';
import clienterror from './api/errors/clienterror';
import servererror from './api/errors/servererror';
import events from './api/events';
import filerouter from './api/files';
import { getFormToken } from './api/formtoken';
import getSlideshowImageIDs from './api/getSlideshowImageIDs';
import members from './api/member';
import notifications from './api/notifications';
import registry from './api/registry';
import signin from './api/signin';
import team from './api/team';
import { Configuration } from './conf';
import {
	Account,
	conditionalMemberMiddleware,
	memberMiddleware,
	MySQLMiddleware,
	MySQLRequest
} from './lib/internals';

export default async (conf: typeof Configuration, session?: mysql.Session) => {
	const router: express.Router = express.Router();

	const { database: schema, host, password, port: mysqlPort, user } = conf.database.connection;

	if (typeof session === 'undefined') {
		session = await mysql.getSession({
			host,
			password,
			port: mysqlPort,
			user
		});
	}

	const eventManagementSchema = session.getSchema(schema);

	/**
	 * Use API Routers
	 */
	router.use('*', MySQLMiddleware(eventManagementSchema, session, conf));

	router.use((req: MySQLRequest, _, next) => {
		req._originalUrl = req.originalUrl;
		req.originalUrl = 'http' + (req.secure ? 's' : '') + '://' + req.hostname + req.originalUrl;
		next();
	});

	if (!conf.testing) {
		router.use(logger('dev'));
	}

	router.use('/files', filerouter);

	router.get('/signin', (req, res) => {
		res.sendFile(join(__dirname, '..', 'signin_form.html'));
	});

	router.use(
		bodyParser.json({
			strict: false
		})
	);
	router.use((req, res, next) => {
		if (typeof req.body !== 'undefined' && req.body === 'teapot') {
			res.status(418);
			res.end();
		} else if (typeof req.body !== 'object') {
			res.status(400);
			res.end();
		} else {
			next();
		}
	});

	router.post('/signin', Account.ExpressMiddleware, signin);

	router.get('/token', Account.ExpressMiddleware, memberMiddleware, getFormToken);

	router.get(
		'/banner',
		Account.ExpressMiddleware,
		conditionalMemberMiddleware,
		getSlideshowImageIDs
	);

	router.use('/registry', registry);

	router.get('/accountcheck', Account.ExpressMiddleware, accountcheck);

	router.post('/echo', echo);

	router.use('/check', Account.ExpressMiddleware, conditionalMemberMiddleware, check);

	router.use('/event', events);

	router.use('/team', team);

	router.use('/member', Account.ExpressMiddleware, members);

	router.use('/notifications', notifications);

	router.post(
		'/clienterror',
		Account.ExpressMiddleware,
		conditionalMemberMiddleware,
		clienterror
	);

	router.use('*', (req, res) => {
		res.status(404);
		res.end();
	});

	router.use(servererror);

	return {
		router,
		session
	};
};
