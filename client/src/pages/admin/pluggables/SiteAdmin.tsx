import * as React from 'react';
import { Link } from 'react-router-dom';
import Page, { PageProps } from '../../Page';
import MemberBase from '../../../lib/Members';

export const shouldRenderSiteAdmin = (props: PageProps) => {
	return (
		!!props.member &&
		(props.member.hasPermission('FlightAssign') ||
			props.member.hasPermission('RegistryEdit') ||
			props.member.hasPermission('PermissionManagement'))
	);
};

export interface RequiredMember extends PageProps {
	member: MemberBase;
}

export class SiteAdminWidget extends Page<RequiredMember> {
	public state: {} = {};

	public render() {
		return (
			<div className="widget">
				<div className="widget-title">
					{this.props.member.hasPermission('RegistryEdit') ? 'Site ' : 'Account '}{' '}
					administration
				</div>
				<div className="widget-body">
					<Link to="/admin/flightassign">Assign flight members</Link>
					{this.props.member.hasPermission('RegistryEdit') ? (
						<>
							<br />
							<Link to="/admin/regedit">Site configuration</Link>
							<br />
							<Link to="/admin/permissions">Permission management</Link>
						</>
					) : null}
				</div>
			</div>
		);
	}
}
