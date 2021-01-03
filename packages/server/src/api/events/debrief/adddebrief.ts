/**
 * Copyright (C) 2020 Andrew Rioux and Glenn Rioux
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
import {
	always,
	api,
	EventType,
	FromDatabase,
	get,
	getFullMemberName,
	RawRegularEventObject,
	SessionType,
	toReference,
} from 'common-lib';
import { getEvent, PAM, saveEventFunc } from 'server-common';
import wrapper from '../../../lib/wrapper';

export const func: (now?: () => number) => ServerAPIEndpoint<api.events.debrief.Add> = (
	now = Date.now,
) =>
	PAM.RequireSessionType(SessionType.REGULAR)(req =>
		getEvent(req.mysqlx)(req.account)(req.params.id)
			.filter(event => event.type === EventType.REGULAR, {
				type: 'OTHER',
				code: 403,
				message: 'You cannot modify debrief items of a linked event',
			})
			.map(event => event as FromDatabase<RawRegularEventObject>)
			.map<[FromDatabase<RawRegularEventObject>, FromDatabase<RawRegularEventObject>]>(
				oldEvent => [
					oldEvent,
					{
						...oldEvent,
						debrief: [
							...oldEvent.debrief,
							{
								debriefText: req.body.debriefText,
								publicView: req.body.publicView,
								memberRef: toReference(req.member),
								memberName: getFullMemberName(req.member),
								timeSubmitted: now(),
							},
						],
					},
				],
			)
			.flatMap(([oldEvent, newEvent]) =>
				saveEventFunc(now)(req.configuration)(req.mysqlx)(req.account)(req.member)(
					oldEvent,
				)(newEvent).map(always(newEvent)),
			)
			.map(get('debrief'))
			.map(wrapper),
	);

export default func();
