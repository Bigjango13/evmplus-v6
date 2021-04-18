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

import { api, destroy, Permissions, SessionType } from 'common-lib';
import { Backends, getCombinedTeamsBackend, PAM, TeamsBackend, withBackends } from 'server-common';
import { Endpoint } from '../..';
import wrapper from '../../lib/wrapper';

export const func: Endpoint<Backends<[TeamsBackend]>, api.team.DeleteTeam> = backend =>
	PAM.RequireSessionType(SessionType.REGULAR)(
		PAM.RequiresPermission(
			'ManageTeam',
			Permissions.ManageTeam.FULL,
		)(req =>
			backend
				.getTeam(req.account)(parseInt(req.params.id, 10))
				.flatMap(backend.deleteTeam)
				.map(destroy)
				.map(wrapper),
		),
	);

export default withBackends(func, getCombinedTeamsBackend);
