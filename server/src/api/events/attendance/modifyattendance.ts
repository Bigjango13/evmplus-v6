import { Response } from 'express';
import Event from '../../../lib/Event';
import MemberBase, { MemberRequest } from '../../../lib/MemberBase';
import { asyncErrorHandler, json } from '../../../lib/Util';

export default asyncErrorHandler(async (req: MemberRequest, res: Response) => {
	let event: Event;
	let member: MemberBase;

	if (
		req.body === undefined ||
		req.body.comments === undefined ||
		req.body.status === undefined ||
		req.body.requirements === undefined ||
		req.body.planToUseCAPTransportation === undefined ||
		(req.body.arrivalTime !== undefined &&
			req.body.departureTime !== undefined) ||
		(typeof req.body.arrivalTime !== 'number' &&
			typeof req.body.departureTime !== 'number')
	) {
		res.status(400);
		res.end();
		return;
	}

	try {
		event = await Event.Get(req.params.id, req.account, req.mysqlx);
	} catch (e) {
		res.status(500);
		res.end();
		return;
	}

	if (
		MemberBase.isReference(req.body.member) &&
		(req.member.hasPermission('SignUpEdit') || event.isPOC(req.member))
	) {
		member = await MemberBase.ResolveReference(
			req.body.member,
			req.account,
			req.mysqlx
		);
	} else {
		member = req.member;
	}

	event.modifyAttendanceRecord(
		{
			arrivalTime: req.body.arrivalTime,
			comments: req.body.comments,
			departureTime: req.body.departureTime,
			planToUseCAPTransportation: req.body.planToUseCAPTransportation,
			requirements: req.body.requirements,
			status: req.body.status
		},
		member
	);

	await event.save();

	json<AttendanceRecord[]>(res, event.attendance);
});
