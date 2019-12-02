import { just, left, NewTeamMember, none, right } from 'common-lib';
import { asyncEitherHandler, BasicMemberValidatedRequest, Team } from '../../../lib/internals';

export default asyncEitherHandler(
	async (req: BasicMemberValidatedRequest<NewTeamMember, { id: string }>) => {
		let team: Team;

		try {
			team = await Team.Get(req.params.id, req.account, req.mysqlx);
		} catch (e) {
			return left({
				code: 404,
				error: none<Error>(),
				message: 'Could not find team specified'
			});
		}

		team.modifyTeamMember(req.body.reference, req.body.job);

		try {
			await team.save();
		} catch (e) {
			return left({
				code: 500,
				error: just(e),
				message: 'Could not save team'
			});
		}

		return right(void 0);
	}
);
