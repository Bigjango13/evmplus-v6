import * as React from 'react';
import { NavLink, RouteComponentProps, withRouter } from 'react-router-dom';
import BreadCrumbs, { BreadCrumb } from './components/BreadCrumbs';
import Loader from './components/Loader';
import PageRouter from './components/PageRouter';
import SideNavigation, {
	SideNavigationItem
} from './components/SideNavigation';
import { MemberCreateError } from './enums';
import jQuery, { bestfit } from './jquery.textfit';
import myFetch from './lib/myFetch';
import Subscribe from './lib/subscribe';
import Registry from './registry';

export const MessageEventListener = new Subscribe<MessageEvent>();

export class Head extends React.Component {
	public render() {
		return (
			<div>
				<meta name="ROBOTS" content="INDEX, FOLLOW" />
				<title>React app</title>
			</div>
		);
	}
}

const RoutingSearchForm = withRouter(
	class extends React.Component<
		RouteComponentProps<any>,
		{
			text: string;
		}
	> {
		constructor(props: RouteComponentProps<any>) {
			super(props);
			this.handleChange = this.handleChange.bind(this);
			this.handleSubmit = this.handleSubmit.bind(this);
			this.state = {
				text: ''
			};
		}

		public render() {
			return (
				<form id="search" onSubmit={this.handleSubmit}>
					<div role="search">
						<input
							className="searchInput"
							name="search"
							placeholder="Search..."
							type="text"
							aria-label="Search through site content"
							value={this.state.text}
							onChange={this.handleChange}
						/>
						<input
							className="search-btn submitBt"
							name="search"
							placeholder="Search..."
							type="submit"
							value=""
							aria-label="Search through site content"
						/>
					</div>
				</form>
			);
		}

		private handleChange(e: React.FormEvent<HTMLInputElement>) {
			e.preventDefault();
			this.setState({
				text: e.currentTarget.value
			});
		}

		private handleSubmit(e: React.FormEvent<HTMLFormElement>) {
			e.preventDefault();
			this.props.history.push('/search?query=' + this.state.text);
			this.setState({
				text: ''
			});
		}
	}
);

interface AppState {
	Registry: Registry;
	member: SigninReturn;
	tryingMember: boolean;
	sideNavLinks: SideNavigationItem[];
	breadCrumbs: BreadCrumb[];
	allowedSlideshowIDs: string[];
}

export const MemberContext = React.createContext<SigninReturn>({
	error: MemberCreateError.NONE,
	valid: false,
	member: null,
	sessionID: ''
});

export default class App extends React.Component<
	{
		isMobile: boolean;
	},
	AppState
> {
	public key: number;

	public state: AppState = {
		member: {
			valid: false,
			error: MemberCreateError.NONE,
			member: null,
			sessionID: ''
		},
		tryingMember: false,
		Registry: {
			Contact: {},
			Website: {
				Name: '',
				Separator: ''
			}
		},
		sideNavLinks: [],
		breadCrumbs: [],
		allowedSlideshowIDs: []
	};

	private titleElement: HTMLDivElement;

	constructor(props: { isMobile: boolean }) {
		super(props);

		// 		const sid = localStorage.getItem('sid');
		this.authorizeUser = this.authorizeUser.bind(this);
		this.updateBreadCrumbs = this.updateBreadCrumbs.bind(this);
		this.updateSideNav = this.updateSideNav.bind(this);
	}

	public componentDidMount(): void {
		// Load registry
		bestfit(jQuery(this.titleElement));
		myFetch('/api/registry')
			.then(res => {
				return res.json();
			})
			.then((res: { value: Registry }) => {
				this.setState({
					Registry: res.value
				});
			});

		myFetch('/api/banner')
			.then(res => res.json())
			.then((allowedSlideshowIDs: string[]) => {
				this.setState({ allowedSlideshowIDs });
			});

		const sessionID = localStorage.getItem('sessionID');
		if (sessionID) {
			this.setState({
				tryingMember: true
			});
			myFetch('/api/check', {
				headers: {
					authorization: sessionID
				}
			})
				.then(res => res.json())
				.then((member: SigninReturn) => {
					if (!member.valid) {
						localStorage.removeItem('sessionID');
					}
					this.setState({ member, tryingMember: false });
				})
				.catch(() => {
					this.setState({
						member: {
							error: MemberCreateError.INVALID_SESSION_ID,
							member: null,
							sessionID: '',
							valid: false
						},
						tryingMember: false
					});
				});
		}
	}

	public componentWillUnmount() {
		window.onkeydown = () => void 0;
	}

	public render() {
		let countd = 0;

		if (this.state.Registry.Contact.MailingAddress) {
			countd++;
		}
		if (this.state.Registry.Contact.MeetingAddress) {
			countd++;
		}

		const count = ['half', 'third', 'fourth'][countd];

		jQuery('body')
			.removeClass('mobile')
			.removeClass('desktop');
		jQuery('body').addClass(this.props.isMobile ? 'mobile' : 'desktop');

		return (
			<MemberContext.Provider value={this.state.member}>
				<div>
					<div id="mother">
						<div id="bodyContainer">
							<div id="page">
								<header>
									<div id="logo">
										<a>
											<img
												src="/images/logo.png"
												alt="Civil Air Patrol"
												height="127"
											/>
										</a>
									</div>
									<div className="headerDivider" />
									<div
										className="pagetitle"
										ref={div => {
											if (div) {
												this.titleElement = div;
											}
										}}
									>
										{this.state.Registry.Website.Name}
									</div>
									<div className="servings">
										<span className="servingsTitle">
											Citizens Serving
											<br />
											Communities
										</span>
									</div>
									<nav id="mainNavigation">
										<ul>
											<li>
												<NavLink
													to="/"
													exact={true}
													activeClassName="selected"
												>
													Home
												</NavLink>
											</li>
											<li>
												<NavLink
													to="/news"
													activeClassName="selected"
												>
													News
												</NavLink>
											</li>
											<li>
												<NavLink
													to="/calendar"
													activeClassName="selected"
												>
													Calendar
												</NavLink>
											</li>
											<li>
												<NavLink
													to="/photolibrary"
													activeClassName="selected"
												>
													Photo Library
												</NavLink>
											</li>
										</ul>
										<div className="search">
											<RoutingSearchForm />
										</div>
									</nav>
								</header>
								<div id="pageContent">
									<div className="contentBorder" />
									<div className="mainContent">
										<div className="slideshowTop" />
										<div className="slideshow">
											<div className="image" />
										</div>
										<div className="slideshowBottom" />
										<div id="body">
											<div id="content">
												<div id="fb-root" />
												<BreadCrumbs
													links={
														this.state.breadCrumbs
													}
												/>
												{this.state.tryingMember ? (
													<Loader />
												) : (
													<PageRouter
														updateSideNav={
															this.updateSideNav
														}
														updateBreadcrumbs={
															this
																.updateBreadCrumbs
														}
														member={
															this.state.member
														}
														authorizeUser={
															this.authorizeUser
														}
													/>
												)}
											</div>
											<SideNavigation
												links={this.state.sideNavLinks}
												member={this.state.member}
												authorizeUser={
													this.authorizeUser
												}
											/>
										</div>
										<div className="mainContentBottom" />
									</div>
									<div className="contentBorder" />
								</div>
							</div>
						</div>
						<div id="footer">
							<div className="page">
								<div className={count + 'Box'}>
									<div className="footerBoxTitle">
										Connect With Us
									</div>
									<p>
										{[
											this.state.Registry.Contact
												.FaceBook ? (
												<a
													href={
														'https://www.facebook.com/' +
														this.state.Registry
															.Contact.FaceBook
													}
													target="_blank"
													className="socialMedia fb"
												/>
											) : null,
											this.state.Registry.Contact
												.Twitter ? (
												<a
													href={
														'https://www.twitter.com/' +
														this.state.Registry
															.Contact.Twitter
													}
													target="_blank"
													className="socialMedia twitter"
												/>
											) : null,
											this.state.Registry.Contact
												.YouTube ? (
												<a
													href={
														'https://www.youtube.com/channel/' +
														this.state.Registry
															.Contact.YouTube
													}
													target="_blank"
													className="socialMedia youtube"
												/>
											) : null,
											this.state.Registry.Contact
												.LinkedIn ? (
												<a
													href={
														'https://in.linkedin.com/in/' +
														this.state.Registry
															.Contact.LinkedIn
													}
													target="_blank"
													className="socialMedia linkedin"
												/>
											) : null,
											this.state.Registry.Contact
												.Instagram ? (
												<a
													href={
														'https://www.instagram.com/' +
														this.state.Registry
															.Contact.Instagram
													}
													target="_blank"
													className="socialMedia instagram"
												/>
											) : null,
											this.state.Registry.Contact
												.Flickr ? (
												<a
													href={
														'https://www.flickr.com/photos/' +
														this.state.Registry
															.Contact.Flickr
													}
													target="_blank"
													className="socialMedia flickr"
												/>
											) : null
										]}
									</p>
								</div>
								{this.state.Registry.Contact.MeetingAddress ? (
									<div className={count + 'Box'}>
										<div className="footerBoxTitle">
											Meeting Address
										</div>
										<p>
											{`${
												this.state.Registry.Contact
													.MeetingAddress.Name
											}<br />
												${this.state.Registry.Contact.MeetingAddress.FirstLine}<br />
												${this.state.Registry.Contact.MeetingAddress.SecondLine}`}
										</p>
									</div>
								) : null}
								{this.state.Registry.Contact.MailingAddress ? (
									<div className={count + 'Box'}>
										<div className="footerBoxTitle">
											Mailing Address
										</div>
										<p>
											{`${
												this.state.Registry.Contact
													.MailingAddress.Name
											}<br />
												${this.state.Registry.Contact.MailingAddress.FirstLine}<br />
												${this.state.Registry.Contact.MailingAddress.SecondLine}`}
										</p>
									</div>
								) : null}
								<div className={count + 'Box'}>
									<div className="footerBoxTitle">
										Resources
									</div>
									<ul
										style={{
											listStyleType: 'none',
											margin: '0px',
											padding: '0px'
										}}
									>
										<li>
											<a
												target="_blank"
												href="https://www.capnhq.gov/"
											>
												eServices
											</a>
										</li>
										<li>
											<a
												target="_blank"
												href="http://www.cap.news/"
											>
												Latest CAP News
											</a>
										</li>
									</ul>
								</div>
								<div
									style={{
										color: 'white'
									}}
									className="onlyBox"
								>
									<div
										style={{
											float: 'left',
											fontSize: '12px'
										}}
									>
										&copy; 2017-
										{new Date().getFullYear()} CAPUnit.com
									</div>
									<div
										style={{
											float: 'right',
											fontSize: '12px'
										}}
									>
										<a
											target="_blank"
											href="http://www.capmembers.com/"
										>
											CAP Members.com
										</a>{' '}
										|
										<a
											target="_blank"
											href="http://www.cap.news/"
										>
											CAP News
										</a>{' '}
										|
										<a href="#" onClick={this.scrollTop}>
											Top
										</a>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</MemberContext.Provider>
		);
	}

	private scrollTop() {
		jQuery('html').animate({ scrollTop: 0 }, 'slow');
		return false;
	}

	private updateSideNav(links: SideNavigationItem[]) {
		this.setState({ sideNavLinks: links });
	}

	private updateBreadCrumbs(breadCrumbs: BreadCrumb[]) {
		let changed = false;
		if (breadCrumbs.length !== this.state.breadCrumbs.length) {
			changed = true;
		} else {
			for (const i in breadCrumbs) {
				if (breadCrumbs.hasOwnProperty(i)) {
					if (this.state.breadCrumbs[i] === undefined) {
						changed = true;
						break;
					}
					if (
						this.state.breadCrumbs[i].target !==
						breadCrumbs[i].target
					) {
						changed = true;
						break;
					}
					if (
						this.state.breadCrumbs[i].text !== breadCrumbs[i].text
					) {
						changed = true;
						break;
					}
				}
			}
		}
		if (changed) {
			this.setState({ breadCrumbs });
		}
	}

	private authorizeUser(member: SigninReturn) {
		this.setState({ member });
		localStorage.setItem('sessionID', member.sessionID);
	}
}
