/**
 * Copyright (C) 2020 Andrew Rioux
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

import { Schema } from '@mysql/xdevapi';
import {
	AccountObject,
	always,
	AsyncEither,
	asyncIterConcat,
	asyncLeft,
	asyncRight,
	destroy,
	Either,
	errorGenerator,
	FileObject,
	FileUserAccessControlPermissions,
	FileUserAccessControlType,
	FullFileObject,
	get,
	Maybe,
	MaybeObj,
	MemberReference,
	parseStringMemberReference,
	RawFileObject,
	Right,
	ServerConfiguration,
	ServerError,
	stringifyMemberReference,
	toReference,
	User,
	yieldObjAsync,
} from 'common-lib';
import * as debug from 'debug';
import { createReadStream, createWriteStream, unlink } from 'fs';
import { join } from 'path';
import { promisify } from 'util';
import { resolveReference } from './Members';
import {
	collectResults,
	deleteItemFromCollectionA,
	findAndBind,
	findAndBindC,
	generateResults,
	saveItemToCollectionA,
} from './MySQLUtil';
import { ServerEither } from './servertypes';

const logFunc = debug('server-common:file');
const promisifiedUnlink = promisify(unlink);

export const getUserFileObject = (schema: Schema) => (account: AccountObject) => (
	member: MemberReference,
): ServerEither<FileObject> =>
	AsyncEither.All([
		getRootFileObject(schema)(account),
		asyncRight(
			schema.getCollection<RawFileObject>('Files'),
			errorGenerator('Could not get user drive'),
		)
			.map(
				findAndBindC<RawFileObject>({
					accountID: account.id,
					parentID: stringifyMemberReference(member),
				}),
			)
			.map(collectResults)
			.map(fileChildren => fileChildren.map(get('id'))),
	]).map(([root, fileChildren]) => ({
		accountID: account.id,
		comments: '',
		contentType: 'application/folder',
		created: 0,
		fileChildren: [root, ...fileChildren],
		fileName: 'Personal Drive',
		forDisplay: false,
		forSlideshow: false,
		kind: 'drive#file',
		permissions: [
			{
				type: FileUserAccessControlType.USER,
				permission: FileUserAccessControlPermissions.FULLCONTROL,
				reference: toReference(member),
			},
		],
		id: stringifyMemberReference(member),
		parentID: null,
		owner: toReference(member),
		folderPath: [
			{
				id: stringifyMemberReference(member),
				name: 'Personal Drive',
			},
		],
	}));

export const getRootFileObjectForUser = (schema: Schema) => (account: AccountObject) => (
	memberMaybe: MaybeObj<User>,
): ServerEither<FileObject> =>
	getRootFileObject(schema)(account).map(root => ({
		...root,
		folderPath: Maybe.orSome(root.folderPath)(
			Maybe.map((member: User) => [
				{
					id: stringifyMemberReference(member),
					name: 'Personal Drive',
				},
				{
					id: 'root',
					name: 'Drive',
				},
			])(memberMaybe),
		),
	}));

export const getRootFileObject = (schema: Schema) => (
	account: AccountObject,
): ServerEither<FileObject> =>
	asyncRight(
		schema.getCollection<RawFileObject>('Files'),
		errorGenerator('Could not get root file'),
	)
		.map(
			findAndBindC<RawFileObject>({
				accountID: account.id,
				parentID: 'root',
			}),
		)
		.map(collectResults)
		.map(fileChildren => fileChildren.map(get('id')))
		.map(fileChildren => ({
			accountID: account.id,
			comments: '',
			contentType: 'application/folder',
			created: 0,
			fileChildren,
			fileName: 'Drive',
			forDisplay: false,
			forSlideshow: false,
			kind: 'drive#file',
			permissions: [
				{
					permission: FileUserAccessControlPermissions.READ,
					type: FileUserAccessControlType.ACCOUNTMEMBER,
				},
			],
			id: 'root',
			parentID: null,
			owner: {
				id: 542488,
				type: 'CAPNHQMember',
			},
			folderPath: [
				{
					id: 'root',
					name: 'Drive',
				},
			],
		}));

export const getFilePath = (schema: Schema) => (member: MaybeObj<MemberReference>) => (
	file: RawFileObject,
): ServerEither<
	{
		id: string;
		name: string;
	}[]
> =>
	file.id === 'root' && Maybe.isSome(member)
		? asyncRight(
				[
					{ id: stringifyMemberReference(member.value), name: 'Personal Drive' },
					{ id: file.id, name: file.fileName },
				],
				errorGenerator('Could not get file path'),
		  )
		: file.parentID === null
		? asyncRight(
				[{ id: file.id, name: file.fileName }],
				errorGenerator('Could not get file path'),
		  )
		: Either.isRight(parseStringMemberReference(file.parentID))
		? asyncRight(
				[
					{ id: file.parentID, name: 'Personal Drive' },
					{ id: file.id, name: file.fileName },
				],
				errorGenerator('Could not get file path'),
		  )
		: file.parentID === 'root'
		? asyncRight(
				[
					...Maybe.orSome([] as { id: string; name: string }[])(
						Maybe.map((ref: MemberReference) => [
							{ id: stringifyMemberReference(ref), name: 'Personal Drive' },
						])(member),
					),
					{ id: 'root', name: 'Drive' },
					{ id: file.id, name: file.fileName },
				],
				errorGenerator('Could not get file path'),
		  )
		: getRegularFileObject(schema)(member)(file.parentID).flatMap(parent =>
				getFilePath(schema)(member)(parent).map(path => [
					...path,
					{
						id: parent.id,
						name: parent.fileName,
					},
				]),
		  );

export const getRegularFileObject = (schema: Schema) => (member: MaybeObj<MemberReference>) => (
	fileID: string,
): ServerEither<RawFileObject> =>
	asyncRight(
		findAndBind(schema.getCollection<RawFileObject>('Files'), {
			id: fileID,
		}),
		errorGenerator('Could not get file'),
	)
		.map(collectResults)
		.filter(results => results.length === 1, {
			type: 'OTHER',
			code: 404,
			message: 'Could not find file requested',
		})
		.map(get(0))
		.flatMap(file =>
			getFilePath(schema)(member)(file)
				.map(folderPath => ({
					...file,
					folderPath,
				}))
				// Silently ignore the error, just return the file
				// Good for if a file in the path is deleted
				.leftFlatMap(() =>
					Either.right({
						...file,
						folderPath: [],
					}),
				),
		);

export const getFileObject = (schema: Schema) => (account: AccountObject) => (
	member: MaybeObj<User>,
) => (fileID: string | null): ServerEither<RawFileObject> =>
	(fileID === null
		? asyncLeft<ServerError, string>({
				type: 'OTHER',
				code: 404,
				message: 'Cannot get a file with a null file ID',
		  })
		: asyncRight<ServerError, string>(fileID, errorGenerator('Could not get requested file'))
	).flatMap(id =>
		id === 'root'
			? getRootFileObjectForUser(schema)(account)(member)
			: Either.isRight(parseStringMemberReference(id)) && Maybe.isSome(member)
			? getUserFileObject(schema)(account)(
					(parseStringMemberReference(id) as Right<MemberReference>).value,
			  )
			: getRegularFileObject(schema)(member)(id),
	);

export const expandRawFileObject = (schema: Schema) => (account: AccountObject) => (
	member: MaybeObj<MemberReference>,
) => (file: RawFileObject): ServerEither<FileObject> =>
	getFilePath(schema)(member)(file).map(folderPath => ({
		...file,
		folderPath,
	}));

export const expandFileObject = (schema: Schema) => (account: AccountObject) => (
	file: FileObject,
): ServerEither<FullFileObject> =>
	resolveReference(schema)(account)(file.owner)
		.map(uploader => ({
			...file,
			uploader: Maybe.some(uploader),
		}))
		.leftFlatMap(() =>
			Either.right({
				...file,
				uploader: Maybe.none(),
			}),
		);

export const saveFileObject = (schema: Schema) => (
	fileObject: RawFileObject,
): ServerEither<RawFileObject> =>
	fileObject.id === 'root'
		? asyncLeft({
				type: 'OTHER',
				code: 400,
				message: 'Cannot save root folder',
		  })
		: asyncRight(
				schema.getCollection<RawFileObject>('Files'),
				errorGenerator('Could not save file information'),
		  ).flatMap(saveItemToCollectionA(fileObject));

export const downloadFileObject = (conf: ServerConfiguration) => (file: RawFileObject) => (
	destination: NodeJS.WritableStream,
): ServerEither<void> =>
	file.contentType === 'application/folder'
		? asyncLeft({
				type: 'OTHER' as const,
				code: 400,
				message: 'Cannot download folder',
		  })
		: asyncRight(
				(async () => {
					const readStream = createReadStream(
						join(conf.DRIVE_STORAGE_PATH, `${file.accountID}-${file.id}`),
					);

					readStream.pipe(destination);

					await new Promise((resolve, reject) => {
						readStream.on('end', resolve);
						readStream.on('error', reject);
						destination.on('error', reject);
					});
				})(),
				errorGenerator('Could not download file'),
		  );

export const uploadFile = (conf: ServerConfiguration) => (file: RawFileObject) => (
	fileStream: NodeJS.ReadableStream,
): ServerEither<void> =>
	asyncRight(
		(async () => {
			const writeStream = createWriteStream(
				join(conf.DRIVE_STORAGE_PATH, `${file.accountID}-${file.id}`),
			);

			fileStream.pipe(writeStream);

			await new Promise((resolve, reject) => {
				writeStream.on('close', resolve);
				writeStream.on('error', reject);
				fileStream.on('error', reject);
			});
		})(),
		errorGenerator('Could not upload file'),
	);

export const deleteFileObject = (conf: ServerConfiguration) => (schema: Schema) => (
	account: AccountObject,
) => (file: RawFileObject): ServerEither<void> =>
	file.id === 'root'
		? asyncLeft({
				type: 'OTHER' as const,
				code: 400,
				message: 'Cannot delete root folder',
		  })
		: AsyncEither.All([
				deleteItemFromCollectionA(schema.getCollection<RawFileObject>('Files'))(file),
				asyncRight(
					(async () => {
						if (file.contentType === 'application/folder') {
							return;
						}

						await promisifiedUnlink(
							join(conf.DRIVE_STORAGE_PATH, `${file.accountID}-${file.id}`),
						);
					})(),
					errorGenerator('Could not delete file'),
				),
		  ]).map(destroy);

export const getChildren = (schema: Schema) => (
	file: RawFileObject,
): ServerEither<AsyncIterableIterator<RawFileObject>> => {
	logFunc.extend('getChildren')('Getting children with query: %o', {
		parentID: file.id,
		accountID: file.accountID,
	});

	return asyncRight(
		schema.getCollection<RawFileObject>('Files'),
		errorGenerator('Could not get file children'),
	)
		.map(
			findAndBindC<RawFileObject>({
				parentID: file.id,
				accountID: file.accountID,
			}),
		)
		.map(generateResults)
		.tap(() => {
			if (Either.isRight(parseStringMemberReference(file.id))) {
				logFunc.extend('getChildren')(
					'Getting root file object, as this file is a personal drive',
				);
			}
		})
		.flatMap(results =>
			Either.isRight(parseStringMemberReference(file.id))
				? getRootFileObject(schema)({ id: file.accountID } as AccountObject)
						.map(yieldObjAsync)
						.map(always)
						.map(asyncIterConcat(results))
				: asyncRight(results, errorGenerator('Could not get file children')),
		);
};
