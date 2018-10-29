import * as express from 'express';
import { MemberCreateError } from '../enums';
import { ConditionalMemberRequest } from '../lib/MemberBase';
import { json } from '../lib/Util';

export default (req: ConditionalMemberRequest, res: express.Response) => {
	if (!!req.member) {
		json<SigninReturn>(res, {
			error: MemberCreateError.NONE,
			sessionID: req.member.sessionID,
			member: req.member.toRaw(),
			valid: true
		});
	} else {
		json<SigninReturn>(res, {
			error: MemberCreateError.INVALID_SESSION_ID,
			valid: false,
			sessionID: '',
			member: null
		});
	}
};
