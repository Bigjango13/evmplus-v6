import * as express from 'express';
import { AccountRequest } from '../../../lib/Account';
import { MemberRequest } from '../../../lib/Member';
import * as fs from 'fs';
import { join } from 'path';
import { Configuration } from '../../../conf';

export default async (req: AccountRequest & MemberRequest, res: express.Response) => {
	if (
		typeof req.account !== 'undefined'
	) {
		await req.connectionPool.query(
			'DELETE FROM FileInfo WHERE id = ? AND AccountID = ?',
			[req.params.id, req.account.id],
		);

		fs.unlink(join(Configuration.fileStoragePath, req.params.id), err => {
			if (err) {
				res.status(500);
				res.end();
			} else {
				res.status(204);
				res.end();
			}
		});

	} else {
		res.status(400);
		res.end();
	}
};
