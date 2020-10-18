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
	ClientUser,
	hasPermission,
	hasOneDutyPosition,
	AccountType,
	Permissions,
} from 'common-lib';
import * as React from 'react';
import { Link } from 'react-router-dom';
import Page, { PageProps } from '../../Page';

export const shouldRenderSiteAdmin = (props: PageProps) => {
	return !!props.member;
};

export interface RequiredMember extends PageProps {
	member: ClientUser;
}

export class SiteAdminWidget extends Page<RequiredMember> {
	public state: {} = {};

	public render() {
		return (
			<div className="widget">
				<div className="widget-title">
					{hasPermission('RegistryEdit')(Permissions.RegistryEdit.YES)(this.props.member)
						? 'Site '
						: hasPermission('FlightAssign')(Permissions.FlightAssign.YES)(
								this.props.member,
						  ) ||
						  ((this.props.member.type === 'CAPNHQMember' ||
								this.props.member.type === 'CAPProspectiveMember') &&
								this.props.member.seniorMember)
						? 'Account '
						: 'Personal '}
					administration
				</div>
				<div className="widget-body">
					<Link to="/eventlinklist">Event List</Link>
					<br />
					<Link to="/admin/attendance">View Attendance</Link>
					<br />
					<Link to="/admin/setupmfa">Setup MFA</Link>
					<br />
					<Link to="/admin/tempdutypositions">Manage duty positions</Link>
					{(this.props.account.type === AccountType.CAPSQUADRON ||
						this.props.account.type === AccountType.CAPEVENT) &&
					hasPermission('FlightAssign')(Permissions.FlightAssign.YES)(
						this.props.member,
					) ? (
						<>
							<br />
							<Link to="/admin/flightassign">Assign flight members</Link>
						</>
					) : null}
					{hasPermission('RegistryEdit')(Permissions.RegistryEdit.YES)(
						this.props.member,
					) ? (
						<>
							<br />
							<Link to="/admin/regedit">Site configuration</Link>
						</>
					) : null}
					{hasPermission('PermissionManagement')(Permissions.PermissionManagement.FULL)(
						this.props.member,
					) ? (
						<>
							<br />
							<Link to="/admin/permissions">Permission management</Link>
						</>
					) : null}
					{(this.props.member.type === 'CAPProspectiveMember' ||
						this.props.member.type === 'CAPNHQMember') &&
					(this.props.member.seniorMember ||
						hasOneDutyPosition([
							'Cadet Commander',
							'Cadet Deputy Commander',
							'Cadet Executive Officer',
						])(this.props.member)) ? (
						<>
							<br />
							<Link to="/admin/emaillist">Email selector</Link>
						</>
					) : null}
				</div>
			</div>
		);
	}
}
