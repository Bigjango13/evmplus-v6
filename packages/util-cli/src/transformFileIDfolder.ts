#!/usr/bin/env node
/**
 * Copyright (C) 2020 Glenn Rioux
 *
 * This file is part of EvMPlus.org.
 *
 * EvMPlus.org is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * EvMPlus.org is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with EvMPlus.org.  If not, see <http://www.gnu.org/licenses/>.
 */

import * as mysql from '@mysql/xdevapi';
import { getSession } from '@mysql/xdevapi';
import { Either, Maybe } from 'common-lib';
import { getAccount, getConf, getFileObject, saveFileObject } from 'server-common';


export const collectLegacySqlResults = async <T>(
	find: mysql.SqlExecute,
): Promise<mysql.WithoutEmpty<T>[]> => {
	try {
		return (await find.execute()).fetchAll();
	} catch (e) {
		console.error(e);
		throw new Error(e);
	}
};




process.on('unhandledRejection', up => {
	throw up;
});

(async () => {
	const conf = await getConf();

	const session = await getSession({
		host: conf.DB_HOST,
		password: conf.DB_PASSWORD,
		port: conf.DB_PORT,
		user: conf.DB_USER,
	});




	const FIDs = await collectLegacySqlResults<[FileID: string]>(
		session.sql('SELECT FileID FROM EventManagement.FileEventAssignments WHERE EID > 555 GROUP BY FileID;')
	);

	const schema = session.getSchema(conf.DB_SCHEMA);

	const account = await getAccount(schema)("md089").fullJoin();

	for (const fid of FIDs) {
		const [FileID] = fid;
		console.log("FID: ", FileID);
		const activeFile = await getFileObject(schema)(account)(Maybe.none())(FileID);

		if (Either.isRight(activeFile)) {

			activeFile.value.parentID = "Events";
			await saveFileObject(schema)(activeFile.value).fullJoin();
		} else {
			console.log("failed");
		}
	}

	await session.close();

	process.exit();
})();

