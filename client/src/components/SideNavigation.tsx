import $ from 'jquery';
import * as React from 'react';
import { Link, withRouter, RouteComponentProps } from 'react-router-dom';
import { MemberCreateError } from 'common-lib/index';
import SigninLink from './SigninLink';
import MemberBase from '../lib/Members';
import { SigninReturn } from 'common-lib';

class SideNavigationLink extends React.Component<{ target: string }> {
	public render() {
		return (
			<Link to={this.props.target}>
				<span className="arrow" />
				<span>{this.props.children}</span>
			</Link>
		);
	}
}
class SideNavigationReferenceLink extends React.Component<{
	target: string;
}> {
	constructor(props: {target: string}) {
		super(props);

		this.navigateTo = this.navigateTo.bind(this);
	}

	public render() {
		return (
			<a
				href={`#${this.props.target}`}
				onClick={this.navigateTo}
			>
				<span className="arrow" />
				<span>{this.props.children}</span>
			</a>
		);
	}

	private navigateTo(e: React.MouseEvent<HTMLAnchorElement>) {
		e.preventDefault();

		const offset = $(`#${this.props.target}`).offset();

		if (offset) {
			$('html').animate(
				{
					scrollTop: offset.top - 100
				},
				1000
			);
		}
	}
}

export type SideNavigationItem =
	| { type: 'Reference'; target: string; text: React.ReactChild }
	| { type: 'Link'; target: string; text: React.ReactChild };

export interface SideNavigationProps extends RouteComponentProps<{}> {
	links: SideNavigationItem[];
	member: MemberBase | null;
	fullMemberDetails: SigninReturn;
	authorizeUser: (arg: SigninReturn) => void;
}

const cursor: React.CSSProperties = {
	cursor: 'pointer'
};

export class SideNavigation extends React.Component<SideNavigationProps> {
	constructor(props: SideNavigationProps) {
		super(props);

		this.signOut = this.signOut.bind(this);
		this.goBack = this.goBack.bind(this);
	}

	public render() {
		return (
			<div id="sidenav">
				<ul id="nav">
					<li>
						{this.props.member ? (
							<a onClick={this.signOut} style={cursor}>
								<span className="arrow" />
								<span>
									Sign out {this.props.member.getFullName()}
								</span>
							</a>
						) : (
							<SigninLink
								{...this.props.fullMemberDetails}
								authorizeUser={this.props.authorizeUser}
							>
								<span className="arrow" />
								<span>Sign in</span>
							</SigninLink>
						)}
					</li>
					{this.props.member ? (
						<li>
							<SideNavigationLink target={'/admin/notifications'}>
								Unread Notifications: {this.props.fullMemberDetails.notificationCount}
							</SideNavigationLink>
						</li>
					) : null}
					<li>
						<a onClick={this.goBack} style={cursor}>
							<span className="arrow" />
							<span>Go back</span>
						</a>
					</li>
					{this.props.links.map((link, i) => (
						<li key={i}>
							{link.type === 'Link' ? (
								<SideNavigationLink target={link.target}>
									{link.text}
								</SideNavigationLink>
							) : (
								<SideNavigationReferenceLink
									target={link.target}
								>
									{link.text}
								</SideNavigationReferenceLink>
							)}
						</li>
					))}
				</ul>
			</div>
		);
	}


	private signOut() {
		this.props.authorizeUser({
			valid: false,
			error: MemberCreateError.NONE,
			member: null,
			sessionID: '',
			notificationCount: 0,
			taskCount: 0
		});
		localStorage.removeItem('sessionID');
	}

	private goBack() {
		this.props.history.goBack();
	}
}

export default withRouter(SideNavigation);
