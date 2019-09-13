import { Response } from 'express';
import { MemberRequest } from '../../lib/Members';
import Team from '../../lib/Team';
import { asyncErrorHandler } from '../../lib/Util';

export default asyncErrorHandler(async (req: MemberRequest<{ id: string }>, res: Response) => {
	let team: Team;

	try {
		team = await Team.Get(req.params.id, req.account, req.mysqlx);
	} catch (e) {
		res.status(404);
		res.end();
		return;
	}

	await team.delete();

	res.status(204);
	res.end();
});
