import MemberBase from "../../lib/Members";
import { asyncErrorHandler } from "../../lib/Util";
import { MemberValidatedRequest } from "../../lib/validator/Validator";
import { FlightAssign } from "../../lib/validator/validators/FlightAssignValidator";

export default asyncErrorHandler(async (req: MemberValidatedRequest<FlightAssign>, res) => {
	const member = await MemberBase.ResolveReference(req.body.member, req.account, req.mysqlx);

	if (member == null) {
		res.status(404);
		return res.end();
	}

	member.setFlight(req.body.newFlight);

	await member.saveExtraMemberInformation(req.mysqlx);

	res.status(201);
	res.end();
});