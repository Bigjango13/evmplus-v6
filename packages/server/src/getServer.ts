/**
 * Copyright (C) 2020 Andrew Rioux
 *
 * This file is part of CAPUnit.com.
 *
 * CAPUnit.com is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * CAPUnit.com is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with CAPUnit.com.  If not, see <http://www.gnu.org/licenses/>.
 */

import { Client } from '@mysql/xdevapi';
import { MemberUpdateEventEmitter, ServerConfiguration } from 'common-lib';
import * as express from 'express';
import * as fs from 'fs';
import * as http from 'http';
import * as path from 'path';
import getRouter from './getAPIRouter';

export interface ServerInitializationOptions {
	capwatchEmitter: MemberUpdateEventEmitter;
	conf: ServerConfiguration;
	finishServerSetup: () => void;
	server: http.Server;
	app: express.Application;
	mysqlConn: Client;
}

export default async (
	conf: ServerConfiguration,
	port: number = conf.PORT,
	mysqlConn?: Client
): Promise<ServerInitializationOptions> => {
	const app: express.Application = express();

	app.set('port', port);
	app.disable('x-powered-by');
	const server = http.createServer(app);
	server.listen(port);
	server.on('error', onError);
	server.on('listening', onListening);

	const { router: apiRouter, capwatchEmitter, mysqlConn: mysql } = await getRouter(
		conf,
		mysqlConn
	);

	app.use((req, res, next) => {
		res.removeHeader('X-Powered-By');
		next();
	});
	app.disable('x-powered-by');

	app.use(apiRouter);

	app.get('/images/banner', (req, res) => {
		fs.readdir(path.join(__dirname, '..', 'images', 'banner-images'), (err, data) => {
			if (err) {
				throw err;
			}
			const image = data[Math.round(Math.random() * (data.length - 1))];
			res.sendFile(path.join(__dirname, '..', 'images', 'banner-images', image));
		});
	});
	app.use('/images', express.static(path.join(__dirname, '..', 'images')));

	app.use('/teapot', (req, res) => {
		res.status(418);
		res.end();
	});

	if (conf.NODE_ENV === 'production') {
		// tslint:disable-next-line:no-console
		console.log('Server set up');
	}

	function onError(error: NodeJS.ErrnoException): void {
		console.error(error);

		if (error.code === 'EACCES' || error.code === 'EADDRINUSE') {
			console.error(error.code);
			process.exit(1);
		}
	}

	function onListening(): void {
		const addr = server.address();
		const bind = typeof addr === 'string' ? `pipe ${addr}` : `port ${addr?.port}`;
		if (conf.NODE_ENV === 'production') {
			console.log(`Bound on ${bind}`);
		}
	}

	process.on('beforeExit', () => {
		mysql.close();
		server.close();
	});

	return {
		app,
		server,
		capwatchEmitter,
		conf,
		mysqlConn: mysql,
		finishServerSetup() {
			app.use(express.static(path.join(conf.CLIENT_PATH, 'build')));
			app.get('*', (req, res) => {
				res.sendFile(path.join(conf.CLIENT_PATH, 'build', 'index.html'));
			});
		}
	};
};
