import { NotificationTargetType } from 'common-lib/index';
import { MemberRequest } from '../../../lib/Members';
import { Notification } from '../../../lib/Notification';
import { asyncErrorHandler } from '../../../lib/Util';

export default asyncErrorHandler(async (req: MemberRequest<{ id: string }>, res) => {
	if (parseInt(req.params.id, 10) !== parseInt(req.params.id, 10)) {
		res.status(400);
		return res.end();
	}

	const id = parseInt(req.params.id, 10);

	try {
		const notification = await Notification.Get(
			id,
			{
				type: NotificationTargetType.MEMBER,
				to: req.member.getReference()
			},
			req.account,
			req.mysqlx
		);

		notification.markAsRead();

		await notification.save();

		res.status(200);
		res.end();
	} catch (e) {
		res.status(404);
		res.end();
	}
});
