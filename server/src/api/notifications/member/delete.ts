import { NotificationTargetType } from 'common-lib/index';
import { asyncErrorHandler, MemberRequest, Notification } from '../../../lib/internals';

export default asyncErrorHandler(async (req: MemberRequest<{ id: string }>, res) => {
	if (parseInt(req.params.id, 10) !== parseInt(req.params.id, 10)) {
		res.status(400);
		return res.end();
	}

	const id = parseInt(req.params.id, 10);

	try {
		const notification = await Notification.GetOfTarget(
			id,
			{
				type: NotificationTargetType.MEMBER,
				to: req.member.getReference()
			},
			req.account,
			req.mysqlx
		);

		notification.markAsRead();

		await notification.delete();

		res.status(200);
		res.end();
	} catch (e) {
		res.status(404);
		res.end();
	}
});
