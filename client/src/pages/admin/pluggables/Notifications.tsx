import * as React from 'react';
import { Link } from 'react-router-dom';
import Page, { PageProps } from '../../Page';
import { RequiredMember } from './SiteAdmin';
import { MemberCreateError } from 'common-lib';

export const shouldRenderNotifications = (props: PageProps) => {
	return !!props.member;
};

export default class NotificationsPlug extends Page<RequiredMember> {
	public state: {} = {};

	public render() {
		return (
			<div className="widget">
				<div className="widget-title">Notifications</div>
				<div className="widget-body">
					<div>
						You have{' '}
						{this.props.fullMemberDetails.error === MemberCreateError.NONE
							? this.props.fullMemberDetails.notificationCount
							: 0}{' '}
						unread notifications
						<br />
						<br />
						<Link to="/admin/notifications">View all</Link>
					</div>
				</div>
			</div>
		);
	}
}
