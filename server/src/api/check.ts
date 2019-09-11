import { NHQMemberObject, ProspectiveMemberObject, SigninReturn } from 'common-lib';
import { MemberCreateError } from 'common-lib/index';
import * as express from 'express';
import { ConditionalMemberRequest } from '../lib/Members';
import { json } from '../lib/Util';

export default async (req: ConditionalMemberRequest, res: express.Response) => {
	if (!!req.member) {
		const [taskCount, notificationCount] = await Promise.all([
			req.member.getUnreadNotificationCount(),
			req.member.getUnfinishedTaskCount()
		]);

		const member = req.member.toRaw() as ProspectiveMemberObject | NHQMemberObject;

		json<SigninReturn>(res, {
			error: MemberCreateError.NONE,
			sessionID: req.member.sessionID,
			member,
			valid: true,
			notificationCount,
			taskCount
		});
	} else {
		json<SigninReturn>(res, {
			error: MemberCreateError.INVALID_SESSION_ID,
			valid: false,
			sessionID: '',
			member: null,
			notificationCount: 0,
			taskCount: 0
		});
	}
};
