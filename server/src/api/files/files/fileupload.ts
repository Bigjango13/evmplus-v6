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

import * as Busboy from 'busboy';
import {
	AccountObject,
	Either,
	FileObject,
	FileUserAccessControlPermissions,
	FileUserAccessControlType,
	FullFileObject,
	RawFileObject,
	SessionType,
	toReference,
	User,
	userHasFilePermission,
} from 'common-lib';
import {
	accountRequestTransformer,
	expandFileObject,
	getFileObject,
	getFilePath,
	MySQLRequest,
	PAM,
	uploadFile,
} from 'server-common';
import { v4 as uuid } from 'uuid';
import asyncErrorHandler from '../../../lib/asyncErrorHandler';
import saveServerError from '../../../lib/saveServerError';

export const isImage = (ending: string): boolean =>
	['png', 'jpg', 'jpeg', 'gif', 'bmp'].includes(ending);

const canSaveToFolder = userHasFilePermission(FileUserAccessControlPermissions.MODIFY);

/*
	File data plan:

	1. Store FILE on disk
	2. Filename will be a UUID (there already happens to be a UUID library for tokens...)
	3. MySQL database will store METADATA (Author, filename, etc)
*/
export const func = () =>
	asyncErrorHandler(async (req: MySQLRequest<{ parentid?: string }>, res) => {
		const parentID = req.params.parentid ?? 'root';

		const reqEither = await accountRequestTransformer(req)
			.flatMap(PAM.memberRequestTransformer(SessionType.REGULAR, true))
			.flatMap(request =>
				getFileObject(false)(req.mysqlx)(request.account)(parentID).map<
					[User, AccountObject, RawFileObject]
				>(file => [request.member, request.account, file])
			)
			.join();

		if (Either.isLeft(reqEither)) {
			res.status(reqEither.value.code);
			res.end();

			await req.mysqlxSession.close();

			if (reqEither.value.type === 'CRASH') {
				throw reqEither.value.error;
			}

			return;
		}

		const [member, account, parent] = reqEither.value;

		if (
			typeof req.headers.token !== 'string' ||
			!(await PAM.isTokenValid(req.mysqlx, member, req.headers.token))
		) {
			res.status(401);
			res.end();
			return;
		}

		if (!canSaveToFolder(member)(parent)) {
			res.status(403);
			res.end();
			return;
		}

		const id = uuid().replace(/-/g, '');
		const created = Date.now();

		const filesCollection = req.mysqlx.getCollection<RawFileObject>('Files');
		const owner = toReference(member);

		const busboy = new Busboy({
			headers: req.headers,
			limits: {
				files: 1,
				fields: 1,
			},
		});

		req.pipe(busboy);

		let sentFile = false;

		busboy.on('file', (fieldName, file, fileName, encoding, contentType) => {
			sentFile = true;

			const uploadedFile: RawFileObject = {
				kind: 'drive#file',
				id,
				accountID: account.id,
				comments: '',
				contentType,
				created,
				fileName,
				forDisplay: false,
				forSlideshow: false,
				permissions: [
					{
						type: FileUserAccessControlType.OTHER,
						permission: FileUserAccessControlPermissions.READ,
					},
				],
				owner,
				parentID,
			};

			Promise.all([
				uploadFile(req.configuration)(uploadedFile)(file),
				filesCollection.add(uploadedFile).execute(),
			])
				.then(async () => {
					const fullFileObject: FullFileObject = await getFileObject(false)(req.mysqlx)(
						account
					)(id)
						.flatMap<FullFileObject>(newFile =>
							getFilePath(req.mysqlx)(account)(newFile)
								.map<FileObject>(folderPath => ({
									...newFile,
									folderPath,
								}))
								.flatMap<FullFileObject>(expandFileObject(req.mysqlx)(account))
						)
						.fullJoin();

					res.json(fullFileObject);

					await req.mysqlxSession.close();
				})
				.catch(err => {
					saveServerError(err, req);
					res.status(500);
					res.end();
				});
		});

		busboy.on('end', () => {
			if (!sentFile) {
				res.status(400);
				res.end();
			}
		});
	});

export default func();
