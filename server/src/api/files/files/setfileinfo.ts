import * as express from 'express';
import { MemberValidatedRequest } from 'src/lib/validator/Validator';
import File from '../../../lib/File';
import { asyncErrorHandler } from '../../../lib/Util';

export default asyncErrorHandler(
	async (
		req: MemberValidatedRequest<Partial<EditableFileObjectProperties>>,
		res: express.Response
	) => {
		let file: File;

		try {
			file = await File.Get(req.params.fileid, req.account, req.mysqlx);
		} catch (e) {
			res.status(404);
			res.end();
			return;
		}

		file.set(req.body);

		await file.save();

		res.status(204);
		res.end();
	}
);
