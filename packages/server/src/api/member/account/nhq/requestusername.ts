/**
 * Copyright (C) 2020 Andrew Rioux
 *
 * This file is part of EvMPlus.org.
 *
 * EvMPlus.org is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * EvMPlus.org is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with EvMPlus.org.  If not, see <http://www.gnu.org/licenses/>.
 */

import { ServerAPIEndpoint, ServerAPIRequestParameter } from 'auto-client-api';
import {
	api,
	asyncLeft,
	asyncRight,
	CAPNHQMemberReference,
	Either,
	errorGenerator,
	getFullMemberName,
	getMemberEmail,
	Maybe,
	Member,
	pipe,
	SafeUserAccountInformation,
	Some,
	UserAccountInformation,
} from 'common-lib';
import { getRegistry, PAM, resolveReference, sendEmail, ServerEither } from 'server-common';
import { simplifyUserInformation } from 'server-common/dist/member/pam';

const htmlEmailBody = (memberInfo: Member, accountInfo: UserAccountInformation) =>
	`${getFullMemberName(memberInfo)}, your login is ${accountInfo.username}.<br />
Please respond to this email if you have questions regarding your EvMPlus.org account.`;

const textEmailBody = (memberInfo: Member, accountInfo: UserAccountInformation) =>
	`${getFullMemberName(memberInfo)}, your login is ${accountInfo.username}.
Please respond to this email if you have questions regarding your EvMPlus.org account.`;

const sendEmailToMember = (emailFunction: typeof sendEmail) => (
	req: ServerAPIRequestParameter<api.member.account.capnhq.UsernameRequest>,
) => (info: UserAccountInformation<CAPNHQMemberReference>) => (member: Member) => (email: string) =>
	getRegistry(req.mysqlx)(req.account)
		.map(emailFunction(req.configuration)(true))
		.flatMap(sender =>
			sender('Username request')(email)(htmlEmailBody(member, info))(
				textEmailBody(member, info),
			),
		);

export const func: (
	emailFunction?: typeof sendEmail,
) => ServerAPIEndpoint<api.member.account.capnhq.UsernameRequest> = (
	emailFunction = sendEmail,
) => req =>
	asyncRight(
		PAM.verifyCaptcha(req.body.captchaToken, req.configuration),
		errorGenerator('Could not verify CAPTCHA token'),
	)
		.filter(success => success, {
			type: 'OTHER',
			code: 400,
			message: 'Could not verify CAPTCHA token',
		})
		.map(() =>
			PAM.getInformationForMember(req.mysqlx, {
				type: 'CAPNHQMember' as const,
				id: req.body.capid,
			})
				.then(simplifyUserInformation)
				.then(Maybe.some)
				.catch(Maybe.none),
		)
		.filter(Maybe.isSome, {
			type: 'OTHER',
			code: 400,
			message: 'Username not found',
		})
		.map(info => info as Some<SafeUserAccountInformation<CAPNHQMemberReference>>)
		.flatMap(info =>
			resolveReference(req.mysqlx)(req.account)(info.value.member).flatMap(member =>
				pipe(
					Maybe.map<string, ServerEither<void>>(
						sendEmailToMember(emailFunction)(req)(info.value)(member),
					),
					Maybe.orSome<ServerEither<void>>(
						asyncLeft({
							type: 'OTHER',
							code: 400,
							message:
								'There is no email address associated with the account requested',
						}),
					),
				)(getMemberEmail(member.contact)),
			),
		)
		.leftFlatMap(err =>
			err.message === 'Username not found' ? Either.right(void 0) : Either.left(err),
		);

export default func();
