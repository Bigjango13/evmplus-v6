import * as express from 'express';
import { MemberRequest } from '../../../lib/MemberBase';
import { modifyAndBind } from '../../../lib/MySQLUtil';

export default async (req: MemberRequest, res: express.Response) => {
	if (
		typeof req.params.parentid === 'undefined' ||
		typeof req.body === 'undefined' ||
		typeof req.body.id === 'undefined'
	) {
		res.status(400);
		res.end();
		return;
	}

	const parentid = req.params.parentid;
	const childid = req.body.id;

	const filesCollection = req.mysqlx.getCollection<FileObject>('Files');

	await Promise.all([
		modifyAndBind(filesCollection, {
			accountID: req.account.id,
			id: parentid
		})
			.arrayAppend('fileChildren', childid)
			.execute(),
		modifyAndBind(filesCollection, {
			accountID: req.account.id,
			id: childid
		})
			.set('parentID', parentid)
			.execute()
	]);

	res.status(204);
};
