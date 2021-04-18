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

import {
	AccountType,
	api,
	asyncRight,
	errorGenerator,
	RawCAPWingAccountObject,
	SessionType,
} from 'common-lib';
import {
	Backends,
	BasicAccountRequest,
	combineBackends,
	getCombinedAttendanceBackend,
	getCombinedPAMBackend,
	PAM,
	withBackends,
	GenBackend,
} from 'server-common';
import { Endpoint } from '../../..';
import wrapper from '../../../lib/wrapper';

export const func: Endpoint<
	Backends<[GenBackend<typeof getCombinedAttendanceBackend>, PAM.PAMBackend]>,
	api.events.accounts.AddEventAccount
> = backend =>
	PAM.RequireSessionType(SessionType.REGULAR)(req =>
		asyncRight(req.account, errorGenerator('Could not create Account'))
			.filter(
				(account): account is RawCAPWingAccountObject =>
					account.type === AccountType.CAPWING,
				{
					type: 'OTHER',
					code: 400,
					message: 'Parent Account must be a wing account',
				},
			)
			.flatMap(parentAccount =>
				backend.createCAPEventAccount(backend)(parentAccount)(req.member)(
					req.body.accountID,
				)(req.body.accountName)(req.body.event),
			)
			.map(wrapper),
	);

export default withBackends(
	func,
	combineBackends<
		BasicAccountRequest,
		[GenBackend<typeof getCombinedAttendanceBackend>, PAM.PAMBackend]
	>(getCombinedAttendanceBackend, getCombinedPAMBackend),
);
