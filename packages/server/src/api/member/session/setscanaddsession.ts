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

import { ServerAPIEndpoint } from 'auto-client-api';
import { api, canFullyManageEvent, SessionType } from 'common-lib';
import { ensureResolvedEvent, getEvent, PAM } from 'server-common';

export const func: (
	now?: () => number,
) => ServerAPIEndpoint<api.member.session.SetScanAddSession> = (now = Date.now) =>
	PAM.RequireSessionType(SessionType.REGULAR)(req =>
		getEvent(req.mysqlx)(req.account)(req.body.eventID)
			.filter(canFullyManageEvent(req.member), {
				type: 'OTHER',
				code: 403,
				message: 'You do not have permission to manage this event',
			})
			.flatMap(ensureResolvedEvent(req.mysqlx))
			.filter(event => event.meetDateTime > now(), {
				type: 'OTHER',
				code: 403,
				message: 'You cannot record attendance for this event until it has started',
			})
			.flatMap(({ pickupDateTime, id }) =>
				PAM.updateSession(req.mysqlx, {
					expires: pickupDateTime,
					id: req.session.id,
					sessionData: {
						accountID: req.account.id,
						eventID: id,
					},
					type: SessionType.SCAN_ADD,
					userAccount: req.session.userAccount,
				}),
			),
	);

export default func();
