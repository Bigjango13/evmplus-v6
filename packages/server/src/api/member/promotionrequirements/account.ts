/**
 * Copyright (C) 2020 Andrew Rioux
 *
 * This file is part of evmplus-v6.
 *
 * emv6 is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * emv6 is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with emv6.  If not, see <http://www.gnu.org/licenses/>.
 */

import {
	api,
	asyncIterFilter,
	asyncIterMap,
	CAPNHQMemberObject,
	Either,
	EitherObj,
	get,
	Maybe,
	Permissions,
	Right,
	ServerError,
	SessionType,
} from 'common-lib';
import {
	Backends,
	CAP,
	getCombinedMemberBackend,
	PAM,
	TeamsBackend,
	withBackends,
} from 'server-common';
import { Endpoint } from '../../..';
import wrapper from '../../../lib/wrapper';

export const func: Endpoint<
	Backends<[TeamsBackend, CAP.CAPMemberBackend]>,
	api.member.promotionrequirements.RequirementsForCadetsInAccount
> = backend =>
	PAM.RequiresPermission(
		'PromotionManagement',
		Permissions.PromotionManagement.FULL,
	)(
		PAM.RequireSessionType(SessionType.REGULAR)(req =>
			backend
				.getNHQMembersInAccount(backend)(req.account)
				.filter(Maybe.isSome, {
					type: 'OTHER',
					code: 400,
					message: 'Account does not have CAP NHQ members',
				})
				.map(get('value'))
				.map(asyncIterFilter(member => !member.seniorMember))
				.map(
					asyncIterMap<
						CAPNHQMemberObject,
						EitherObj<
							ServerError,
							api.member.promotionrequirements.PromotionRequrementsItem
						>
					>(member =>
						backend.getPromotionRequirements(member).map(requirements => ({
							member,
							requirements,
						})),
					),
				)
				.map(
					asyncIterFilter<
						EitherObj<
							ServerError,
							api.member.promotionrequirements.PromotionRequrementsItem
						>,
						Right<api.member.promotionrequirements.PromotionRequrementsItem>
					>(Either.isRight),
				)
				.map(
					asyncIterMap<
						Right<api.member.promotionrequirements.PromotionRequrementsItem>,
						api.member.promotionrequirements.PromotionRequrementsItem
					>(get('value')),
				)
				.map(wrapper),
		),
	);

export default withBackends(func, getCombinedMemberBackend());
